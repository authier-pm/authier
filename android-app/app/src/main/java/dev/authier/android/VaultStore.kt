package dev.authier.android

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.AtomicFile
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File
import java.io.FileNotFoundException
import java.security.KeyStore
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

val vaultJson = Json { ignoreUnknownKeys = true; encodeDefaults = true }

class VaultStore(context: Context) {
    private val file = AtomicFile(File(context.noBackupFilesDir, "encrypted-vault.json"))
    private val keyAlias = "authier-session-v1"

    fun read(): VaultSnapshot = synchronized(storageLock) {
        try {
            // openRead restores the legacy .bak after an interrupted write, even if base is absent.
            vaultJson.decodeFromString(file.openRead().bufferedReader().use { it.readText() })
        } catch (error: FileNotFoundException) {
            if (file.baseFile.exists() || File(file.baseFile.path + ".bak").exists()) throw error
            VaultSnapshot()
        }
    }

    fun update(transform: (VaultSnapshot) -> VaultSnapshot): VaultSnapshot = synchronized(storageLock) {
        write(transform(read()))
    }

    fun compareAndWrite(expected: VaultSnapshot, next: VaultSnapshot): VaultSnapshot = update { current ->
        check(current.storageRevision == expected.storageRevision &&
            current.authSecretEncrypted == expected.authSecretEncrypted) {
            "Your vault changed while this action was running. Unlock Authier again to reload it."
        }
        next
    }

    private fun write(snapshot: VaultSnapshot): VaultSnapshot = synchronized(storageLock) {
        val saved = snapshot.copy(storageRevision = java.util.UUID.randomUUID().toString())
        val stream = file.startWrite()
        // AtomicFile rollback is necessary to preserve the prior cursor and page on disk failure.
        try {
            stream.write(vaultJson.encodeToString(saved).toByteArray())
            file.finishWrite(stream)
        } catch (error: Exception) {
            file.failWrite(stream)
            throw error
        }
        saved
    }

    private fun sessionKey(): SecretKey {
        val keystore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (keystore.getKey(keyAlias, null) as? SecretKey)?.let { return it }
        return KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore").apply {
            init(KeyGenParameterSpec.Builder(keyAlias, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
                .setKeySize(256)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setRandomizedEncryptionRequired(true)
                .build())
        }.generateKey()
    }

    fun sealTokens(tokens: SessionTokens): String {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, sessionKey())
        return Base64.getEncoder().encodeToString(cipher.iv + cipher.doFinal(vaultJson.encodeToString(tokens).toByteArray()))
    }

    fun openTokens(sealed: String): SessionTokens? {
        if (sealed.isBlank()) return null
        val data = Base64.getDecoder().decode(sealed)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE, sessionKey(), GCMParameterSpec(128, data.copyOfRange(0, 12)))
        return vaultJson.decodeFromString(String(cipher.doFinal(data.copyOfRange(12, data.size))))
    }

    fun clear() {
        synchronized(storageLock) {
            file.delete()
            KeyStore.getInstance("AndroidKeyStore").apply { load(null); deleteEntry(keyAlias) }
        }
    }

    private companion object {
        // AtomicFile has no locking; the app and autofill Activity share this process lock.
        val storageLock = Any()
    }
}
