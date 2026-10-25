package dev.authier.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.*

/** Synthetic previews share production Compose components and never open the real vault. */
class PasskeyPreviewActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            var verified by remember { mutableStateOf(!intent.getBooleanExtra("locked", false)) }
            val creating = intent.getBooleanExtra("create", false)
            AuthierTheme {
                PasskeyApprovalScreen(PasskeyApprovalState(ready = true, creating = creating, verified = verified, biometricEnabled = true,
                    domain = "github.com", origin = "https://github.com", account = "alexmorgan", requestingApp = "com.android.chrome",
                    accounts = listOf(PasskeyAccount("personal", "alexmorgan", "GitHub personal", "github.com"),
                        PasskeyAccount("work", "alex@studio.design", "GitHub work", "github.com"))),
                    onPassword = { verified = true }, onBiometric = { verified = true }, onCreate = ::finish, onSelect = { finish() }, onCancel = ::finish)
            }
        }
    }
}
