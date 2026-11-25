package dev.authier.android

import android.graphics.Bitmap
import androidx.compose.runtime.*
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Surface
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class NewDeviceApprovalSelectionTest {
    @get:Rule val compose = createComposeRule()

    @Test fun explicitChoiceAndBothRulesAreSavedAtomically() {
        val saved = mutableListOf<NewDeviceApprovalPolicy>()
        compose.setContent {
            AuthierTheme { Column { NewDeviceApprovalEditor(null, false, true) { saved.add(it) } } }
        }
        compose.onNodeWithText("Save approval settings").assertIsNotEnabled()
        compose.onNodeWithText("Another Authier device · Recommended").performClick()
        compose.onNodeWithText("Save approval settings").assertIsEnabled()
        compose.onNodeWithText("Email · Most convenient, least secure").performClick()
        compose.onNodeWithText("Either approval is enough").assertIsSelected()
        compose.onNodeWithText("Require both approvals").performClick()
        compose.runOnIdle { assertTrue(saved.isEmpty()) }
        compose.onNodeWithText("Save approval settings").performClick()
        compose.runOnIdle { assertEquals(listOf(NewDeviceApprovalPolicy.EMAIL_AND_OTHER_DEVICE), saved) }
        compose.onNodeWithText("Either approval is enough").performClick()
        compose.onNodeWithText("Save approval settings").performClick()
        compose.runOnIdle { assertEquals(NewDeviceApprovalPolicy.EMAIL_OR_OTHER_DEVICE, saved.last()) }
        compose.onNodeWithText("Master device only").performClick()
        compose.onNodeWithText("Master device only").assertIsOn()
        compose.onNodeWithText("Email · Most convenient, least secure").assertIsOff()
        compose.onNodeWithText("Another Authier device · Recommended").assertIsOff()
        compose.onNodeWithText("Require both approvals").assertDoesNotExist()
        compose.onNodeWithText("Save approval settings").performClick()
        compose.runOnIdle { assertEquals(NewDeviceApprovalPolicy.MASTER_DEVICE, saved.last()) }
        compose.onNodeWithText("Another Authier device · Recommended").performClick()
        compose.onNodeWithText("Master device only").assertIsOff()
    }

    @Test fun setupCanSaveMasterOnlyApproval() {
        var saved: NewDeviceApprovalPolicy? = null
        compose.setContent {
            AuthierTheme { Surface(color = Canvas) {
                NewDeviceApprovalSetupScreen(VaultUiState(unlocked = true, requiresApprovalSetup = true), { saved = it }, {})
            } }
        }
        compose.onNodeWithText("Master device only").performScrollTo().performClick()
        compose.onNodeWithText("Save approval settings").performScrollTo().assertIsEnabled()
        compose.mainClock.advanceTimeBy(600)
        compose.waitForIdle()
        Thread.sleep(800)
        val screenshot = File(InstrumentationRegistry.getInstrumentation().targetContext.cacheDir, "new-device-approval-master-android.png")
        screenshot.outputStream().use { stream ->
            compose.onRoot().captureToImage().asAndroidBitmap().compress(Bitmap.CompressFormat.PNG, 100, stream)
        }
        compose.onNodeWithText("Save approval settings").performClick()
        compose.runOnIdle { assertEquals(NewDeviceApprovalPolicy.MASTER_DEVICE, saved) }
    }

    @Test fun setupRequiresAChoiceAndShowsBothApprovalRequirements() {
        var saved: NewDeviceApprovalPolicy? = null
        compose.setContent {
            AuthierTheme {
                Surface(color = Canvas) {
                    NewDeviceApprovalSetupScreen(VaultUiState(unlocked = true, requiresApprovalSetup = true), { saved = it }, {})
                }
            }
        }
        compose.onNodeWithText("Save approval settings").performScrollTo().assertIsNotEnabled()
        compose.onNodeWithText("Another Authier device · Recommended").performScrollTo().performClick()
        compose.onNodeWithText("Email · Most convenient, least secure").performScrollTo().performClick()
        compose.onNodeWithText("Require both approvals").performScrollTo().performClick()
        compose.onNodeWithText("Save approval settings").performScrollTo().assertIsEnabled()
        compose.mainClock.advanceTimeBy(600)
        compose.waitForIdle()
        // Android's render-thread ripple uses wall time, outside Compose's test clock.
        Thread.sleep(800)
        val screenshot = File(InstrumentationRegistry.getInstrumentation().targetContext.cacheDir, "new-device-approval-android.png")
        screenshot.outputStream().use { stream ->
            compose.onRoot().captureToImage().asAndroidBitmap().compress(Bitmap.CompressFormat.PNG, 100, stream)
        }
        compose.onNodeWithText("Save approval settings").performClick()
        compose.runOnIdle { assertEquals(NewDeviceApprovalPolicy.EMAIL_AND_OTHER_DEVICE, saved) }
    }
}
