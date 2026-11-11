package dev.authier.android

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
internal fun NewDeviceApprovalChoices(
    selection: NewDeviceApprovalSelection,
    onChange: (NewDeviceApprovalSelection) -> Unit,
    enabled: Boolean,
) {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        ApprovalMethodChoice(
            "Another Authier device · Recommended",
            "Approve from a device already signed in. Choose this alone for the recommended protection.",
            selection.otherDevice, enabled,
        ) { onChange(selection.copy(otherDevice = it)) }
        ApprovalMethodChoice(
            "Email · Most convenient, least secure",
            "Approve using a link sent to your account email. Anyone with access to that mailbox can approve a new device.",
            selection.email, enabled,
        ) { onChange(selection.copy(email = it)) }
        if (selection.email && selection.otherDevice) {
            Text("When both methods are enabled", fontWeight = FontWeight.SemiBold)
            ApprovalRuleChoice("Either approval is enough", !selection.requireBoth, enabled) {
                onChange(selection.copy(requireBoth = false))
            }
            ApprovalRuleChoice("Require both approvals", selection.requireBoth, enabled) {
                onChange(selection.copy(requireBoth = true))
            }
            Text(
                if (selection.requireBoth) "Each new device needs approval from your email and another Authier device."
                else "Email alone can approve a new device, so the email option's lower protection still applies.",
                color = Muted, style = MaterialTheme.typography.bodySmall,
            )
        }
        Text("Your master password is still required to sign in.", color = Muted, style = MaterialTheme.typography.bodySmall)
    }
}

@Composable
private fun ApprovalMethodChoice(title: String, description: String, checked: Boolean, enabled: Boolean, onChange: (Boolean) -> Unit) {
    Row(
        Modifier.fillMaxWidth().toggleable(checked, enabled = enabled, role = Role.Checkbox, onValueChange = onChange).padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Checkbox(checked, onCheckedChange = null, enabled = enabled)
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(title, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.bodyMedium)
            Text(description, color = Muted, style = MaterialTheme.typography.bodySmall)
        }
    }
}

@Composable
private fun ApprovalRuleChoice(title: String, selected: Boolean, enabled: Boolean, onSelect: () -> Unit) {
    Row(
        Modifier.fillMaxWidth().selectable(selected, enabled = enabled, role = Role.RadioButton, onClick = onSelect),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        RadioButton(selected, onClick = null, enabled = enabled)
        Text(title, style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
internal fun NewDeviceApprovalEditor(policy: NewDeviceApprovalPolicy?, saving: Boolean, enabled: Boolean, onSave: (NewDeviceApprovalPolicy) -> Unit) {
    var selection by remember(policy) { mutableStateOf(NewDeviceApprovalSelection.from(policy)) }
    NewDeviceApprovalChoices(selection, { selection = it }, enabled && !saving)
    Button(
        onClick = { selection.policy?.let(onSave) },
        enabled = enabled && !saving && selection.policy != null && selection.policy != policy,
        modifier = Modifier.fillMaxWidth(),
    ) { Text(if (saving) "Saving…" else "Save approval settings") }
}

@Composable
internal fun NewDeviceApprovalSetupScreen(state: VaultUiState, onSave: (NewDeviceApprovalPolicy) -> Unit, onLock: () -> Unit) {
    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp),
    ) {
        ScreenHeading("Approve new devices", "Choose at least one approval method before continuing. You can change this later in Settings.")
        NewDeviceApprovalEditor(state.security.newDevicePolicy, state.busy, !state.demo, onSave)
        OutlinedButton(onLock, enabled = !state.busy, modifier = Modifier.fillMaxWidth()) { Text("Lock vault") }
    }
}
