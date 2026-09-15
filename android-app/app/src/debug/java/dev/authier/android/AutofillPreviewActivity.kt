package dev.authier.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.*

/** Synthetic screenshot scenario only. No vault store, keys, or network access. Absent from release builds. */
class AutofillPreviewActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val previewChoices = listOf(
            VaultItem(
                SecretRecord("autofill-preview-personal", "synthetic", "LOGIN_CREDENTIALS", 1, "2026-09-08T00:00:00Z"),
                SecretContent(label = "GitHub · Personal", username = "alexmorgan", url = "https://github.com", password = "synthetic-only"),
            ),
            VaultItem(
                SecretRecord("autofill-preview-work", "synthetic", "LOGIN_CREDENTIALS", 1, "2026-09-08T00:00:00Z"),
                SecretContent(label = "GitHub · Studio", username = "alex@studio.design", url = "https://github.com", password = "synthetic-only"),
            ),
        )
        setContent {
            var unlocked by remember { mutableStateOf(!intent.getBooleanExtra("locked", false)) }
            AuthierTheme {
                AutofillUnlockScreen(if (intent.getBooleanExtra("web", false)) "com.android.chrome" else "com.github.android", if (unlocked) previewChoices else emptyList(), unlocked, false, null,
                    onUnlock = { unlocked = true }, onSelect = { finish() }, onCancel = ::finish,
                    webOrigin = if (intent.getBooleanExtra("web", false)) "https://github.com" else null,
                    canCreate = true, initiallyCreating = intent.getBooleanExtra("create", false),
                    initialUsername = "alex@example.com", onCreate = { finish() })
            }
        }
    }
}
