package dev.authier.android

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import java.security.SecureRandom

@Composable
fun SecretEditor(initial: SecretContent, initialKind: String, existing: Boolean, onDismiss: () -> Unit, onSave: (String, SecretContent) -> Unit) {
    var content by remember { mutableStateOf(initial) }
    var kind by remember { mutableStateOf(initialKind) }
    var error by remember { mutableStateOf<String?>(null) }
    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false, decorFitsSystemWindows = false)) {
        Surface(Modifier.fillMaxSize(), color = Canvas) {
            Column(Modifier.fillMaxSize().safeDrawingPadding().imePadding().verticalScroll(rememberScrollState()).padding(24.dp), verticalArrangement = Arrangement.spacedBy(18.dp)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(if (existing) "Edit item" else "Add to your vault", style = MaterialTheme.typography.headlineSmall)
                    TextButton(onDismiss) { Text("Cancel") }
                }
                if (!existing) Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    FilterChip(kind == "LOGIN_CREDENTIALS", { kind = "LOGIN_CREDENTIALS" }, label = { Text("Password") })
                    FilterChip(kind == "TOTP", { kind = "TOTP" }, label = { Text("2FA code") })
                }
                Text("Everything you enter is encrypted before leaving this device.", color = Muted, style = MaterialTheme.typography.bodySmall)
                OutlinedTextField(content.label, { content = content.copy(label = it) }, label = { Text("Name") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(content.url.orEmpty(), { content = content.copy(url = it) }, label = { Text("Website") }, singleLine = true, modifier = Modifier.fillMaxWidth(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri))
                if (kind == "LOGIN_CREDENTIALS") {
                    OutlinedTextField(content.username, { content = content.copy(username = it) }, label = { Text("Username or email") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                    PasswordField(content.password, { content = content.copy(password = it) }, "Password")
                    OutlinedButton({ content = content.copy(password = generatePassword()) }, modifier = Modifier.fillMaxWidth()) { Text("Generate strong password") }
                    OutlinedTextField(content.androidUri.orEmpty(), { content = content.copy(androidUri = it.trim().ifBlank { null }) }, label = { Text("Android package (optional)") }, placeholder = { Text("com.github.android") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                    Text("Autofill only offers this password in the exact app package you enter. Websites and embedded web pages are not matched.", color = Muted, style = MaterialTheme.typography.bodySmall)
                } else {
                    PasswordField(content.secret, { content = content.copy(secret = it.replace(" ", "").uppercase()) }, "Setup key (Base32)")
                    Text("Use the setup key shown by the service when enabling an authenticator app.", color = Muted, style = MaterialTheme.typography.bodySmall)
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        FilterChip(content.digits == 6, { content = content.copy(digits = 6) }, label = { Text("6 digits") })
                        FilterChip(content.digits == 8, { content = content.copy(digits = 8) }, label = { Text("8 digits") })
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        FilterChip(content.period == 30, { content = content.copy(period = 30) }, label = { Text("30 seconds") })
                        FilterChip(content.period == 60, { content = content.copy(period = 60) }, label = { Text("60 seconds") })
                    }
                    Text("SHA1 · compatible with your other Authier apps", color = Muted, style = MaterialTheme.typography.bodySmall)
                }
                error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                Button(onClick = {
                    error = when {
                        content.label.isBlank() -> "Enter a name for this item."
                        kind == "LOGIN_CREDENTIALS" && content.username.isBlank() -> "Enter a username."
                        kind == "LOGIN_CREDENTIALS" && content.password.isBlank() -> "Enter a password."
                        kind == "LOGIN_CREDENTIALS" && content.url.isNullOrBlank() -> "Enter the website for this password."
                        !content.androidUri.isNullOrBlank() && NativeAutofillTarget.packageFromAssociation(content.androidUri) == null -> "Enter an exact Android package, such as com.github.android."
                        kind == "TOTP" && runCatching { dev.authier.android.crypto.Totp.generate(content.secret, content.algorithm, content.digits, content.period) }.isFailure -> "Check the Base32 setup key and code settings."
                        else -> null
                    }
                    if (error == null) onSave(kind, content)
                }, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text("Save encrypted item") }
            }
        }
    }
}

fun generatePassword(): String {
    val alphabet = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#%&*-_+="
    val random = SecureRandom()
    return CharArray(24) { alphabet[random.nextInt(alphabet.length)] }.concatToString()
}
