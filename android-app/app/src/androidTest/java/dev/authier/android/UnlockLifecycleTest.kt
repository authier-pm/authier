package dev.authier.android

import android.app.Application
import android.content.Context
import android.content.Intent
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.ViewModelProvider
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import dev.authier.android.crypto.AuthierCrypto
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout
import org.junit.After
import org.junit.Assert.*
import org.junit.Assume.assumeTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import javax.crypto.spec.SecretKeySpec

internal fun seedUnlockFixture(context: Context, seconds: Int = 900) {
    val store = VaultStore(context)
    check(store.read().email in listOf("", "synthetic@example.test")) { "Use a clean debug test installation." }
    val key = SecretKeySpec(ByteArray(32) { (it + 1).toByte() }, "AES")
    val salt = "AAECAwQFBgcICQoLDA0ODw=="
    val snapshot = store.update { VaultSnapshot(email = "synthetic@example.test", encryptionSalt = salt,
        serverUrl = "https://offline.invalid", authSecretEncrypted = AuthierCrypto.encrypt(key, "synthetic device secret", salt),
        lockTimeoutSeconds = seconds) }
    VaultUnlockStore(context).remember(snapshot, key)
}

@RunWith(AndroidJUnit4::class)
class UnlockLifecycleTest {
    private val context: Application = ApplicationProvider.getApplicationContext()
    private var scenario: ActivityScenario<MainActivity>? = null

    @Before fun seed() { seedUnlockFixture(context) }
    @After fun cleanup() {
        scenario?.close()
        VaultUnlockStore(context).clear()
        VaultStore(context).clear()
    }

    private fun launch(): VaultViewModel {
        val activity = ActivityScenario.launch<MainActivity>(Intent(context, MainActivity::class.java))
        scenario = activity
        lateinit var model: VaultViewModel
        activity.onActivity { model = ViewModelProvider(it)[VaultViewModel::class.java] }
        awaitIdle(model)
        return model
    }

    private fun awaitIdle(model: VaultViewModel) = runBlocking {
        withContext(Dispatchers.Main) { withTimeout(5000) { model.ui.first { !it.busy } } }
    }

    @Test fun backgroundAndActivityRecreationPreserveTimedUnlock() {
        val model = launch()
        assertTrue(model.ui.value.unlocked)
        scenario!!.moveToState(Lifecycle.State.CREATED)
        assertTrue(model.ui.value.unlocked)
        scenario!!.moveToState(Lifecycle.State.RESUMED)
        scenario!!.recreate()
        awaitIdle(model)
        assertTrue(model.ui.value.unlocked)
        scenario!!.close()
        scenario = null
        assertTrue(launch().ui.value.unlocked)
    }

    @Test fun manualLockSurvivesNewActivity() {
        val model = launch()
        scenario!!.onActivity { model.lock() }
        scenario!!.close()
        scenario = null
        assertFalse(launch().ui.value.unlocked)
    }

    @Test fun timeoutSelectionWorksOfflineAndBackgroundOnlyStillLocks() {
        val model = launch()
        scenario!!.onActivity { model.changeTimeout(86400) }
        awaitIdle(model)
        assertNull(model.ui.value.error)
        assertEquals(86400, VaultStore(context).read().lockTimeoutSeconds)
        scenario!!.moveToState(Lifecycle.State.CREATED)
        assertTrue(model.ui.value.unlocked)
        scenario!!.moveToState(Lifecycle.State.RESUMED)
        awaitIdle(model)
        scenario!!.onActivity { model.changeTimeout(0) }
        awaitIdle(model)
        scenario!!.moveToState(Lifecycle.State.CREATED)
        assertFalse(model.ui.value.unlocked)
        assertNull(VaultUnlockStore(context).restore(VaultStore(context).read()))
    }

    @Test fun expiredSessionCannotBeRevivedByForegroundOrTouch() {
        val model = launch()
        scenario!!.moveToState(Lifecycle.State.CREATED)
        val store = VaultUnlockStore(context)
        val snapshot = VaultStore(context).read()
        val key = requireNotNull(store.restore(snapshot))
        val now = store.now()
        store.remember(snapshot, key, now.copy(wallTime = now.wallTime - 900_000, elapsedTime = now.elapsedTime - 900_000))
        scenario!!.moveToState(Lifecycle.State.RESUMED)
        awaitIdle(model)
        scenario!!.onActivity { model.touch() }
        assertFalse(model.ui.value.unlocked)
        assertNull(store.restore(snapshot))
    }
}

/** Opt-in fixture for host-driven force-stop/reboot and biometric checks; never included in release builds. */
@RunWith(AndroidJUnit4::class)
class UnlockRestartFixture {
    @Test fun prepare() {
        val mode = InstrumentationRegistry.getArguments().getString("unlockFixture")
        assumeTrue(mode == "seed" || mode == "clear")
        val context: Context = ApplicationProvider.getApplicationContext()
        if (mode == "seed") seedUnlockFixture(context)
        else {
            check(VaultStore(context).read().email in listOf("", "synthetic@example.test"))
            VaultUnlockStore(context).clear()
            VaultStore(context).clear()
        }
    }
}
