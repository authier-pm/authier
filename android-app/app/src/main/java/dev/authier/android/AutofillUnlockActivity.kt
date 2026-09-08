package dev.authier.android

import android.content.Intent
import android.os.Bundle
import android.view.WindowManager
import android.view.autofill.AutofillId
import android.view.autofill.AutofillManager
import android.view.autofill.AutofillValue
import android.service.autofill.Dataset
import android.service.autofill.FillResponse
import android.widget.RemoteViews
import androidx.activity.ComponentActivity
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
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/** Nonexported, launched solely through an immutable service-created PendingIntent. */
class AutofillUnlockActivity : ComponentActivity() {
    private var choices by mutableStateOf<List<VaultItem>>(emptyList())
    private var busy by mutableStateOf(false)
    private var unlocked by mutableStateOf(false)
    private var error by mutableStateOf<String?>(null)
    private lateinit var requestedPackage: String
    private lateinit var passwordId: AutofillId
    private var usernameId: AutofillId? = null

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
                AutofillUnlockScreen(requestedPackage, choices, unlocked, busy, error, ::unlock, ::fill, ::finish)
            }
        }
    }

    private fun unlock(password: String) {
        if (busy) return
        busy = true
        error = null
        lifecycleScope.launch {
            try {
                val snapshot = withContext(Dispatchers.IO) { VaultStore(this@AutofillUnlockActivity).read() }
                require(snapshot.authSecretEncrypted.isNotBlank()) { "Open Authier and sign in before using autofill." }
                val matching = withContext(Dispatchers.Default) {
                    val key = AuthierCrypto.deriveMasterKey(password, snapshot.encryptionSalt)
                    AuthierCrypto.decrypt(key, snapshot.authSecretEncrypted)
                    snapshot.secrets.filter { it.deletedAt == null && it.kind == "LOGIN_CREDENTIALS" }.mapNotNull { record ->
                        // One incompatible imported item must not hide the other matching logins.
                        val content = runCatching { SecretContentDecoder.decode(AuthierCrypto.decrypt(key, record.encrypted), record.kind) }.getOrNull()
                        if (content != null && NativeAutofillTarget.matchesAssociation(content.androidUri, requestedPackage) && content.password.isNotEmpty()) VaultItem(record, content) else null
                    }
                }
                choices = matching.sortedBy { it.content.label.lowercase() }
                unlocked = true
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (failure: Exception) {
                error = if (failure is javax.crypto.AEADBadTagException) "That master password could not unlock this vault." else failure.message ?: "Unable to unlock Authier."
            } finally {
                busy = false
            }
        }
    }

    private fun fill(item: VaultItem) {
        if (!unlocked || item !in choices || !NativeAutofillTarget.matchesAssociation(item.content.androidUri, requestedPackage)) return
        val presentation = RemoteViews(packageName, android.R.layout.simple_list_item_1).apply {
            setTextViewText(android.R.id.text1, item.content.label)
        }
        val dataset = Dataset.Builder(presentation)
            .setValue(passwordId, AutofillValue.forText(item.content.password))
        usernameId?.let { dataset.setValue(it, AutofillValue.forText(item.content.username)) }
        val response = FillResponse.Builder().addDataset(dataset.build()).build()
        setResult(RESULT_OK, Intent().putExtra(AutofillManager.EXTRA_AUTHENTICATION_RESULT, response))
        choices = emptyList()
        unlocked = false
        finish()
    }

    override fun onStop() {
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
) {
    var password by remember { mutableStateOf("") }
    Surface(Modifier.fillMaxSize(), color = Canvas) {
        LazyColumn(Modifier.fillMaxSize().safeDrawingPadding().imePadding(), contentPadding = PaddingValues(24.dp), verticalArrangement = Arrangement.spacedBy(20.dp)) {
            item {
                Text("Fill with Authier", style = MaterialTheme.typography.headlineLarge)
                Spacer(Modifier.height(12.dp))
                Text("Share a saved login with this Android app:", color = Muted)
                Text(requestedPackage, color = Mint)
            }
            if (!unlocked) item {
                PasswordField(password, { password = it }, "Master password")
                Spacer(Modifier.height(18.dp))
                Button({ onUnlock(password); password = "" }, enabled = !busy && password.isNotEmpty(), modifier = Modifier.fillMaxWidth()) {
                    Text(if (busy) "Unlocking…" else "Unlock and choose a login")
                }
            }
            error?.let { message -> item { Text(message, color = MaterialTheme.colorScheme.error) } }
            if (unlocked && choices.isEmpty()) item {
                Text("No logins are linked to this app. Open Authier, edit a password, and add this exact package in Android package. Website matching is not enabled.", color = Muted)
            }
            items(choices, key = { it.record.id }) { item ->
                OutlinedButton({ onSelect(item) }, modifier = Modifier.fillMaxWidth()) {
                    Column(Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
                        Text(item.content.label)
                        Text(item.content.username, style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
            item { TextButton(onCancel, modifier = Modifier.fillMaxWidth()) { Text("Cancel") } }
        }
    }
}
