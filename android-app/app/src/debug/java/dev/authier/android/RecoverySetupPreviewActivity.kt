package dev.authier.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier

/** Renders the production recovery form with synthetic data; no API or vault access. */
class RecoverySetupPreviewActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            var draft by remember { mutableStateOf(RecoverySetupDraft(emails = listOf("backup@example.com", "family@example.com"))) }
            AuthierTheme {
                Surface(Modifier.fillMaxSize().safeDrawingPadding(), color = Canvas) {
                    RecoverySetupScreen("alex@example.com", draft, { draft = it }, false, ::finish, {})
                }
            }
        }
    }
}
