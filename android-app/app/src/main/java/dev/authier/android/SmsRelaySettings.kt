package dev.authier.android

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner

@Composable
internal fun SmsRelaySettings(state: VaultUiState, model: VaultViewModel) {
    val context = LocalContext.current
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    fun hasPermission() = state.demo ||
        ContextCompat.checkSelfPermission(context, Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED
    var permitted by remember { mutableStateOf(hasPermission()) }
    var denied by remember { mutableStateOf(false) }
    val permission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        permitted = granted
        denied = !granted
        if (granted) model.setSmsRelay(true)
    }
    DisposableEffect(lifecycle) {
        // The permission can change in Android settings while Authier is in the background.
        val observer = LifecycleEventObserver { _, event -> if (event == Lifecycle.Event.ON_RESUME) permitted = hasPermission() }
        lifecycle.addObserver(observer)
        onDispose { lifecycle.removeObserver(observer) }
    }
    val active = state.smsRelayEnabled && permitted
    fun toggle(enabled: Boolean) {
        when {
            !enabled -> {
                model.setSmsRelay(false)
                // Stop receiving text messages at all once Authier no longer needs them.
                if (Build.VERSION.SDK_INT >= 33 && !state.demo) context.revokeSelfPermissionOnKill(Manifest.permission.RECEIVE_SMS)
            }
            permitted -> model.setSmsRelay(true)
            else -> permission.launch(Manifest.permission.RECEIVE_SMS)
        }
    }
    SettingSection("SMS CODES TO BROWSERS", "When a text message contains a verification code, Authier sends only that code and its sender, end-to-end encrypted, to your Authier browser extension. Codes expire after 10 minutes. Other messages never leave this phone.") {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("Send SMS codes while unlocked", style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
            Switch(active, ::toggle, enabled = !state.busy, colors = SwitchDefaults.colors(checkedTrackColor = Mint))
        }
        if (denied) {
            Text("Android did not allow Authier to receive text messages. Allow SMS access in app settings to send codes.", color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
            TextButton({ context.startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${context.packageName}"))) }) { Text("Open app settings") }
        }
        if (active && state.lockTimeoutSeconds == 0) Text("Your vault locks as soon as Authier leaves the screen, so codes cannot be sent. Choose a longer automatic lock above.", color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
        else Text("A locked vault sends nothing. Open the Authier browser extension popup to see the code.", color = Muted, style = MaterialTheme.typography.bodySmall)
    }
}
