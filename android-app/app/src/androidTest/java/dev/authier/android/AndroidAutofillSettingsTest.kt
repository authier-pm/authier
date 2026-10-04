package dev.authier.android

import android.Manifest
import android.content.ComponentName
import android.provider.Settings
import android.view.autofill.AutofillManager
import androidx.activity.ComponentActivity
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.lifecycle.Lifecycle
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test

class AndroidAutofillSettingsTest {
    @get:Rule val compose = createAndroidComposeRule<ComponentActivity>()
    private val instrumentation = InstrumentationRegistry.getInstrumentation()
    private val context = instrumentation.targetContext
    private var originalProvider: String? = null

    @Before fun rememberProvider() {
        instrumentation.uiAutomation.adoptShellPermissionIdentity(Manifest.permission.WRITE_SECURE_SETTINGS)
        originalProvider = Settings.Secure.getString(context.contentResolver, "autofill_service")
        Settings.Secure.putString(context.contentResolver, "autofill_service", null)
    }

    @After fun restoreProvider() {
        Settings.Secure.putString(context.contentResolver, "autofill_service", originalProvider)
        instrumentation.uiAutomation.dropShellPermissionIdentity()
    }

    private fun returnWithProvider(provider: String?, enabled: Boolean) {
        compose.activityRule.scenario.moveToState(Lifecycle.State.CREATED)
        Settings.Secure.putString(context.contentResolver, "autofill_service", provider)
        compose.waitUntil(5_000) {
            context.getSystemService(AutofillManager::class.java).hasEnabledAutofillServices() == enabled
        }
        compose.activityRule.scenario.moveToState(Lifecycle.State.RESUMED)
    }

    @Test fun refreshesTheActualProviderOnReturnFromAndroidSettings() {
        compose.setContent { AuthierTheme { AndroidAutofillSettings() } }
        compose.onNodeWithText("Not set up").assertIsDisplayed()
        compose.onNodeWithText("Set up Android Autofill").assertIsDisplayed()

        // Returning without selecting Authier must not claim setup succeeded.
        returnWithProvider(null, enabled = false)
        compose.onNodeWithText("Not set up").assertIsDisplayed()

        val authier = ComponentName(context, NativeAutofillService::class.java).flattenToString()
        returnWithProvider(authier, enabled = true)
        compose.onNodeWithText("Autofill is set up").assertIsDisplayed()
        compose.onNodeWithText("Authier is your Android autofill service.").assertIsDisplayed()
        compose.onNodeWithText("Autofill settings").assertIsDisplayed()
        compose.onNodeWithText("Set up Android Autofill").assertDoesNotExist()

        // Another provider being enabled is not equivalent to Authier being selected.
        returnWithProvider("com.google.android.gms/.autofill.service.AutofillService", enabled = false)
        compose.onNodeWithText("Not set up").assertIsDisplayed()
        compose.onNodeWithText("Set up Android Autofill").assertIsDisplayed()
        compose.onNodeWithText("Autofill is set up").assertDoesNotExist()
    }
}
