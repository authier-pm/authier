package dev.authier.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

/** Synthetic notification preview. No account, vault data, or server requests. */
class NotificationPreviewActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        PushNotifications.createChannel(this)
        setContent {
            AuthierTheme {
                Surface(color = Canvas, modifier = Modifier.fillMaxSize()) {
                    Column(Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(20.dp)) {
                        ScreenHeading("Sign-in notifications", "Synthetic Android preview")
                        Text("Device requests arrive even while Authier is closed. Tap a notification, unlock your vault, and review the device before approving.", color = Muted)
                        Button(onClick = ::showPreview, modifier = Modifier.fillMaxWidth()) { Text("Show sample sign-in request") }
                    }
                }
            }
        }
        if (intent.getBooleanExtra("showNotification", false)) showPreview()
    }

    private fun showPreview() {
        PushNotifications.show(this, "New device login!", "Chrome on Linux is requesting access. Open Authier to review this sign-in.", 42)
    }
}
