package dev.authier.android

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import java.io.File
import java.io.IOException
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import okhttp3.OkHttpClient
import okhttp3.Request

internal object SmsModelDownload {
    const val WORK = "download-sms-minilm"
    const val BYTES = "bytes"
    const val TOTAL = "total"
    fun files(context: Context): SmsModelFiles {
        val manifest = context.assets.open("smsModelManifest.json").bufferedReader().use {
            Json.decodeFromString<SmsModelManifest>(it.readText())
        }
        return SmsModelFiles(File(context.noBackupFilesDir, "sms-model"), manifest)
    }

    fun ensure(context: Context) {
        if (files(context).readyDirectory() != null) return
        WorkManager.getInstance(context).enqueueUniqueWork(WORK, ExistingWorkPolicy.KEEP,
            OneTimeWorkRequestBuilder<SmsModelDownloadWorker>()
                .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
                .build())
    }

    fun cancel(context: Context) { WorkManager.getInstance(context).cancelUniqueWork(WORK) }
}

class SmsModelDownloadWorker(context: Context, parameters: WorkerParameters) : CoroutineWorker(context, parameters) {
    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        if (!VaultStore(applicationContext).read().relaySmsCodes) return@withContext Result.success()
        val files = SmsModelDownload.files(applicationContext)
        if (files.readyDirectory() != null) return@withContext Result.success()
        val client = OkHttpClient.Builder().followSslRedirects(false)
            .connectTimeout(30, TimeUnit.SECONDS).readTimeout(60, TimeUnit.SECONDS).build()
        val total = files.manifest.files.sumOf { it.bytes }
        var completed = 0L
        files.begin()
        try {
            for (entry in files.manifest.files) {
                ensureActive()
                val request = Request.Builder().url("${files.manifest.baseUrl}/${entry.name}").build()
                client.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) throw IOException("SMS model download HTTP ${response.code}")
                    val body = response.body ?: throw IOException("Empty SMS model response")
                    var reported = 0L
                    files.write(entry, body.byteStream()) { bytes ->
                        ensureActive()
                        if (bytes - reported >= 1024 * 1024 || bytes == entry.bytes) {
                            setProgressAsync(workDataOf(SmsModelDownload.BYTES to completed + bytes, SmsModelDownload.TOTAL to total))
                            reported = bytes
                        }
                    }
                }
                completed += entry.bytes
            }
            ensureActive()
            if (!VaultStore(applicationContext).read().relaySmsCodes) return@withContext Result.success()
            files.finish()
            Result.success()
        } catch (_: IOException) {
            // Network/integrity failures are retryable; cancellation propagates to WorkManager.
            if (runAttemptCount < 3) Result.retry() else Result.failure()
        } finally {
            files.discardPartial()
            client.connectionPool.evictAll()
            client.dispatcher.executorService.shutdown()
        }
    }
}
