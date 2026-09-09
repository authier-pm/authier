package dev.authier.android

import android.content.Context
import android.content.Intent
import androidx.biometric.BiometricManager
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout
import org.junit.After
import org.junit.Assert.*
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith

/** Run with -e biometricTest true on an emulator with a fingerprint enrolled; touch it for both prompts. */
@RunWith(AndroidJUnit4::class)
class BiometricUnlockTest {
    private val context: Context = ApplicationProvider.getApplicationContext()
    private var scenario: ActivityScenario<MainActivity>? = null

    @After fun cleanup() {
        if (scenario == null) return
        scenario?.close()
        VaultUnlockStore(context).clear()
        VaultStore(context).clear()
    }

    @Test fun authenticatedCipherCanWrapAndRecoverTheKeyAfterManualLock() = runBlocking {
        assumeTrue(InstrumentationRegistry.getArguments().getString("biometricTest") == "true")
        assumeTrue(BiometricUnlock.availability(context) == BiometricManager.BIOMETRIC_SUCCESS)
        seedUnlockFixture(context)
        val store = VaultUnlockStore(context)
        val snapshot = VaultStore(context).read()
        val key = requireNotNull(store.restore(snapshot))
        val activityScenario = ActivityScenario.launch<MainActivity>(Intent(context, MainActivity::class.java))
        scenario = activityScenario
        lateinit var activity: MainActivity
        activityScenario.onActivity { activity = it }
        withContext(Dispatchers.Main) {
            withTimeout(30_000) {
                val encryptor = BiometricUnlock.authenticate(activity, store.prepareBiometric(snapshot, true), true)
                store.enableBiometric(snapshot, key, encryptor)
                assertTrue(store.biometricEnabled(snapshot))
                store.clearSession()
                assertNull(store.restore(snapshot))
                val restarted = VaultUnlockStore(context)
                val decryptor = BiometricUnlock.authenticate(activity, restarted.prepareBiometric(snapshot, false), false)
                assertArrayEquals(key.encoded, restarted.unlockBiometric(snapshot, decryptor).encoded)
                restarted.disableBiometric()
                assertFalse(store.biometricEnabled(snapshot))
            }
        }
    }
}
