package dev.authier.android

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import android.view.KeyEvent
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class TotpEditorTest {
    @get:Rule val compose = createComposeRule()

    @Test fun cancellingCameraAndSystemBackPreserveTheDraftWithoutSaving() {
        val initial = SecretContent(label = "Unsaved account", secret = "JBSWY3DPEHPK3PXP", period = 60)
        var saved: SecretContent? = null
        var dismissed = false
        compose.setContent {
            AuthierTheme {
                SecretEditor(initial, "TOTP", false, { dismissed = true }, { kind, content ->
                    assertEquals("TOTP", kind)
                    saved = content
                })
            }
        }
        compose.onNodeWithText("Scan QR code").performClick()
        compose.onNodeWithText("Enter setup key manually").performClick()
        compose.onNodeWithText("Unsaved account").assertIsDisplayed()
        compose.onNodeWithText("Scan QR code").performClick()
        InstrumentationRegistry.getInstrumentation().sendKeyDownUpSync(KeyEvent.KEYCODE_BACK)
        compose.onNodeWithText("Unsaved account").assertIsDisplayed()
        compose.runOnIdle {
            assertFalse(dismissed)
            assertNull(saved)
        }
        compose.onNodeWithText("Save encrypted item").performScrollTo().performClick()
        compose.runOnIdle { assertEquals(initial, saved) }
    }
}
