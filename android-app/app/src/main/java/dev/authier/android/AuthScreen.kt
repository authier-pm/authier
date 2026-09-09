package dev.authier.android

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.activity.compose.LocalActivity
import androidx.fragment.app.FragmentActivity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun AuthScreen(state: VaultUiState, model: VaultViewModel) {
    val activity = LocalActivity.current as FragmentActivity
    var email by remember { mutableStateOf(state.email) }
    var password by remember { mutableStateOf("") }
    var server by remember { mutableStateOf(state.serverUrl) }
    var registering by remember { mutableStateOf(false) }
    var showServer by remember { mutableStateOf(false) }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 28.dp).padding(top = 52.dp, bottom = 28.dp), verticalArrangement = Arrangement.spacedBy(20.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Icon(Icons.Outlined.Shield, null, tint = Mint, modifier = Modifier.size(30.dp))
            Text("authier", fontSize = 25.sp, fontWeight = FontWeight.Bold, letterSpacing = (-1).sp)
        }
        Spacer(Modifier.height(35.dp))
        Box(Modifier.size(64.dp).background(Mint.copy(alpha = .12f), RoundedCornerShape(20.dp)), contentAlignment = Alignment.Center) {
            Icon(Icons.Outlined.Lock, null, tint = Mint, modifier = Modifier.size(30.dp))
        }
        Text(if (state.remembered) "Welcome back." else "Your digital life.\nUnder lock & key.", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold)
        Text(if (state.remembered) "Unlock ${state.email}. Your vault is available offline." else "Passwords and verification codes, encrypted on your device. Only you hold the key.", color = Muted, style = MaterialTheme.typography.bodyLarge)
        if (!state.remembered) OutlinedTextField(email, { email = it }, label = { Text("Email address") }, singleLine = true, modifier = Modifier.fillMaxWidth(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email))
        if (state.remembered && state.biometricEnabled) {
            Button({ if (state.demo) model.demo() else model.unlockBiometric(activity) }, enabled = !state.busy, modifier = Modifier.fillMaxWidth().height(54.dp)) {
                Text("Unlock with fingerprint")
            }
            Text("Or use your master password", color = Muted, style = MaterialTheme.typography.bodySmall)
        }
        PasswordField(password, { password = it }, "Master password")
        if (state.pendingApproval) Surface(color = Mint.copy(alpha = .1f), shape = RoundedCornerShape(16.dp)) {
            Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("Waiting for device approval", color = Mint, fontWeight = FontWeight.SemiBold)
                Text("Open Devices in an existing Authier app and approve this phone. Then check again.", style = MaterialTheme.typography.bodyMedium)
            }
        }
        Button(onClick = {
            when {
                state.demo -> model.demo()
                state.remembered -> model.unlock(password)
                else -> model.authenticate(email, password, server, registering)
            }
            if (state.remembered) password = ""
        }, enabled = !state.busy, modifier = Modifier.fillMaxWidth().height(54.dp), shape = RoundedCornerShape(14.dp)) {
            if (state.busy) CircularProgressIndicator(Modifier.size(20.dp), color = Canvas, strokeWidth = 2.dp)
            else Text(when { state.remembered -> "Unlock vault"; state.pendingApproval -> "Check approval & sign in"; registering -> "Create encrypted vault"; else -> "Sign in" }, fontWeight = FontWeight.Bold)
        }
        if (!state.remembered) {
            TextButton(onClick = { registering = !registering }, modifier = Modifier.fillMaxWidth()) { Text(if (registering) "Already have a vault? Sign in" else "New to Authier? Create a vault") }
            TextButton(onClick = { showServer = !showServer }, modifier = Modifier.align(Alignment.CenterHorizontally)) { Text("Server settings", color = Muted) }
            if (showServer) OutlinedTextField(server, { server = it }, label = { Text("Server origin") }, singleLine = true, modifier = Modifier.fillMaxWidth(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri))
            if (BuildConfig.DEBUG) TextButton(onClick = { model.demo() }, modifier = Modifier.align(Alignment.CenterHorizontally)) { Text("Explore demo vault", color = Mint) }
        }
        Text("End-to-end encrypted. Open source. Yours.", color = Muted, style = MaterialTheme.typography.labelMedium, modifier = Modifier.align(Alignment.CenterHorizontally))
    }
}

@Composable
fun PasswordField(value: String, onValueChange: (String) -> Unit, label: String) {
    var visible by remember { mutableStateOf(false) }
    OutlinedTextField(value, onValueChange, label = { Text(label) }, singleLine = true, modifier = Modifier.fillMaxWidth(),
        visualTransformation = if (visible) VisualTransformation.None else PasswordVisualTransformation(),
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
        trailingIcon = { IconButton(onClick = { visible = !visible }) { Icon(if (visible) Icons.Outlined.VisibilityOff else Icons.Outlined.Visibility, if (visible) "Hide password" else "Show password") } })
}
