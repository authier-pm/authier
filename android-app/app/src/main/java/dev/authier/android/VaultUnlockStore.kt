package dev.authier.android

import android.content.Context
import android.os.Build
import android.os.SystemClock
import android.provider.Settings
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import java.io.File
import java.security.KeyStore
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

@Serializable
internal data class SavedUnlock(val identity: String = "", val session: String? = null, val biometric: String? = null)
@Serializable
internal data class SessionUnlock(val key: String, val lease: UnlockLease)

/** Only wrapped keys reach disk. Biometric and timed unlock have separate Keystore keys. */
class VaultUnlockStore(private val context: Context) {
    private val file = AtomicJsonFile(File(context.noBackupFilesDir, "vault-unlock.json"), SavedUnlock.serializer(), ::SavedUnlock)

    fun now() = UnlockLease(System.currentTimeMillis(), SystemClock.elapsedRealtime(),
        Settings.Global.getInt(context.contentResolver, Settings.Global.BOOT_COUNT, 0))

    private fun identity(snapshot: VaultSnapshot) = vaultJson.encodeToString(listOf(
        snapshot.serverUrl, snapshot.email, snapshot.deviceId, snapshot.encryptionSalt, snapshot.authSecretEncrypted))

    private fun read(snapshot: VaultSnapshot): SavedUnlock {
        val saved = file.read()
        if (saved.identity == identity(snapshot)) return saved
        clear()
        return SavedUnlock(identity(snapshot))
    }

    private fun wrappingKey(biometric: Boolean, create: Boolean): SecretKey {
        val alias = if (biometric) BIOMETRIC_ALIAS else SESSION_ALIAS
        val keystore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (keystore.getKey(alias, null) as? SecretKey)?.let { return it }
        check(create) { "Saved unlock is unavailable. Unlock with your master password and set up fingerprint unlock again if needed." }
        val spec = KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
            .setKeySize(256).setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setRandomizedEncryptionRequired(true)
        if (biometric) {
            spec.setUserAuthenticationRequired(true).setInvalidatedByBiometricEnrollment(true)
            if (Build.VERSION.SDK_INT >= 30) spec.setUserAuthenticationParameters(0, KeyProperties.AUTH_BIOMETRIC_STRONG)
            else {
                @Suppress("DEPRECATION")
                spec.setUserAuthenticationValidityDurationSeconds(-1)
            }
        }
        return KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore").apply { init(spec.build()) }.generateKey()
    }

    private fun cipher(snapshot: VaultSnapshot, biometric: Boolean, sealed: String? = null): Cipher =
        Cipher.getInstance("AES/GCM/NoPadding").apply {
            val key = wrappingKey(biometric, create = sealed == null)
            if (sealed == null) init(Cipher.ENCRYPT_MODE, key)
            else init(Cipher.DECRYPT_MODE, key, GCMParameterSpec(128, decode(sealed).copyOfRange(0, 12)))
            if (!biometric) updateAAD(identity(snapshot).toByteArray())
        }

    private fun seal(cipher: Cipher, bytes: ByteArray): String = try {
        encode(cipher.iv + cipher.doFinal(bytes))
    } finally { bytes.fill(0) }

    private fun open(cipher: Cipher, sealed: String): ByteArray {
        val data = decode(sealed)
        return cipher.doFinal(data, 12, data.size - 12)
    }

    fun remember(snapshot: VaultSnapshot, key: SecretKey, lease: UnlockLease = now()) = synchronized(storageLock) {
        val saved = read(snapshot)
        if (snapshot.lockTimeoutSeconds == 0) file.write(saved.copy(session = null))
        else {
            require(snapshot.lockTimeoutSeconds in 1..86400)
            val raw = key.encoded
            val session = try { SessionUnlock(encode(raw), lease) } finally { raw.fill(0) }
            file.write(saved.copy(session = seal(cipher(snapshot, false), vaultJson.encodeToString(session).toByteArray())))
        }
    }

    fun restore(snapshot: VaultSnapshot): SecretKey? = synchronized(storageLock) {
        val saved = read(snapshot)
        val sealed = saved.session ?: return null
        val bytes = open(cipher(snapshot, false, sealed), sealed)
        val session = try { vaultJson.decodeFromString<SessionUnlock>(String(bytes)) } finally { bytes.fill(0) }
        if (!session.lease.isValid(now(), snapshot.lockTimeoutSeconds)) {
            clearSession()
            return null
        }
        keyFromBytes(decode(session.key))
    }

    fun biometricEnabled(snapshot: VaultSnapshot): Boolean = synchronized(storageLock) { read(snapshot).biometric != null }

    fun prepareBiometric(snapshot: VaultSnapshot, enrolling: Boolean): Cipher = synchronized(storageLock) {
        val saved = read(snapshot)
        if (enrolling) {
            disableBiometric()
            cipher(snapshot, true)
        } else cipher(snapshot, true, requireNotNull(saved.biometric) { "Set up fingerprint unlock in Settings first." })
    }

    fun enableBiometric(snapshot: VaultSnapshot, key: SecretKey, cipher: Cipher) = synchronized(storageLock) {
        // Authentication-per-use keys cannot process even AAD until the prompt succeeds.
        cipher.updateAAD(identity(snapshot).toByteArray())
        file.write(read(snapshot).copy(biometric = seal(cipher, key.encoded)))
    }

    fun unlockBiometric(snapshot: VaultSnapshot, cipher: Cipher): SecretKey = synchronized(storageLock) {
        cipher.updateAAD(identity(snapshot).toByteArray())
        keyFromBytes(open(cipher, requireNotNull(read(snapshot).biometric)))
    }

    fun clearSession() = synchronized(storageLock) {
        file.write(file.read().copy(session = null))
        KeyStore.getInstance("AndroidKeyStore").apply { load(null); deleteEntry(SESSION_ALIAS) }
    }

    fun disableBiometric() = synchronized(storageLock) {
        file.write(file.read().copy(biometric = null))
        KeyStore.getInstance("AndroidKeyStore").apply { load(null); deleteEntry(BIOMETRIC_ALIAS) }
    }

    fun clear() = synchronized(storageLock) {
        file.delete()
        KeyStore.getInstance("AndroidKeyStore").apply { load(null); deleteEntry(SESSION_ALIAS); deleteEntry(BIOMETRIC_ALIAS) }
    }

    private fun keyFromBytes(bytes: ByteArray): SecretKey = try {
        require(bytes.size == 32) { "Invalid saved vault key. Unlock with your master password." }
        SecretKeySpec(bytes, "AES")
    } finally { bytes.fill(0) }

    private fun encode(bytes: ByteArray) = Base64.getEncoder().encodeToString(bytes)
    private fun decode(value: String) = Base64.getDecoder().decode(value)

    private companion object {
        val storageLock = Any()
        const val SESSION_ALIAS = "authier-timed-unlock-v1"
        const val BIOMETRIC_ALIAS = "authier-biometric-unlock-v1"
    }
}
