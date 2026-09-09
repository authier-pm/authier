package dev.authier.android

import android.content.Intent
import android.os.Bundle
import android.view.WindowManager
import android.view.autofill.AutofillId
import android.view.autofill.AutofillManager
import android.view.autofill.AutofillValue
import android.service.autofill.Dataset
import android.widget.RemoteViews
import androidx.fragment.app.FragmentActivity
import android.view.MotionEvent
import kotlinx.coroutines.delay
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.lifecycleScope
import dev.authier.android.crypto.AuthierCrypto
import kotlinx.coroutines.CancellationException
import javax.crypto.SecretKey
import kotlinx.coroutines.Job
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/** Nonexported, launched solely through an immutable service-created PendingIntent. */
class AutofillUnlockActivity : FragmentActivity() {
    private val unlockStore by lazy { VaultUnlockStore(this) }
    private var biometricEnabled by mutableStateOf(false)
    private var choices by mutableStateOf<List<VaultItem>>(emptyList())
    private var busy by mutableStateOf(false)
    private var unlocked by mutableStateOf(false)
    private var error by mutableStateOf<String?>(null)
    private lateinit var requestedPackage: String
    private lateinit var passwordId: AutofillId
    private var usernameId: AutofillId? = null
    private var masterKey: SecretKey? = null
    private var unlockedSnapshot: VaultSnapshot? = null
    private var activeJob: Job? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
        setResult(RESULT_CANCELED, Intent().putExtras(Bundle.EMPTY))
        val target = intent.getStringExtra(EXTRA_PACKAGE)
        @Suppress("DEPRECATION")
        val passwordTarget = intent.getParcelableExtra<AutofillId>(EXTRA_PASSWORD_ID)
        if (target == null || NativeAutofillTarget.packageFromAssociation(target) != target || passwordTarget == null) {
            finish()
            return
        }
        requestedPackage = target
        passwordId = passwordTarget
        @Suppress("DEPRECATION")
        val usernameTarget = intent.getParcelableExtra<AutofillId>(EXTRA_USERNAME_ID)
        usernameId = usernameTarget
        setContent {
            AuthierTheme {
                AutofillUnlockScreen(requestedPackage, choices, unlocked, busy, error, { unlock(password = it) }, ::fill, ::finish,
                    if (biometricEnabled) { { unlock(biometric = true) } } else null)
            }
        }
        unlock()
        lifecycleScope.launch {
            while (true) {
                delay(1000)
                val snapshot = unlockedSnapshot
                if (unlocked && snapshot != null && snapshot.lockTimeoutSeconds > 0 && unlockStore.restore(snapshot) == null) finish()
            }
        }
    }

    override fun dispatchTouchEvent(event: MotionEvent): Boolean {
        if (event.actionMasked == MotionEvent.ACTION_DOWN && unlocked) {
            val snapshot = unlockedSnapshot
            val key = masterKey
            if (snapshot != null && key != null) {
                if (snapshot.lockTimeoutSeconds > 0 && unlockStore.restore(snapshot) == null) {
                    finish()
                    return true
                }
                unlockStore.remember(snapshot, key)
            }
        }
        return super.dispatchTouchEvent(event)
    }

    private fun unlock(password: String? = null, biometric: Boolean = false) {
        if (busy) return
        busy = true
        error = null
        activeJob = lifecycleScope.launch {
            try {
                val snapshot = withContext(Dispatchers.IO) { VaultStore(this@AutofillUnlockActivity).read() }
                require(snapshot.authSecretEncrypted.isNotBlank()) { "Open Authier and sign in before using autofill." }
                biometricEnabled = unlockStore.biometricEnabled(snapshot)
                val key = when {
                    password != null -> withContext(Dispatchers.Default) { AuthierCrypto.deriveMasterKey(password, snapshot.encryptionSalt) }
                    biometric -> {
                        val cipher = unlockStore.prepareBiometric(snapshot, enrolling = false)
                        val authenticated = BiometricUnlock.authenticate(this@AutofillUnlockActivity, cipher, enrolling = false)
                        unlockStore.unlockBiometric(snapshot, authenticated)
                    }
                    else -> unlockStore.restore(snapshot) ?: return@launch
                }
                val matching = withContext(Dispatchers.Default) {
                    AuthierCrypto.decrypt(key, snapshot.authSecretEncrypted)
                    snapshot.secrets.filter { it.deletedAt == null && it.kind == "LOGIN_CREDENTIALS" }.mapNotNull { record ->
                        // One incompatible imported item must not hide the other matching logins.
                        val content = runCatching { SecretContentDecoder.decode(AuthierCrypto.decrypt(key, record.encrypted), record.kind) }.getOrNull()
                        if (content != null && content.password.isNotEmpty()) VaultItem(record, content) else null
                    }
                }
                if (password != null || biometric) unlockStore.remember(snapshot, key)
                masterKey = key
                unlockedSnapshot = snapshot
                choices = matching.sortedBy { it.content.label.lowercase() }
                unlocked = true
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (failure: Exception) {
                if (failure is android.security.keystore.KeyPermanentlyInvalidatedException) {
                    unlockStore.disableBiometric()
                    biometricEnabled = false
                }
                error = if (failure is javax.crypto.AEADBadTagException) "That master password could not unlock this vault." else failure.message ?: "Unable to unlock Authier."
            } finally {
                busy = false
            }
        }
    }

    private fun fill(item: VaultItem) {
        if (busy || !unlocked || item !in choices) return
        val key = masterKey ?: return
        val unlockedVault = unlockedSnapshot ?: return
        if (unlockedVault.lockTimeoutSeconds > 0 && unlockStore.restore(unlockedVault) == null) { finish(); return }
        busy = true
        error = null
        activeJob = lifecycleScope.launch {
            try {
                withContext(Dispatchers.IO) {
                    val store = VaultStore(this@AutofillUnlockActivity)
                    if (NativeAutofillTarget.matchesAssociation(item.content.androidUri, requestedPackage)) {
                        validateAutofillSelection(store.read(), unlockedVault, item)
                    } else {
                        store.update { current -> associateAutofillLogin(current, unlockedVault, item, key, requestedPackage) }
                    }
                }
                returnFill(item)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (failure: Exception) {
                error = failure.message ?: "Unable to save this app association. Please try again."
            } finally {
                busy = false
            }
        }
    }

    private fun returnFill(item: VaultItem) {
        val presentation = RemoteViews(packageName, android.R.layout.simple_list_item_1).apply {
            setTextViewText(android.R.id.text1, item.content.label)
        }
        val dataset = Dataset.Builder(presentation)
            .setValue(passwordId, AutofillValue.forText(item.content.password))
        usernameId?.let { dataset.setValue(it, AutofillValue.forText(item.content.username)) }
        setResult(RESULT_OK, Intent().putExtra(AutofillManager.EXTRA_AUTHENTICATION_RESULT, dataset.build()))
        choices = emptyList()
        unlocked = false
        finish()
    }

    override fun onStop() {
        activeJob?.cancel()
        masterKey = null
        unlockedSnapshot = null
        choices = emptyList()
        unlocked = false
        // A backgrounded picker must never retain or later reveal decrypted credentials.
        if (!isFinishing) finish()
        super.onStop()
    }

    companion object {
        const val EXTRA_PACKAGE = "dev.authier.android.autofill.PACKAGE"
        const val EXTRA_PASSWORD_ID = "dev.authier.android.autofill.PASSWORD_ID"
        const val EXTRA_USERNAME_ID = "dev.authier.android.autofill.USERNAME_ID"
    }
}

@Composable
internal fun AutofillUnlockScreen(
    requestedPackage: String,
    choices: List<VaultItem>,
    unlocked: Boolean,
    busy: Boolean,
    error: String?,
    onUnlock: (String) -> Unit,
    onSelect: (VaultItem) -> Unit,
    onCancel: () -> Unit,
    onBiometricUnlock: (() -> Unit)? = null,
) {
    var password by remember { mutableStateOf("") }
    var selected by remember { mutableStateOf<VaultItem?>(null) }
    var search by remember { mutableStateOf("") }
    val linked = choices.filter { NativeAutofillTarget.matchesAssociation(it.content.androidUri, requestedPackage) }
    var showOther by remember { mutableStateOf(false) }
    val other = choices.filter { it !in linked &&
        (it.content.label.contains(search, ignoreCase = true) || it.content.username.contains(search, ignoreCase = true)) }
    if (unlocked) selected?.let { item ->
        AutofillAssociationConfirmation(item, requestedPackage, busy,
            onConfirm = { selected = null; onSelect(item) }, onDismiss = { selected = null })
    }
    Surface(Modifier.fillMaxSize(), color = Canvas) {
        LazyColumn(Modifier.fillMaxSize().safeDrawingPadding().imePadding(), contentPadding = PaddingValues(24.dp), verticalArrangement = Arrangement.spacedBy(20.dp)) {
            item {
                Text("Fill with Authier", style = MaterialTheme.typography.headlineLarge)
                Spacer(Modifier.height(12.dp))
                Text("Share a saved login with this Android app:", color = Muted)
                Text(requestedPackage, color = Mint)
            }
            if (!unlocked) item {
                if (onBiometricUnlock != null) Button(onBiometricUnlock, enabled = !busy, modifier = Modifier.fillMaxWidth()) { Text("Unlock with fingerprint") }
                PasswordField(password, { password = it }, "Master password")
                Spacer(Modifier.height(18.dp))
                Button({ onUnlock(password); password = "" }, enabled = !busy && password.isNotEmpty(), modifier = Modifier.fillMaxWidth()) {
                    Text(if (busy) "Unlocking…" else "Unlock and choose a login")
                }
            }
            error?.let { message -> item { Text(message, color = MaterialTheme.colorScheme.error) } }
            if (unlocked) {
                if (choices.isEmpty()) item { Text("No saved passwords yet. Add a login in Authier first.", color = Muted) }
                if (linked.isNotEmpty()) {
                    item { Text("Linked to this app", style = MaterialTheme.typography.titleMedium) }
                    items(linked, key = { it.record.id }) { item -> AutofillLoginButton(item, busy) { onSelect(item) } }
                    item { TextButton({ showOther = !showOther }, enabled = !busy) {
                        Text(if (showOther) "Hide other logins" else "Choose another saved login")
                    } }
                }
                if (choices.isNotEmpty() && (linked.isEmpty() || showOther)) {
                    item {
                        Text("Choose a saved login", style = MaterialTheme.typography.titleMedium)
                        Spacer(Modifier.height(8.dp))
                        Text("Confirm a login to remember it for this app. The link is saved on this device and syncs next time you open Authier.", color = Muted)
                        Spacer(Modifier.height(16.dp))
                        OutlinedTextField(search, { search = it }, label = { Text("Search logins") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                    }
                    items(other, key = { it.record.id }) { item -> AutofillLoginButton(item, busy) { selected = item } }
                    if (other.isEmpty()) item { Text("No other logins match your search.", color = Muted) }
                }
            }
            item { TextButton(onCancel, modifier = Modifier.fillMaxWidth()) { Text("Cancel") } }
        }
    }
}

@Composable
private fun AutofillLoginButton(item: VaultItem, busy: Boolean, onSelect: () -> Unit) {
    OutlinedButton(onSelect, enabled = !busy, modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
            Text(item.content.label)
            Text(item.content.username, style = MaterialTheme.typography.bodySmall)
        }
    }
}

@Composable
private fun AutofillAssociationConfirmation(
    item: VaultItem, requestedPackage: String, busy: Boolean, onConfirm: () -> Unit, onDismiss: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = { if (!busy) onDismiss() },
        title = { Text("Use this login for this app?") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(item.content.label, style = MaterialTheme.typography.titleMedium)
                Text(item.content.username)
                Text("The username and password will be shared with:")
                Text(requestedPackage, color = Mint)
                Text("Authier will remember this choice for future autofill.")
                item.content.androidUri?.takeIf { it.isNotBlank() }?.let { previous ->
                    Text("This replaces the existing app link: $previous", color = MaterialTheme.colorScheme.error)
                }
            }
        },
        confirmButton = { TextButton(onConfirm, enabled = !busy) { Text("Use login and fill") } },
        dismissButton = { TextButton(onDismiss, enabled = !busy) { Text("Cancel") } },
    )
}
