package dev.authier.android

import android.content.Intent
import android.net.Uri
import android.provider.Settings
import android.view.autofill.AutofillManager
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.RadioButtonUnchecked
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.LifecycleResumeEffect

@Composable
internal fun AndroidAutofillSettings(demo: Boolean = false) {
    val context = LocalContext.current
    val manager = remember(context) { context.getSystemService(AutofillManager::class.java) }
    fun isSetUp() = manager?.hasEnabledAutofillServices() == true
    var enabled by remember(manager) { mutableStateOf(isSetUp()) }
    LifecycleResumeEffect(manager) {
        // Recheck Android's selected provider after setup, cancellation, or switching services.
        enabled = isSetUp()
        onPauseOrDispose { }
    }
    SettingSection("ANDROID AUTOFILL", "Fill passwords in Android apps you explicitly associate with a vault item. Choose an account to fill. Unlock is only needed after your timeout expires.") {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Icon(if (enabled) Icons.Outlined.CheckCircle else Icons.Outlined.RadioButtonUnchecked,
                contentDescription = null, tint = if (enabled) Mint else Muted, modifier = Modifier.size(22.dp))
            Text(if (enabled) "Autofill is set up" else "Not set up", color = if (enabled) Mint else Muted,
                style = MaterialTheme.typography.bodyMedium)
        }
        Text(if (enabled) "Authier is your Android autofill service." else "Select Authier as your autofill service in Android settings.",
            color = Muted, style = MaterialTheme.typography.bodySmall)
        OutlinedButton({ context.startActivity(Intent(Settings.ACTION_REQUEST_SET_AUTOFILL_SERVICE, Uri.parse("package:${context.packageName}"))) },
            enabled = !demo, modifier = Modifier.fillMaxWidth()) {
            Text(if (enabled) "Autofill settings" else "Set up Android Autofill")
        }
    }
}
