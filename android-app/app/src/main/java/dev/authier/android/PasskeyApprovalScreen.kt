package dev.authier.android

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Key
import androidx.compose.material.icons.outlined.VerifiedUser
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

data class PasskeyAccount(val id: String, val username: String, val label: String, val rpId: String, val iconUrl: String? = null)
data class PasskeyApprovalState(
    val ready: Boolean = false, val busy: Boolean = false, val creating: Boolean = false,
    val verified: Boolean = false, val biometricEnabled: Boolean = false,
    val domain: String = "", val origin: String = "", val account: String = "", val requestingApp: String = "",
    val accounts: List<PasskeyAccount> = emptyList(), val error: String? = null,
)

@Composable
fun PasskeyApprovalScreen(state: PasskeyApprovalState, onPassword: (String) -> Unit, onBiometric: () -> Unit,
    onCreate: () -> Unit, onSelect: (String) -> Unit, onCancel: () -> Unit) {
    var password by remember { mutableStateOf("") }
    Surface(Modifier.fillMaxSize(), color = Canvas) {
        LazyColumn(Modifier.fillMaxSize().safeDrawingPadding().imePadding(), contentPadding = PaddingValues(24.dp), verticalArrangement = Arrangement.spacedBy(20.dp)) {
            item {
                Icon(Icons.Outlined.Key, null, tint = Mint, modifier = Modifier.size(38.dp))
                Spacer(Modifier.height(20.dp))
                Text(if (state.creating) "Save a passkey" else "Sign in with a passkey", style = MaterialTheme.typography.headlineLarge)
                Spacer(Modifier.height(16.dp))
                Text(state.domain, color = Mint, style = MaterialTheme.typography.titleLarge)
                if (state.origin.startsWith("https://")) Text(state.origin, color = Muted, style = MaterialTheme.typography.bodySmall)
                if (state.requestingApp.isNotBlank()) Text("Requested by ${state.requestingApp}", color = Muted, style = MaterialTheme.typography.bodySmall)
                if (state.creating) { Spacer(Modifier.height(12.dp)); Text(state.account, style = MaterialTheme.typography.titleMedium) }
            }
            if (!state.verified && state.ready) item {
                Text("Verify your identity to continue.", color = Muted)
                Spacer(Modifier.height(16.dp))
                if (state.biometricEnabled) {
                    Button(onBiometric, enabled = !state.busy, modifier = Modifier.fillMaxWidth()) { Text("Verify with fingerprint") }
                    Spacer(Modifier.height(12.dp))
                }
                PasswordField(password, { password = it }, "Master password")
                Spacer(Modifier.height(16.dp))
                OutlinedButton({ onPassword(password); password = "" }, enabled = !state.busy && password.isNotEmpty(), modifier = Modifier.fillMaxWidth()) {
                    Text("Verify with master password")
                }
            }
            if (state.verified) {
                item { Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Outlined.VerifiedUser, null, tint = Mint)
                    Text("Identity verified", color = Mint)
                } }
                if (state.creating) item {
                    Text("Your passkey is encrypted in Authier and syncs to your browser extension and other devices.", color = Muted)
                    Spacer(Modifier.height(20.dp))
                    Button(onCreate, enabled = !state.busy, modifier = Modifier.fillMaxWidth()) { Text("Save passkey") }
                } else {
                    item { Text("Choose an account", style = MaterialTheme.typography.titleMedium) }
                    items(state.accounts, key = { it.id }) { account ->
                        PasskeyAccountCard(account, enabled = !state.busy, onClick = { onSelect(account.id) })
                    }
                    if (state.accounts.isEmpty()) item { Text("No matching passkeys on this phone. Open Authier and sync your vault, then try again.", color = Muted) }
                }
            }
            state.error?.let { message -> item { Text(message, color = MaterialTheme.colorScheme.error) } }
            if (state.busy) item { LinearProgressIndicator(Modifier.fillMaxWidth()) }
            item { TextButton(onCancel, modifier = Modifier.fillMaxWidth()) { Text("Cancel") } }
        }
    }
}

@Composable
private fun PasskeyAccountCard(account: PasskeyAccount, enabled: Boolean, onClick: () -> Unit) {
    val content = remember(account) { SecretContent(label = account.label, url = "https://${account.rpId}", iconUrl = account.iconUrl) }
    OutlinedButton(onClick, enabled = enabled, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(8.dp)) {
        Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            SecretItemIcon(content)
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(account.username.ifBlank { account.label })
                Text(account.rpId, color = Muted, style = MaterialTheme.typography.bodySmall)
                Text("Sign in", color = Mint)
            }
        }
    }
}
