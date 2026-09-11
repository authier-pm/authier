package dev.authier.android

import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun SettingsScreen(state: VaultUiState, model: VaultViewModel) {
    val context = LocalContext.current
    var signOut by remember { mutableStateOf(false) }
    var discard by remember { mutableStateOf<PendingWrite?>(null) }
    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(24.dp), verticalArrangement = Arrangement.spacedBy(20.dp)) {
        item { ScreenHeading("Vault settings", state.email) }
        item {
            SettingSection("ANDROID AUTOFILL", "Fill passwords in Android apps you explicitly associate with a vault item. Choose an account to fill. Unlock is only needed after your timeout expires.") {
                OutlinedButton({ context.startActivity(Intent(Settings.ACTION_REQUEST_SET_AUTOFILL_SERVICE, Uri.parse("package:${context.packageName}"))) }, enabled = !state.demo, modifier = Modifier.fillMaxWidth()) { Text("Set up Android Autofill") }
            }
        }
        if (state.writes.isNotEmpty()) item {
            SettingSection("PENDING CHANGES", "Your local changes remain encrypted until the server accepts them.") {
                state.writes.forEach { write ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("${write.operation.replaceFirstChar { it.uppercase() }} · ${if (write.conflict) "conflict" else "awaiting sync"}", modifier = Modifier.weight(1f), style = MaterialTheme.typography.bodySmall)
                        TextButton({ discard = write }, enabled = !state.busy) { Text("Discard") }
                    }
                }
            }
        }
        item {
            UnlockSettings(state, model)
        }

        item {
            SettingSection("NEW DEVICE ACCESS", "Protect new sign-ins with approval from a trusted device.") {
                listOf("REQUIRE_ANY_DEVICE_APPROVAL" to "Approval from any device", "REQUIRE_MASTER_DEVICE_APPROVAL" to "Approval from master device", "ALLOW" to "Allow with master password").forEach { (policy, label) ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        RadioButton(state.security.newDevicePolicy == policy, { model.changePolicy(policy) }, enabled = !state.busy && !state.demo)
                        Text(label, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }
        item {
            SettingSection("ENCRYPTION", "AES-256-GCM · PBKDF2-SHA512 · 600,000 iterations") {
                Text("Your master password and decrypted items stay on this device. Session tokens are protected by Android Keystore.", color = Muted, style = MaterialTheme.typography.bodySmall)
                Text(state.serverUrl, color = Muted, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 10.dp))
            }
        }
        item {
            if (!state.demo) OutlinedButton(model::reconnect, enabled = !state.busy, modifier = Modifier.fillMaxWidth()) { Text("Reconnect server session") }
            OutlinedButton({ signOut = true }, enabled = !state.busy, modifier = Modifier.fillMaxWidth()) { Icon(Icons.Outlined.Logout, null, Modifier.size(18.dp)); Spacer(Modifier.width(8.dp)); Text("Sign out & remove local vault") }
            Text("Authier for Android · ${BuildConfig.VERSION_NAME}", color = Muted, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 18.dp))
        }
    }
    if (signOut) AlertDialog(onDismissRequest = { signOut = false }, title = { Text("Remove this local vault?") }, text = { Text("Your synced items remain on the server. You will need your master password and device approval to sign in again.") }, confirmButton = { TextButton({ model.signOut(); signOut = false }) { Text("Sign out") } }, dismissButton = { TextButton({ signOut = false }) { Text("Cancel") } })
    discard?.let { write -> AlertDialog(onDismissRequest = { discard = null }, title = { Text("Discard local ${write.operation}?") }, text = { Text("This removes the unsynced change from this phone and reloads the server version. Copy any local values you need first.") }, confirmButton = { TextButton({ model.discardLocalChange(write.id); discard = null }) { Text("Discard local change") } }, dismissButton = { TextButton({ discard = null }) { Text("Cancel") } }) }
}

@Composable
internal fun ScreenHeading(title: String, description: String, refresh: (() -> Unit)? = null) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.padding(bottom = 12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(title, style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
            if (refresh != null) IconButton(refresh) { Icon(Icons.Outlined.Refresh, "Refresh devices", tint = Mint) }
        }
        Text(description, color = Muted, style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
internal fun SettingSection(title: String, description: String, content: @Composable ColumnScope.() -> Unit) {
    Surface(color = Panel, contentColor = MaterialTheme.colorScheme.onSurface, shape = RoundedCornerShape(16.dp)) {
        Column(Modifier.fillMaxWidth().padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(title, color = Mint, fontSize = 10.sp, letterSpacing = 1.sp, fontWeight = FontWeight.SemiBold)
            Text(description, color = Muted, style = MaterialTheme.typography.bodySmall)
            content()
        }
    }
}
