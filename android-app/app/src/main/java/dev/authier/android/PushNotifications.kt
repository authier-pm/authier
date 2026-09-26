package dev.authier.android

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

object PushNotifications {
    const val CHANNEL = "device-approvals"

    fun createChannel(context: Context) {
        context.getSystemService(NotificationManager::class.java).createNotificationChannel(
            NotificationChannel(CHANNEL, "Device sign-in requests", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Requests to sign in to Authier on another device"
                lockscreenVisibility = android.app.Notification.VISIBILITY_PRIVATE
            }
        )
    }

    fun show(context: Context, title: String, body: String, id: Int) {
        createChannel(context)
        if (!NotificationManagerCompat.from(context).areNotificationsEnabled()) return
        val intent = Intent(context, MainActivity::class.java)
            .putExtra("type", "Devices")
            .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        val pending = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val notification = NotificationCompat.Builder(context, CHANNEL)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title).setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
            .setContentIntent(pending).setAutoCancel(true).build()
        context.getSystemService(NotificationManager::class.java).notify(id, notification)
    }
}

class AuthierMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        // Fetch the latest token inside durable work, so rotation and offline delivery retry.
        PushTokenWorker.enqueue(this)
    }

    override fun onMessageReceived(message: RemoteMessage) {
        if (VaultStore(this).read().sealedTokens.isBlank()) return
        val notification = message.notification
        if (notification == null && message.data["type"] != "Devices") return
        PushNotifications.show(this, notification?.title ?: "New device sign-in",
            notification?.body ?: "Open Authier to review the device request.",
            message.messageId?.hashCode() ?: 1)
    }
}
