package dev.authier.android

import android.os.Build
import android.content.ComponentName
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.credentials.CredentialManager
import androidx.lifecycle.compose.LifecycleResumeEffect

@Composable
fun AndroidPasskeySettings(demo: Boolean = false) {
    val context = LocalContext.current
    fun isEnabled(): Boolean = Build.VERSION.SDK_INT >= 34 && context.getSystemService(android.credentials.CredentialManager::class.java)
        ?.isEnabledCredentialProviderService(ComponentName(context, PasskeyProviderService::class.java)) == true
    var enabled by remember { mutableStateOf(isEnabled()) }
    LifecycleResumeEffect(context) {
        enabled = isEnabled()
        onPauseOrDispose { }
    }
    SettingSection("PASSKEYS", "Use the same passkeys on your phone and in the Authier browser extension.") {
        if (Build.VERSION.SDK_INT >= 34) Text(if (enabled) "Authier passkeys are enabled" else "Passkey provider not set up", color = if (enabled) Mint else Muted)
        Text(if (Build.VERSION.SDK_INT >= 34) "Enable Authier in Android's password and passkey settings. Creating and using passkeys requires your fingerprint or master password."
            else "Creating and using passkeys requires Android 14 or newer. You can still view, rename, delete and sync passkeys on this phone.", color = Muted, style = MaterialTheme.typography.bodySmall)
        if (Build.VERSION.SDK_INT >= 34) OutlinedButton({ CredentialManager.create(context).createSettingsPendingIntent().send() },
            enabled = !demo, modifier = Modifier.fillMaxWidth()) { Text(if (enabled) "Android passkey settings" else "Set up Android passkeys") }
    }
}
