package dev.authier.android

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import dev.authier.android.crypto.AuthierCrypto
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.util.Base64
import javax.crypto.spec.SecretKeySpec

@RunWith(AndroidJUnit4::class)
class VaultUnlockStoreTest {
    private lateinit var context: Context
    private lateinit var store: VaultUnlockStore
    private val key = SecretKeySpec(ByteArray(32) { (it + 1).toByte() }, "AES")
    private val salt = "AAECAwQFBgcICQoLDA0ODw=="
    private val snapshot = VaultSnapshot(email = "synthetic@example.test", encryptionSalt = salt,
        authSecretEncrypted = AuthierCrypto.encrypt(key, "synthetic device secret", salt), lockTimeoutSeconds = 900)

    @Before fun setup() {
        context = ApplicationProvider.getApplicationContext()
        store = VaultUnlockStore(context)
        store.clear()
    }
    @After fun cleanup() { store.clear() }

    @Test fun newStoreRestoresWrappedKeyWithoutPasswordAndDoesNotRenewExpiry() {
        val now = store.now()
        store.remember(snapshot, key, now.copy(wallTime = now.wallTime - 899_000, elapsedTime = now.elapsedTime - 899_000))
        val persisted = File(context.noBackupFilesDir, "vault-unlock.json").readText()
        assertFalse(persisted.contains(Base64.getEncoder().encodeToString(key.encoded)))
        assertArrayEquals(key.encoded, VaultUnlockStore(context).restore(snapshot)?.encoded)
        assertEquals(persisted, File(context.noBackupFilesDir, "vault-unlock.json").readText())
    }

    @Test fun expiredSessionIsRemovedBeforeKeyCanBeRestored() {
        val now = store.now()
        store.remember(snapshot, key, now.copy(wallTime = now.wallTime - 900_000, elapsedTime = now.elapsedTime - 900_000))
        assertNull(VaultUnlockStore(context).restore(snapshot))
        assertNull(store.restore(snapshot))
    }

    @Test fun dayTimeoutAndChangingToBackgroundOnly() {
        val day = snapshot.copy(lockTimeoutSeconds = 86400)
        val now = store.now()
        store.remember(day, key, now.copy(wallTime = now.wallTime - 3_600_000, elapsedTime = now.elapsedTime - 3_600_000))
        assertArrayEquals(key.encoded, store.restore(day)?.encoded)
        store.remember(day.copy(lockTimeoutSeconds = 0), key)
        assertNull(store.restore(day))
    }

    @Test fun manualLockAndSignOutInvalidateAcrossInstances() {
        store.remember(snapshot, key)
        VaultUnlockStore(context).clearSession()
        assertNull(store.restore(snapshot))
        store.remember(snapshot, key)
        VaultUnlockStore(context).clear()
        assertNull(store.restore(snapshot))
        assertFalse(store.biometricEnabled(snapshot))
    }

    @Test fun anotherAccountDeviceOrKeyCannotReuseSession() {
        for (changed in listOf(snapshot.copy(email = "other@example.test"), snapshot.copy(deviceId = "other"),
            snapshot.copy(serverUrl = "https://other.example.test"), snapshot.copy(encryptionSalt = "different"))) {
            store.remember(snapshot, key)
            assertNull(store.restore(changed))
            assertNull(store.restore(snapshot))
        }
    }

    @Test fun shorterTimeoutTakesEffectImmediately() {
        val now = store.now()
        store.remember(snapshot, key, now.copy(wallTime = now.wallTime - 300_000, elapsedTime = now.elapsedTime - 300_000))
        assertNull(store.restore(snapshot.copy(lockTimeoutSeconds = 60)))
    }
}
