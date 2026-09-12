package dev.authier.android

import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.suspendCancellableCoroutine
import javax.crypto.Cipher
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

object BiometricUnlock {
    fun availability(context: Context) = BiometricManager.from(context).canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)

    fun enroll(context: Context) {
        val intent = if (Build.VERSION.SDK_INT >= 30) Intent(Settings.ACTION_BIOMETRIC_ENROLL)
            .putExtra(Settings.EXTRA_BIOMETRIC_AUTHENTICATORS_ALLOWED, BiometricManager.Authenticators.BIOMETRIC_STRONG)
        else Intent(Settings.ACTION_SECURITY_SETTINGS)
        context.startActivity(intent)
    }

    suspend fun authenticate(activity: FragmentActivity, cipher: Cipher, enrolling: Boolean): Cipher = suspendCancellableCoroutine { continuation ->
        // Cancel a prompt whose host is destroyed so rotation cannot leave the vault busy.
        val observer = object : DefaultLifecycleObserver {
            override fun onDestroy(owner: LifecycleOwner) {
                continuation.cancel(CancellationException("Biometric prompt host was destroyed"))
            }
        }
        activity.lifecycle.addObserver(observer)
        val prompt = BiometricPrompt(activity, ContextCompat.getMainExecutor(activity), object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                activity.lifecycle.removeObserver(observer)
                if (continuation.isActive) continuation.resume(requireNotNull(result.cryptoObject?.cipher))
            }
            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                activity.lifecycle.removeObserver(observer)
                if (errorCode == BiometricPrompt.ERROR_NEGATIVE_BUTTON ||
                    errorCode == BiometricPrompt.ERROR_USER_CANCELED ||
                    errorCode == BiometricPrompt.ERROR_CANCELED) {
                    continuation.cancel(CancellationException("Biometric unlock dismissed"))
                    return
                }
                if (continuation.isActive) continuation.resumeWithException(IllegalStateException("$errString You can use your master password."))
            }
        })
        continuation.invokeOnCancellation {
            ContextCompat.getMainExecutor(activity).execute {
                activity.lifecycle.removeObserver(observer)
                prompt.cancelAuthentication()
            }
        }
        val info = BiometricPrompt.PromptInfo.Builder()
            .setTitle(if (enrolling) "Enable fingerprint unlock" else "Unlock Authier")
            .setSubtitle("Use your fingerprint or another strong biometric registered on this phone")
            .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
            .setNegativeButtonText(if (enrolling) "Cancel" else "Use master password")
            .build()
        prompt.authenticate(info, BiometricPrompt.CryptoObject(cipher))
    }
}
