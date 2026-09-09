package dev.authier.android

import androidx.biometric.BiometricManager
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.activity.compose.LocalActivity
import androidx.compose.ui.unit.dp
import androidx.fragment.app.FragmentActivity

@Composable
internal fun UnlockSettings(state: VaultUiState, model: VaultViewModel) {
    val activity = LocalActivity.current as FragmentActivity
    var expanded by remember { mutableStateOf(false) }
    val availability = if (state.demo) BiometricManager.BIOMETRIC_SUCCESS else BiometricUnlock.availability(activity)
    Column(verticalArrangement = Arrangement.spacedBy(20.dp)) {
        SettingSection("AUTOMATIC LOCK", "Stay unlocked until this much time without activity has passed, even in the background or after closing and restarting Authier.") {
            Box {
                OutlinedButton({ expanded = true }, enabled = !state.busy, modifier = Modifier.fillMaxWidth()) {
                    Text(lockTimeoutOptions.find { it.first == state.lockTimeoutSeconds }?.second ?: "${state.lockTimeoutSeconds} seconds")
                }
                DropdownMenu(expanded, onDismissRequest = { expanded = false }) {
                    lockTimeoutOptions.forEach { (seconds, label) ->
                        DropdownMenuItem(text = { Text(label) }, onClick = { expanded = false; model.changeTimeout(seconds) })
                    }
                }
            }
            Text("Lock vault always locks immediately. This setting applies to this phone.", color = Muted, style = MaterialTheme.typography.bodySmall)
        }
        SettingSection("FINGERPRINT UNLOCK", "Unlock without typing your master password. Android verifies your fingerprint or another strong biometric; Authier never receives your fingerprint data.") {
            when {
                state.biometricEnabled -> OutlinedButton(model::disableBiometric, enabled = !state.busy, modifier = Modifier.fillMaxWidth()) { Text("Disable fingerprint unlock") }
                availability == BiometricManager.BIOMETRIC_SUCCESS || state.demo -> Button({ model.enableBiometric(activity) }, enabled = !state.busy, modifier = Modifier.fillMaxWidth()) { Text("Enable fingerprint unlock") }
                availability == BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> OutlinedButton({ BiometricUnlock.enroll(activity) }, modifier = Modifier.fillMaxWidth()) { Text("Register fingerprint in Android") }
                else -> Text("Fingerprint unlock is unavailable. Check this phone’s biometric settings or use your master password.", color = Muted, style = MaterialTheme.typography.bodySmall)
            }
            if (availability == BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED) Text("After registering, return here to enable fingerprint unlock.", color = Muted, style = MaterialTheme.typography.bodySmall)
        }
    }
}
