package dev.authier.android

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import androidx.core.app.NotificationCompat
import androidx.work.*
import dev.authier.android.crypto.AuthierCrypto
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import java.util.UUID
import java.util.concurrent.TimeUnit
import javax.crypto.SecretKey

/** Plaintext of a relayed code, matching shared/relayedVerificationCode.ts. */
@Serializable
internal data class RelayedCodePayload(val v: Int = 1, val code: String, val sender: String, val receivedAt: Long)

object SmsCodeRelay {
    const val LIFETIME_MS = 10 * 60 * 1000L
    private const val CHANNEL = "sms-code-relay"

    internal fun senderLabel(address: String): String =
        address.replace(Regex("\\s+"), " ").trim().take(64).ifBlank { "Unknown sender" }

    /** Only the code and sender leave the phone, encrypted with the vault key. */
    internal fun encrypt(key: SecretKey, encryptionSalt: String, code: String, sender: String, receivedAt: Long): String =
        AuthierCrypto.encrypt(key, vaultJson.encodeToString(RelayedCodePayload(code = code, sender = senderLabel(sender), receivedAt = receivedAt)), encryptionSalt)

    /**
     * Called for each incoming SMS. Relays only when enabled, signed in and unlocked:
     * a valid timed unlock provides the key without prompting, a locked vault sends nothing.
     */
    fun relay(context: Context, sender: String, body: String, receivedAt: Long = System.currentTimeMillis()) {
        val snapshot = VaultStore(context).read()
        if (!snapshot.relaySmsCodes || snapshot.sealedTokens.isBlank()) return
        val code = SmsCodeExtractor.extract(body) ?: return
        val key = VaultUnlockStore(context).restore(snapshot) ?: return
        val encrypted = encrypt(key, snapshot.encryptionSalt, code, sender, receivedAt)
        SmsCodeRelayWorker.enqueue(context, UUID.randomUUID().toString(), encrypted, receivedAt + LIFETIME_MS)
    }

    internal fun notification(context: Context): Notification {
        context.getSystemService(NotificationManager::class.java).createNotificationChannel(
            NotificationChannel(CHANNEL, "Sending SMS codes to browsers", NotificationManager.IMPORTANCE_LOW)
        )
        return NotificationCompat.Builder(context, CHANNEL)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("Sending verification code")
            .setContentText("Your browser receives it end-to-end encrypted.")
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
}

class SmsCodeReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
        // Long texts arrive in several parts from the same sender.
        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent).orEmpty()
            .groupBy { it.displayOriginatingAddress.orEmpty() }
            .mapValues { (_, parts) -> parts.joinToString("") { it.displayMessageBody.orEmpty() } }
        if (messages.isEmpty()) return
        val pending = goAsync()
        val app = context.applicationContext
        CoroutineScope(Dispatchers.Default).launch {
            // An exception here would crash Authier whenever any text message arrives.
            try {
                messages.forEach { (sender, body) -> SmsCodeRelay.relay(app, sender, body) }
            } catch (error: Exception) {
                android.util.Log.w("Authier", "SMS code was not relayed (${error.javaClass.simpleName})")
            } finally {
                pending.finish()
            }
        }
    }
}

/** Uploads ciphertext only; it never needs the vault key and gives up once the code expires. */
class SmsCodeRelayWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        val id = inputData.getString(ID) ?: return Result.failure()
        val encrypted = inputData.getString(ENCRYPTED) ?: return Result.failure()
        if (System.currentTimeMillis() >= inputData.getLong(EXPIRES_AT, 0)) return Result.success()
        return try {
            withSavedSession(VaultStore(applicationContext)) { api -> api.relayVerificationCode(id, encrypted) }
            Result.success()
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (error: Exception) {
            // Retries reuse the id, so the server stores the code once. Never log the ciphertext.
            android.util.Log.w("Authier", "SMS code relay pending (${error.javaClass.simpleName})")
            if (error is ApiFailure && error.status in 400..499 && error.status != 408) Result.failure() else Result.retry()
        }
    }

    // Android 11 and older run expedited work as a foreground service.
    override suspend fun getForegroundInfo() = ForegroundInfo(NOTIFICATION_ID, SmsCodeRelay.notification(applicationContext))

    companion object {
        private const val ID = "id"
        private const val ENCRYPTED = "encrypted"
        private const val EXPIRES_AT = "expiresAt"
        private const val NOTIFICATION_ID = 7_104

        fun enqueue(context: Context, id: String, encrypted: String, expiresAt: Long) {
            val work = OneTimeWorkRequestBuilder<SmsCodeRelayWorker>()
                .setInputData(workDataOf(ID to id, ENCRYPTED to encrypted, EXPIRES_AT to expiresAt))
                .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
                .setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
                .setBackoffCriteria(BackoffPolicy.LINEAR, WorkRequest.MIN_BACKOFF_MILLIS, TimeUnit.MILLISECONDS)
                .build()
            WorkManager.getInstance(context).enqueueUniqueWork("relay-sms-code-$id", ExistingWorkPolicy.KEEP, work)
        }
    }
}
