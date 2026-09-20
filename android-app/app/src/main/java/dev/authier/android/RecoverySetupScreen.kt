package dev.authier.android

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp

/** Production signup step. Credentials stay in AuthScreen memory until Create account. */
@Composable
fun RecoverySetupScreen(
    email: String,
    draft: RecoverySetupDraft,
    onChange: (RecoverySetupDraft) -> Unit,
    busy: Boolean,
    onBack: () -> Unit,
    onCreate: (MasterDeviceResetConfig) -> Unit,
) {
    var error by remember { mutableStateOf<String?>(null) }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("CREATE YOUR VAULT · STEP 2 OF 2", color = Mint, style = MaterialTheme.typography.labelMedium)
        Text("Plan for a lost master device", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Text("Choose what must happen before a new device can replace your master device. Your vault password is still required.", color = Muted)
        RecoverySection("1. Other device approvals") {
            OutlinedTextField(draft.approvals, { onChange(draft.copy(approvals = it)) }, enabled = !busy,
                label = { Text("Device approvals (0–10)") }, singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), modifier = Modifier.fillMaxWidth())
            Text(if (draft.approvals.toIntOrNull() == 0) "No device approval required. Recovery relies on your email, waiting period and vault password."
                else "Keep enough other devices available. Without them, this reset cannot complete.", color = MaterialTheme.colorScheme.tertiary, style = MaterialTheme.typography.bodySmall)
        }
        RecoverySection("2. Waiting period") {
            OutlinedTextField(draft.wait, { onChange(draft.copy(wait = it)) }, enabled = !busy,
                label = { Text("Waiting period") }, singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), modifier = Modifier.fillMaxWidth())
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("Minutes" to 1, "Hours" to 60, "Days" to 1440).forEach { (label, unit) ->
                    FilterChip(selected = draft.unitMinutes == unit, enabled = !busy,
                        onClick = { onChange(draft.copy(unitMinutes = unit)) }, label = { Text(label) })
                }
            }
            Text("5 minutes to 3 months (90 days). Starts after email confirmation. Both safeguards must be satisfied.", color = Muted, style = MaterialTheme.typography.bodySmall)
        }
        RecoverySection("Notification emails") {
            Text("Updates go to $email and every address below. Only your account email receives the confirmation link.", color = Muted, style = MaterialTheme.typography.bodySmall)
            draft.emails.forEachIndexed { index, address ->
                OutlinedTextField(address, { value -> onChange(draft.copy(emails = draft.emails.mapIndexed { i, old -> if (i == index) value else old })) },
                    enabled = !busy, label = { Text("Notification email ${index + 1}") }, singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email), modifier = Modifier.fillMaxWidth())
                TextButton(enabled = !busy, onClick = { onChange(draft.copy(emails = draft.emails.filterIndexed { i, _ -> i != index })) }) { Text("Remove email ${index + 1}") }
            }
            TextButton(enabled = !busy && draft.emails.size < 20, onClick = { onChange(draft.copy(emails = draft.emails + "")) }) { Text("+ Add email address") }
        }
        error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        Button(enabled = !busy, modifier = Modifier.fillMaxWidth(), onClick = {
            val result = runCatching { draft.toConfig() }
            error = result.exceptionOrNull()?.message
            result.getOrNull()?.let(onCreate)
        }) { Text(if (busy) "Creating account…" else "Create account") }
        OutlinedButton(enabled = !busy, onClick = onBack, modifier = Modifier.fillMaxWidth()) { Text("Back") }
    }
}

@Composable
private fun RecoverySection(title: String, content: @Composable ColumnScope.() -> Unit) {
    OutlinedCard(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(title, fontWeight = FontWeight.SemiBold)
            content()
        }
    }
}
