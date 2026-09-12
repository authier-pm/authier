package dev.authier.android

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.os.SystemClock
import android.view.WindowManager
import android.view.accessibility.AccessibilityNodeInfo
import androidx.biometric.BiometricManager
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.lifecycle.ViewModelProvider
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout
import org.junit.After
import org.junit.Rule
import org.junit.Assert.*
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith
import dev.authier.android.crypto.AuthierCrypto
import java.io.File

/** Run with -e biometricTest true on an emulator with a fingerprint enrolled; touch it for both prompts. */
@RunWith(AndroidJUnit4::class)
class BiometricUnlockTest {
    @get:Rule val compose = createEmptyComposeRule()
    private val context: Context = ApplicationProvider.getApplicationContext()
    private var scenario: ActivityScenario<MainActivity>? = null

    private fun awaitPrompt(): AccessibilityNodeInfo {
        val automation = InstrumentationRegistry.getInstrumentation().uiAutomation
        val deadline = SystemClock.uptimeMillis() + 10_000
        while (SystemClock.uptimeMillis() < deadline) {
            val button = automation.rootInActiveWindow?.findAccessibilityNodeInfosByText("Use master password")?.firstOrNull()
            if (button != null) return button
            SystemClock.sleep(50)
        }
        error("Expected the automatic Android biometric prompt")
    }

    private fun awaitIdle(model: VaultViewModel) = runBlocking {
        withContext(Dispatchers.Main) { withTimeout(30_000) { model.ui.first { !it.busy } } }
    }

    private fun capture(name: String) {
        val automation = InstrumentationRegistry.getInstrumentation().uiAutomation
        automation.waitForIdle(300, 5000)
        val bitmap = requireNotNull(automation.takeScreenshot())
        File(context.getExternalFilesDir(null), name).outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
        bitmap.recycle()
    }

    @Test fun openingLockedVaultPromptsAutomaticallyAndDismissalAllowsPassword() = runBlocking {
        assumeTrue(InstrumentationRegistry.getArguments().getString("biometricTest") == "true")
        assumeTrue(BiometricUnlock.availability(context) == BiometricManager.BIOMETRIC_SUCCESS)
        seedUnlockFixture(context)
        val password = "synthetic master password"
        val vault = VaultStore(context)
        val key = AuthierCrypto.deriveMasterKey(password, vault.read().encryptionSalt)
        val snapshot = vault.update { it.copy(authSecretEncrypted = AuthierCrypto.encrypt(key, "synthetic device secret", it.encryptionSalt)) }
        val store = VaultUnlockStore(context)
        store.remember(snapshot, key)
        val intent = Intent(context, MainActivity::class.java)
        var activityScenario = ActivityScenario.launch<MainActivity>(intent)
        scenario = activityScenario
        lateinit var activity: MainActivity
        activityScenario.onActivity { activity = it }
        withContext(Dispatchers.Main) {
            withTimeout(30_000) {
                val cipher = BiometricUnlock.authenticate(activity, store.prepareBiometric(snapshot, true), true)
                store.enableBiometric(snapshot, key, cipher)
            }
        }
        activityScenario.close()
        store.clearSession()
        activityScenario = ActivityScenario.launch(intent)
        scenario = activityScenario
        lateinit var model: VaultViewModel
        activityScenario.onActivity {
            model = ViewModelProvider(it)[VaultViewModel::class.java]
            // Screenshots contain only the synthetic fixture, never a real vault.
            it.window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
        }
        val fallback = awaitPrompt()
        assertTrue(fallback.performAction(AccessibilityNodeInfo.ACTION_CLICK))
        awaitIdle(model)
        assertFalse(model.ui.value.unlocked)
        assertNull(model.ui.value.error)
        activityScenario.recreate()
        awaitIdle(model)
        assertFalse(model.ui.value.busy)
        activityScenario.onActivity { it.window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE) }
        compose.waitForIdle()
        capture("android-fingerprint-password-fallback.png")
        compose.onNodeWithText("Master password").performTextInput(password)
        compose.onNodeWithText("Unlock vault").performClick()
        awaitIdle(model)
        assertTrue(model.ui.value.unlocked)
        activityScenario.close()
        activityScenario = ActivityScenario.launch(intent)
        scenario = activityScenario
        activityScenario.onActivity { model = ViewModelProvider(it)[VaultViewModel::class.java] }
        awaitIdle(model)
        assertTrue("A valid timed session must bypass biometrics", model.ui.value.unlocked)
        activityScenario.onActivity { model.lock() }
        activityScenario.close()
        activityScenario = ActivityScenario.launch(intent)
        scenario = activityScenario
        activityScenario.onActivity { model = ViewModelProvider(it)[VaultViewModel::class.java] }
        awaitPrompt()
        // The host touches the enrolled emulator fingerprint a second time.
        awaitIdle(model)
        assertTrue(model.ui.value.unlocked)
    }

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
