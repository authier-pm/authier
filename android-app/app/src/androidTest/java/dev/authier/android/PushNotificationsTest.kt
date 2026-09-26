package dev.authier.android

import android.Manifest
import android.app.Notification
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.test.platform.app.InstrumentationRegistry
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.tasks.await
import org.junit.Assert.*
import org.junit.Assume.assumeTrue
import org.junit.Test
import java.io.File

class PushNotificationsTest {
    private val instrumentation = InstrumentationRegistry.getInstrumentation()
    private val context: Context = instrumentation.targetContext

    @Test fun displaysPrivateDeviceRequestInNotificationChannel() {
        if (Build.VERSION.SDK_INT >= 33) instrumentation.uiAutomation.grantRuntimePermission(context.packageName, Manifest.permission.POST_NOTIFICATIONS)
        val manager = context.getSystemService(NotificationManager::class.java)
        manager.cancelAll()
        PushNotifications.show(context, "New device login!", "Synthetic device requests approval", 42)
        val deadline = android.os.SystemClock.elapsedRealtime() + 5000
        while (manager.activeNotifications.none { it.id == 42 } && android.os.SystemClock.elapsedRealtime() < deadline) {
            android.os.SystemClock.sleep(50)
        }
        val notification = manager.activeNotifications.single { it.id == 42 }.notification
        assertEquals(PushNotifications.CHANNEL, notification.channelId)
        assertEquals(Notification.VISIBILITY_PRIVATE, notification.visibility)
        assertEquals("New device login!", notification.extras.getString(Notification.EXTRA_TITLE))
        assertNotNull(notification.contentIntent)
        assertEquals(NotificationManager.IMPORTANCE_HIGH, manager.getNotificationChannel(PushNotifications.CHANNEL).importance)
        manager.cancelAll()
    }

    @Test fun obtainsTokenForOptionalLiveDeliverySmokeTest() = runBlocking {
        assumeTrue(InstrumentationRegistry.getArguments().getString("liveFcm") == "true")
        val token = FirebaseMessaging.getInstance().token.await()
        assertTrue(token.isNotBlank())
        // Only the isolated test emulator uses this file; no token appears in test logs.
        File(context.cacheDir, "push-smoke-token").writeText(token)
    }
}
