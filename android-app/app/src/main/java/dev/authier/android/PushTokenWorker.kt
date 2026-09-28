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
        if (store.read().sealedTokens.isBlank()) return Result.success()
        return try {
            val token = FirebaseMessaging.getInstance().token.await()
            withSavedSession(store) { api -> api.updatePushToken(token) }
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
