package dev.authier.android

import android.content.Context
import androidx.work.*
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.tasks.await

/** Registers only a transport token; this worker never needs the unlocked vault key. */
class PushTokenWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        val store = VaultStore(applicationContext)
        val snapshot = store.read()
        if (snapshot.sealedTokens.isBlank()) return Result.success()
        return try {
            val token = FirebaseMessaging.getInstance().token.await()
            val tokens = store.openTokens(snapshot.sealedTokens) ?: return Result.success()
            val api = ApiFacade(snapshot.serverUrl, snapshot.deviceId).apply { accessToken = tokens.accessToken }
            try {
                api.updatePushToken(token)
            } catch (error: ApiFailure) {
                if (error.status != 401) throw error
                val refreshed = api.refresh(tokens.refreshToken)
                val sealed = store.sealTokens(refreshed)
                // Merge only token changes. Never restore a logged-out account or overwrite
                // ciphertext/outbox writes that happened while the request was in flight.
                val current = store.update { latest ->
                    if (latest.deviceId == snapshot.deviceId && latest.serverUrl == snapshot.serverUrl &&
                        latest.email == snapshot.email && latest.sealedTokens == snapshot.sealedTokens)
                        latest.copy(sealedTokens = sealed)
                    else latest
                }
                if (current.sealedTokens != sealed) return Result.retry()
                api.accessToken = refreshed.accessToken
                api.updatePushToken(token)
            }
            Result.success()
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (error: Exception) {
            // WorkManager owns the retry boundary. Do not log tokens or server response bodies.
            android.util.Log.w("Authier", "Push registration pending (${error.javaClass.simpleName})")
            if (error is ApiFailure && error.status in listOf(401, 403)) Result.failure() else Result.retry()
        }
    }

    companion object {
        fun enqueue(context: Context) {
            val work = OneTimeWorkRequestBuilder<PushTokenWorker>()
                .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
                .build()
            WorkManager.getInstance(context).enqueueUniqueWork("register-push-token", ExistingWorkPolicy.APPEND_OR_REPLACE, work)
        }
    }
}
