package dev.authier.android

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun DevicesScreen(state: VaultUiState, model: VaultViewModel) {
    DeviceManagementScreen(state, model::loadDevices, model::decideApproval, model::removeDevice, model::setMasterDevice)
}

@Composable
internal fun DeviceManagementScreen(
    state: VaultUiState,
    onRefresh: () -> Unit,
    onDecideApproval: (Int, Boolean) -> Unit,
    onRemove: (String) -> Unit,
    onSetMaster: (String) -> Unit,
) {
    var removing by remember { mutableStateOf<DeviceInfo?>(null) }
    var newMaster by remember { mutableStateOf<DeviceInfo?>(null) }
    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item { ScreenHeading("Your devices", "Choose who can access your encrypted vault.", onRefresh) }
        item {
            Text(
                if (state.isCurrentDeviceMaster) "This is your master device. You can transfer this role to another connected device."
                else "Only the current master device can choose a new master. Open Authier on that device to transfer the role.",
                color = Muted, style = MaterialTheme.typography.bodyMedium,
            )
        }
        if (state.approvals.isNotEmpty()) item { Text("WAITING FOR APPROVAL", color = Mint, fontSize = 11.sp, letterSpacing = 1.sp) }
        items(state.approvals, key = { "approval-${it.id}" }) { approval ->
            Surface(color = Panel, contentColor = MaterialTheme.colorScheme.onSurface, shape = RoundedCornerShape(16.dp)) {
                Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(approval.deviceName, fontWeight = FontWeight.SemiBold)
                    Text("IP address: ${approval.ipAddress}", color = Muted, style = MaterialTheme.typography.bodySmall)
                    Text("Approve only a device you are signing in to right now.", style = MaterialTheme.typography.bodySmall)
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Button({ onDecideApproval(approval.id, true) }, enabled = !state.busy) { Text("Approve") }
                        OutlinedButton({ onDecideApproval(approval.id, false) }, enabled = !state.busy) { Text("Reject") }
                    }
                }
            }
        }
        item { Text("CONNECTED DEVICES", color = Muted, fontSize = 11.sp, letterSpacing = 1.sp) }
        items(state.devices, key = { it.id }) { device ->
            DeviceCard(device, state, { removing = device }, { newMaster = device })
        }
        if (state.approvals.isEmpty()) item { Text("No pending device requests.", color = Muted, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 12.dp)) }
    }
    removing?.let { device ->
        AlertDialog(onDismissRequest = { removing = null }, title = { Text("Remove ${device.name}?") }, text = { Text("This device will need to sign in again before accessing your vault on the server.") },
            confirmButton = { TextButton({ onRemove(device.id); removing = null }, enabled = !state.busy && !state.demo) { Text("Remove device") } },
            dismissButton = { TextButton({ removing = null }) { Text("Cancel") } })
    }
    newMaster?.let { selected -> state.devices.find { it.id == selected.id && state.canSetMasterDevice(it) } }?.let { device ->
        AlertDialog(
            onDismissRequest = { newMaster = null },
            title = { Text("Make ${device.name} the master device?") },
            text = { Text("This device will lose its master role. Future master-device changes must be made from ${device.name}. If master-device approval is enabled, new sign-ins will also need approval there.") },
            confirmButton = {
                TextButton({ onSetMaster(device.id); newMaster = null }, enabled = !state.busy) { Text("Transfer master role") }
            },
            dismissButton = { TextButton({ newMaster = null }) { Text("Cancel") } },
        )
    }
}

@Composable
private fun DeviceCard(device: DeviceInfo, state: VaultUiState, onRemove: () -> Unit, onSetMaster: () -> Unit) {
    val isMaster = device.id == state.security.masterDeviceId
    Surface(color = Panel, contentColor = MaterialTheme.colorScheme.onSurface, shape = RoundedCornerShape(16.dp)) {
        Column(Modifier.fillMaxWidth().padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                Icon(if (device.platform.contains("android", true)) Icons.Outlined.PhoneAndroid else Icons.Outlined.Computer, null, tint = Mint)
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(device.name, fontWeight = FontWeight.SemiBold)
                    Text(if (device.isCurrent) "This device" else device.platform, color = Muted, fontSize = 12.sp)
                    if (isMaster) Surface(color = Mint.copy(alpha = .12f), shape = RoundedCornerShape(8.dp)) {
                        Row(Modifier.padding(horizontal = 8.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Icon(Icons.Outlined.VerifiedUser, null, Modifier.size(14.dp), tint = Mint)
                            Text("Master device", color = Mint, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
                if (!device.isCurrent) IconButton(onRemove, enabled = !state.busy && !state.demo) { Icon(Icons.Outlined.Logout, "Remove ${device.name}", tint = Muted) }
            }
            if (state.canSetMasterDevice(device)) {
                OutlinedButton(onSetMaster, enabled = !state.busy, modifier = Modifier.fillMaxWidth()) { Text("Make master device") }
            }
        }
    }
}
