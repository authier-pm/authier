package dev.authier.android

import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class RecoverySetupTest {
    @get:Rule val compose = createComposeRule()
    private val draft = mutableStateOf(RecoverySetupDraft())
    private val busy = mutableStateOf(false)
    private var saved: MasterDeviceResetConfig? = null
    private var wentBack = false

    private fun render() {
        compose.setContent {
            AuthierTheme {
                RecoverySetupScreen("alex@example.com", draft.value, { draft.value = it }, busy.value,
                    { wentBack = true }, { saved = it })
            }
        }
    }
    @Test fun confirmsDefaultsAndRequiresExplicitCreation() {
        render()
        compose.runOnIdle { assertNull(saved) }
        compose.onNodeWithText("Create account").performScrollTo().performClick()
        compose.runOnIdle { assertEquals(MasterDeviceResetConfig(), saved) }
    }
    @Test fun submitsCustomPolicyAndMultipleAddresses() {
        render()
        compose.onNodeWithText("Device approvals (0–10)").performScrollTo().performTextReplacement("0")
        compose.onNodeWithText("Minutes").performScrollTo().performClick()
        compose.onNodeWithText("Waiting period", substring = false).performScrollTo().performTextReplacement("5")
        compose.onNodeWithText("+ Add email address").performScrollTo().performClick()
        compose.onNodeWithText("Notification email 1").performScrollTo().performTextReplacement("backup@example.com")
        compose.onNodeWithText("+ Add email address").performScrollTo().performClick()
        compose.onNodeWithText("Notification email 2").performScrollTo().performTextReplacement("family@example.com")
        compose.onNodeWithText("Create account").performScrollTo().performClick()
        compose.runOnIdle { assertEquals(MasterDeviceResetConfig(0, 5, listOf("backup@example.com", "family@example.com")), saved) }
    }
    @Test fun rejectsInvalidInputsAndDisablesActionsWhileSaving() {
        render()
        compose.onNodeWithText("Device approvals (0–10)").performScrollTo().performTextReplacement("11")
        compose.onNodeWithText("Create account").performScrollTo().performClick()
        compose.onNodeWithText("Choose 0 to 10 device approvals.").performScrollTo().assertIsDisplayed()
        compose.runOnIdle { assertNull(saved); busy.value = true }
        compose.onNodeWithText("Creating account…").performScrollTo().assertIsNotEnabled()
        compose.onNodeWithText("Back").performScrollTo().assertIsNotEnabled()
        compose.runOnIdle { busy.value = false }
        compose.onNodeWithText("Back").performScrollTo().performClick()
        compose.runOnIdle { assertTrue(wentBack); assertNull(saved) }
    }
}
