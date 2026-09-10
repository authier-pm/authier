package dev.authier.android

import android.content.ClipData
import android.content.ClipDescription
import android.content.ClipboardManager
import android.content.Context
import android.os.Build
import android.os.PersistableBundle
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.authier.android.crypto.Totp
import kotlinx.coroutines.delay
import java.net.URI

@Composable
fun VaultScreen(state: VaultUiState, model: VaultViewModel) {
    var query by remember { mutableStateOf("") }
    var kind by remember { mutableStateOf("LOGIN_CREDENTIALS") }
    var selected by remember { mutableStateOf<String?>(null) }
    var editing by remember { mutableStateOf<SecretContent?>(null) }
    var editingId by remember { mutableStateOf<String?>(null) }
    var editingKind by remember { mutableStateOf("LOGIN_CREDENTIALS") }
    val visible = state.items.filter { it.record.kind == kind && "${it.content.label} ${it.content.username} ${it.content.url}".contains(query, ignoreCase = true) }
    Box(Modifier.fillMaxSize()) {
        LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(24.dp, 18.dp, 24.dp, 100.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Row(Modifier.weight(1f), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.Shield, null, tint = Mint, modifier = Modifier.size(25.dp))
                        Text("authier", fontSize = 22.sp, fontWeight = FontWeight.Bold, letterSpacing = (-.7).sp)
                    }
                    IconButton(model::sync, enabled = !state.busy) { Icon(Icons.Outlined.Sync, "Sync vault", tint = Muted) }
                    IconButton(model::lock) { Icon(Icons.Outlined.Lock, "Lock vault", tint = Muted) }
                }
                Spacer(Modifier.height(29.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text("Your vault", fontSize = 34.sp, fontWeight = FontWeight.Bold, letterSpacing = (-1).sp)
                    Box(Modifier.size(38.dp).background(Panel, CircleShape).border(1.dp, Border, CircleShape), contentAlignment = Alignment.Center) {
                        Text(state.email.take(1).uppercase(), color = Mint, fontWeight = FontWeight.SemiBold)
                    }
                }
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(6.dp).background(Mint, CircleShape))
                    Text(when { state.demo -> "Demo vault · synthetic data"; state.pendingWrites > 0 -> "${state.pendingWrites} encrypted change(s) awaiting sync"; state.offline -> "Offline vault · encrypted on this device"; state.lastSyncAt != null -> "Encrypted & synced across your devices"; else -> "Encrypted on this device" }, style = MaterialTheme.typography.bodySmall, color = Muted)
                }
                Spacer(Modifier.height(25.dp))
                OutlinedTextField(query, { query = it }, modifier = Modifier.fillMaxWidth(), placeholder = { Text("Search your vault", color = Muted) }, leadingIcon = { Icon(Icons.Outlined.Search, null, tint = Muted) }, singleLine = true, shape = RoundedCornerShape(14.dp), colors = OutlinedTextFieldDefaults.colors(unfocusedContainerColor = Panel, focusedContainerColor = Panel, unfocusedBorderColor = Border))
                Spacer(Modifier.height(20.dp))
                Row(Modifier.fillMaxWidth().background(Panel, RoundedCornerShape(12.dp)).padding(4.dp)) {
                    VaultCategory("Passwords", state.items.count { it.record.kind == "LOGIN_CREDENTIALS" }, kind == "LOGIN_CREDENTIALS", Modifier.weight(1f)) { kind = "LOGIN_CREDENTIALS" }
                    VaultCategory("2FA codes", state.items.count { it.record.kind == "TOTP" }, kind == "TOTP", Modifier.weight(1f)) { kind = "TOTP" }
                }
                Spacer(Modifier.height(20.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(if (kind == "TOTP") "VERIFICATION CODES" else "ALL PASSWORDS", color = Muted, fontSize = 10.sp, letterSpacing = 1.4.sp, fontWeight = FontWeight.SemiBold)
                    Text("${visible.size} items", color = Muted, fontSize = 11.sp)
                }
            }
            items(visible, key = { it.record.id }) { item -> SecretCard(item) { selected = item.record.id } }
            if (visible.isEmpty()) item {
                Column(Modifier.fillMaxWidth().padding(vertical = 42.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Icon(Icons.Outlined.Key, null, tint = Muted, modifier = Modifier.size(40.dp))
                    Text(if (query.isBlank()) "A safe place for your first secret" else "No matching items", fontWeight = FontWeight.SemiBold)
                    Text(if (query.isBlank()) "Tap Add item to get started." else "Try another name or username.", color = Muted)
                }
            }
            item {
                Row(Modifier.fillMaxWidth().padding(top = 17.dp), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.Lock, null, tint = Muted, modifier = Modifier.size(12.dp))
                    Spacer(Modifier.width(5.dp))
                    Text("Only you can decrypt your vault", color = Muted, fontSize = 11.sp)
                }
            }
        }
        ExtendedFloatingActionButton(onClick = { if (!state.busy) { editingId = null; editingKind = kind; editing = SecretContent() } }, modifier = Modifier.align(Alignment.BottomEnd).padding(22.dp), containerColor = Mint, contentColor = Canvas, icon = { Icon(Icons.Outlined.Add, null) }, text = { Text("Add item", fontWeight = FontWeight.Bold) })
    }
    val item = state.items.find { it.record.id == selected && isVisibleInNativeVault(it.record) }
    if (item != null) SecretDetails(item, state.busy, onDismiss = { selected = null }, onEdit = { editingId = item.record.id; editingKind = item.record.kind; editing = item.content; selected = null }, onDelete = { model.deleteItem(item.record.id); selected = null }, onDiscard = { model.discardLocalChange(item.record.id); selected = null })
    editing?.let { content -> SecretEditor(content, editingKind, editingId != null, onDismiss = { editing = null }, onSave = { newKind, newContent -> model.saveItem(editingId, newKind, newContent); editing = null }) }
}

@Composable
private fun VaultCategory(label: String, count: Int, selected: Boolean, modifier: Modifier, onClick: () -> Unit) {
    Row(modifier.background(if (selected) Mint else Color.Transparent, RoundedCornerShape(9.dp)).clickable(onClick = onClick).padding(vertical = 12.dp), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
        Text(label, color = if (selected) Canvas else Muted, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
        Spacer(Modifier.width(6.dp))
        Text(count.toString(), color = if (selected) Canvas.copy(alpha = .6f) else Muted, fontSize = 11.sp)
    }
}

@Composable
private fun SecretCard(item: VaultItem, onClick: () -> Unit) {
    Surface(onClick = onClick, shape = RoundedCornerShape(17.dp), color = Panel, contentColor = MaterialTheme.colorScheme.onSurface, border = androidx.compose.foundation.BorderStroke(1.dp, Border.copy(alpha = .55f))) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                SecretItemIcon(item.content)
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                    Text(item.content.label, fontWeight = FontWeight.SemiBold, fontSize = 16.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(if (item.record.kind == "TOTP") item.content.url.orEmpty().removePrefix("https://") else item.content.username, color = Muted, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                Icon(if (item.conflict) Icons.Outlined.Warning else if (item.pending) Icons.Outlined.CloudUpload else Icons.Outlined.ChevronRight, if (item.conflict) "Conflict needs review" else if (item.pending) "Awaiting sync" else null, tint = if (item.conflict) MaterialTheme.colorScheme.error else Muted, modifier = Modifier.size(20.dp))
            }
            if (item.record.kind == "TOTP") {
                Spacer(Modifier.height(18.dp))
                TotpCode(item.content)
            }
        }
    }
}

@Composable
fun TotpCode(content: SecretContent) {
    var now by remember { mutableLongStateOf(System.currentTimeMillis()) }
    LaunchedEffect(content.secret) { while (true) { now = System.currentTimeMillis(); delay(1000) } }
    val result = remember(now / 1000, content) { runCatching { Totp.generate(content.secret, content.algorithm, content.digits, content.period, now) } }
    val remaining = content.period - ((now / 1000) % content.period.coerceAtLeast(1)).toInt()
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Text(result.getOrElse { "Invalid code settings" }.chunked(3).joinToString(" "), fontFamily = FontFamily.Monospace, fontSize = 28.sp, fontWeight = FontWeight.Medium, color = Mint)
        if (result.isSuccess) Box(contentAlignment = Alignment.Center) {
            CircularProgressIndicator(progress = { remaining.toFloat() / content.period }, modifier = Modifier.size(34.dp), color = Mint, trackColor = Border, strokeWidth = 2.dp)
            Text(remaining.toString(), fontSize = 10.sp, color = Muted)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SecretDetails(item: VaultItem, busy: Boolean, onDismiss: () -> Unit, onEdit: () -> Unit, onDelete: () -> Unit, onDiscard: () -> Unit) {
    val context = LocalContext.current
    var revealing by remember { mutableStateOf(false) }
    var copied by remember { mutableStateOf(false) }
    var confirmDelete by remember { mutableStateOf(false) }
    var copyError by remember { mutableStateOf<String?>(null) }
    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = Panel, contentColor = MaterialTheme.colorScheme.onSurface) {
        Column(Modifier.fillMaxWidth().padding(horizontal = 24.dp).padding(bottom = 36.dp), verticalArrangement = Arrangement.spacedBy(18.dp)) {
            Text(item.content.label, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
            Text(item.content.url.orEmpty(), color = Muted)
            if (item.conflict) {
                Text("Another device changed this item. Your local edit is still encrypted on this phone. Copy anything you need before replacing it with the latest server version.", color = MaterialTheme.colorScheme.error)
                OutlinedButton(onDiscard, enabled = !busy) { Text("Discard local edit & get server version") }
            }
            if (item.record.kind == "LOGIN_CREDENTIALS") {
                Text("USERNAME", color = Muted, fontSize = 10.sp, letterSpacing = 1.sp)
                Text(item.content.username)
                Text("PASSWORD", color = Muted, fontSize = 10.sp, letterSpacing = 1.sp)
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Text(if (revealing) item.content.password else "••••••••••••••••", Modifier.weight(1f), fontFamily = FontFamily.Monospace)
                    IconButton({ revealing = !revealing }) { Icon(if (revealing) Icons.Outlined.VisibilityOff else Icons.Outlined.Visibility, "Toggle password visibility") }
                }
            } else TotpCode(item.content)
            Button(onClick = {
                val result = runCatching {
                    if (item.record.kind == "TOTP") Totp.generate(item.content.secret, item.content.algorithm, item.content.digits, item.content.period) else item.content.password
                }
                result.onSuccess { copySensitive(context, it); copied = true; copyError = null }
                    .onFailure { copyError = "This verification code has invalid settings. Edit the setup key to fix it." }
            }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp)) { Icon(Icons.Outlined.ContentCopy, null, Modifier.size(18.dp)); Spacer(Modifier.width(8.dp)); Text(if (copied) "Copied to sensitive clipboard" else if (item.record.kind == "TOTP") "Copy verification code" else "Copy password") }
            copyError?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedButton(onEdit, enabled = !busy && !item.pending, modifier = Modifier.weight(1f)) { Text("Edit item") }
                TextButton({ confirmDelete = true }, enabled = !busy && !item.pending) { Text("Delete", color = MaterialTheme.colorScheme.error) }
            }
        }
    }
    if (confirmDelete) AlertDialog(onDismissRequest = { confirmDelete = false }, title = { Text("Delete ${item.content.label}?") }, text = { Text("This deletion will sync to your other devices.") }, confirmButton = { TextButton(onDelete) { Text("Delete") } }, dismissButton = { TextButton({ confirmDelete = false }) { Text("Cancel") } })
}

private fun copySensitive(context: Context, value: String) {
    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    val clip = ClipData.newPlainText("Authier", value)
    clip.description.extras = PersistableBundle().apply {
        putBoolean("android.content.extra.IS_SENSITIVE", true)
        putLong("dev.authier.android.clipboardExpiry", System.currentTimeMillis() + 30_000)
    }
    clipboard.setPrimaryClip(clip)
    android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({ clearExpiredClipboard(context.applicationContext) }, 30_000)
}

/** Android may block background clipboard reads; focus return retries expired-clip cleanup. */
fun clearExpiredClipboard(context: Context) {
    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    val description = clipboard.primaryClipDescription ?: return
    val expiresAt = description.extras?.getLong("dev.authier.android.clipboardExpiry") ?: return
    if (description.label?.toString() == "Authier" && expiresAt > 0 && expiresAt <= System.currentTimeMillis()) {
        if (Build.VERSION.SDK_INT >= 28) clipboard.clearPrimaryClip() else clipboard.setPrimaryClip(ClipData.newPlainText("", ""))
    }
}
