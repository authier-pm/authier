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
                SecretContent(label = "GitHub · Personal", username = "alexmorgan", password = "synthetic-only", androidUri = "com.github.android"),
            ),
            VaultItem(
                SecretRecord("autofill-preview-work", "synthetic", "LOGIN_CREDENTIALS", 1, "2026-09-08T00:00:00Z"),
                SecretContent(label = "GitHub · Studio", username = "alex@studio.design", password = "synthetic-only", androidUri = "com.github.android"),
            ),
        )
        setContent {
            var unlocked by remember { mutableStateOf(!intent.getBooleanExtra("locked", false)) }
            AuthierTheme {
                AutofillUnlockScreen("com.github.android", if (unlocked) previewChoices else emptyList(), unlocked, false, null,
                    onUnlock = { unlocked = true }, onSelect = { finish() }, onCancel = ::finish)
            }
        }
    }
}
