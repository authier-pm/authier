package dev.authier.android

import android.app.PendingIntent
import android.content.Intent
import android.net.Uri
import android.os.CancellationSignal
import android.os.OutcomeReceiver
import androidx.annotation.RequiresApi
import androidx.credentials.exceptions.*
import androidx.credentials.provider.*
import java.util.UUID

@RequiresApi(34)
class PasskeyProviderService : CredentialProviderService() {
    override fun onBeginCreateCredentialRequest(request: BeginCreateCredentialRequest, cancellationSignal: CancellationSignal,
        callback: OutcomeReceiver<BeginCreateCredentialResponse, CreateCredentialException>) {
        if (cancellationSignal.isCanceled) return
        val snapshot = VaultStore(this).read()
        val entries = if (request is BeginCreatePublicKeyCredentialRequest && snapshot.authSecretEncrypted.isNotBlank())
            listOf(CreateEntry(snapshot.email, pendingIntent("create", snapshot))) else emptyList()
        callback.onResult(BeginCreateCredentialResponse(createEntries = entries))
    }

    override fun onBeginGetCredentialRequest(request: BeginGetCredentialRequest, cancellationSignal: CancellationSignal,
        callback: OutcomeReceiver<BeginGetCredentialResponse, GetCredentialException>) {
        if (cancellationSignal.isCanceled) return
        val snapshot = VaultStore(this).read()
        // Action entries receive the BeginGet request and may return a final credential.
        // Account discovery happens in our secure activity after fresh user verification.
        val actions = if (request.beginGetCredentialOptions.any { it is BeginGetPublicKeyCredentialOption } && snapshot.authSecretEncrypted.isNotBlank())
            listOf(Action("Use Authier passkeys", pendingIntent("get", snapshot), "Verify your identity and choose an account")) else emptyList()
        callback.onResult(BeginGetCredentialResponse(actions = actions))
    }

    override fun onClearCredentialStateRequest(request: ProviderClearCredentialStateRequest, cancellationSignal: CancellationSignal,
        callback: OutcomeReceiver<Void?, ClearCredentialException>) {
        // Relying-party sign-out must not delete vault credentials or sign out of Authier.
        if (!cancellationSignal.isCanceled) callback.onResult(null)
    }

    private fun pendingIntent(operation: String, snapshot: VaultSnapshot): PendingIntent {
        val intent = Intent(this, PasskeyActivity::class.java)
            .setAction("$packageName.passkey.$operation")
            .setData(Uri.parse("authier-passkey:${UUID.randomUUID()}"))
            .putExtra(PasskeyActivity.ACCOUNT, snapshot.deviceId + ":" + snapshot.encryptionSalt)
        return PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_MUTABLE or PendingIntent.FLAG_CANCEL_CURRENT)
    }
}
