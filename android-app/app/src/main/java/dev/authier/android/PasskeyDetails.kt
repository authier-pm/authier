package dev.authier.android

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Key
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PasskeyDetails(item: VaultItem, busy: Boolean, onDismiss: () -> Unit, onRename: (String) -> Unit, onDelete: () -> Unit, onDiscard: () -> Unit) {
    var label by remember(item.record.id) { mutableStateOf(item.content.label) }
    var confirmDelete by remember { mutableStateOf(false) }
    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = Panel,
        contentColor = MaterialTheme.colorScheme.onSurface,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)) {
        Column(Modifier.fillMaxWidth().imePadding().verticalScroll(rememberScrollState()).padding(24.dp), verticalArrangement = Arrangement.spacedBy(18.dp)) {
            Icon(Icons.Outlined.Key, null, tint = Mint, modifier = Modifier.size(32.dp))
            Text("Passkey details", style = MaterialTheme.typography.headlineMedium)
            Text(item.content.url.orEmpty(), color = Mint)
            Text(item.content.username, style = MaterialTheme.typography.titleMedium)
            Text("Encrypted and shared with your Authier devices. Your private key stays in the vault.", color = Muted)
            OutlinedTextField(label, { label = it }, label = { Text("Label") }, enabled = !busy && !item.pending, modifier = Modifier.fillMaxWidth())
            if (item.pending) Text("Sync this passkey before editing it again.", color = Muted)
            if (item.conflict) {
                Text("Another device changed this passkey. Discard the local edit to load the server version.", color = MaterialTheme.colorScheme.error)
                OutlinedButton(onDiscard, enabled = !busy) { Text("Discard local edit & get server version") }
            }
            Button({ onRename(label) }, enabled = !busy && !item.pending && label.isNotBlank() && label.trim() != item.content.label, modifier = Modifier.fillMaxWidth()) { Text("Save label") }
            TextButton({ confirmDelete = true }, enabled = !busy && !item.pending, modifier = Modifier.fillMaxWidth()) { Text("Delete passkey", color = MaterialTheme.colorScheme.error) }
        }
    }
    if (confirmDelete) AlertDialog(onDismissRequest = { confirmDelete = false }, title = { Text("Delete this passkey?") },
        text = { Text("This removes the passkey from all your Authier devices. Also remove it in the website's security settings. Make sure you have another way to sign in.") },
        confirmButton = { TextButton(onDelete) { Text("Delete passkey") } }, dismissButton = { TextButton({ confirmDelete = false }) { Text("Cancel") } })
}
