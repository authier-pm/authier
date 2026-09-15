package dev.authier.android

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
internal fun AutofillPasswordForm(
    destination: AutofillDestination,
    initialUsername: String,
    busy: Boolean,
    onSave: (SecretContent) -> Unit,
    onCancel: () -> Unit,
) {
    // Deliberately not rememberSaveable: drafts must not enter Android's saved-state bundle.
    var content by remember {
        mutableStateOf(SecretContent(label = destination.label, username = initialUsername, password = generatePassword()))
    }
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("Save a new login", style = MaterialTheme.typography.titleLarge)
        OutlinedTextField(content.label, { content = content.copy(label = it) }, enabled = !busy,
            label = { Text("Name") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(content.username, { content = content.copy(username = it) }, enabled = !busy,
            label = { Text("Username or email (optional)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        PasswordField(content.password, { if (!busy) content = content.copy(password = it) }, "New password")
        OutlinedButton({ content = content.copy(password = generatePassword()) }, enabled = !busy, modifier = Modifier.fillMaxWidth()) {
            Text("Generate another password")
        }
        Text("Saved encrypted on this device before filling. Syncs when you next open and unlock Authier. Existing logins stay unchanged.", color = Muted, style = MaterialTheme.typography.bodySmall)
        Button({ onSave(content) }, enabled = !busy && content.label.isNotBlank() && content.password.isNotBlank(), modifier = Modifier.fillMaxWidth()) {
            Text(if (busy) "Saving…" else "Save and fill")
        }
        TextButton(onCancel, enabled = !busy, modifier = Modifier.fillMaxWidth()) { Text("Cancel") }
    }
}
