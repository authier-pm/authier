package dev.authier.android

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp

@Composable
fun MessageBanner(message: String, error: Boolean, dismiss: () -> Unit, details: ApiErrorDetails? = null) {
    var showingDetails by remember(message, details) { mutableStateOf(false) }
    Surface(color = if (error) MaterialTheme.colorScheme.errorContainer else Panel) {
        Row(Modifier.fillMaxWidth().padding(start = 16.dp), verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
            Column(Modifier.weight(1f).clickable(enabled = error && details != null, onClickLabel = "Show server response") {
                showingDetails = true
            }.padding(vertical = 12.dp)) {
                Text(message, style = MaterialTheme.typography.bodySmall)
                if (error && details != null) Text("Tap to view server response", style = MaterialTheme.typography.labelMedium)
            }
            IconButton(dismiss) { Icon(Icons.Outlined.Close, "Dismiss message") }
        }
    }
    if (showingDetails && details != null) ApiErrorDialog(details) { showingDetails = false }
}

@Composable
private fun ApiErrorDialog(details: ApiErrorDetails, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Server response") },
        text = {
            SelectionContainer {
                Column(Modifier.heightIn(max = 480.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("HTTP ${details.status}", style = MaterialTheme.typography.titleMedium)
                    Text("${details.method} ${details.url}")
                    details.requestId?.let { Text("Request ID: $it") }
                    HorizontalDivider()
                    Text(details.responseBody.ifEmpty { "(Empty response body)" }, fontFamily = FontFamily.Monospace,
                        style = MaterialTheme.typography.bodySmall)
                }
            }
        },
        confirmButton = { TextButton(onDismiss) { Text("Close") } },
    )
}
