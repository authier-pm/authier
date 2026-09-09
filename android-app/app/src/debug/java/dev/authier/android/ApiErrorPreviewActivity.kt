package dev.authier.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

/** Synthetic diagnostics only; no vault, credentials, or network. Excluded from release builds. */
class ApiErrorPreviewActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val details = ApiErrorDetails(500, "POST", "https://api.authier.pm/api/v1/auth/completeDeviceLogin",
            """
            {
              "defined": false,
              "code": "INTERNAL_SERVER_ERROR",
              "status": 500,
              "message": "Internal server error"
            }
            """.trimIndent(), "synthetic-request-id")
        setContent {
            AuthierTheme {
                Surface(Modifier.fillMaxSize(), color = Canvas) {
                    Column(Modifier.safeDrawingPadding()) {
                        MessageBanner("Internal server error", true, ::finish, details)
                        Column(Modifier.padding(28.dp), verticalArrangement = Arrangement.spacedBy(20.dp)) {
                            Text("Sign in to Authier", style = MaterialTheme.typography.headlineLarge)
                            Text("Waiting for device approval", color = Mint)
                            Text("Synthetic sign-in error. Tap the banner to inspect the server response.", color = Muted)
                        }
                    }
                }
            }
        }
    }
}
