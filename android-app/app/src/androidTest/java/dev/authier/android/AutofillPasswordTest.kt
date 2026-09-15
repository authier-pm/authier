package dev.authier.android

import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class AutofillPasswordTest {
    @get:Rule val compose = createComposeRule()
    private val unlocked = mutableStateOf(true)
    private val busy = mutableStateOf(false)
    private var saved = emptyList<SecretContent>()
    private var cancelled = false

    private fun render(create: Boolean = true) {
        compose.setContent {
            AuthierTheme {
                AutofillUnlockScreen("com.browser.app", emptyList(), unlocked.value, busy.value, null,
                    onUnlock = { unlocked.value = true }, onSelect = {}, onCancel = { cancelled = true },
                    webOrigin = "https://example.com", canCreate = true, initiallyCreating = create,
                    initialUsername = "synthetic@example.test", onCreate = { saved = saved + it })
            }
        }
    }

    @Test fun creationRequiresUnlockAndExplicitSave() {
        unlocked.value = false
        render()
        compose.onNodeWithText("New password").assertDoesNotExist()
        compose.onNodeWithText("Master password").performTextInput("synthetic")
        compose.onNodeWithText("Unlock and create a password").performClick()
        compose.onNode(hasText("https://example.com") and !hasSetTextAction()).assertIsDisplayed()
        compose.runOnIdle { assertTrue(saved.isEmpty()) }
        compose.onNodeWithText("Save and fill").performScrollTo().performClick()
        compose.runOnIdle {
            assertEquals(1, saved.size)
            assertEquals("synthetic@example.test", saved.single().username)
            assertEquals(24, saved.single().password.length)
        }
    }

    @Test fun regenerationIsOnlyADraftAndCancellationNeverSaves() {
        render()
        compose.onNodeWithText("Generate another password").performScrollTo().performClick()
        compose.runOnIdle { assertTrue(saved.isEmpty()) }
        compose.onNodeWithText("Cancel").performScrollTo().performClick()
        compose.runOnIdle { assertTrue(cancelled); assertTrue(saved.isEmpty()) }
    }

    @Test fun emptyPasswordAndBusyStatePreventSave() {
        render()
        compose.onNodeWithText("New password").performTextClearance()
        compose.onNodeWithText("Save and fill").performScrollTo().assertIsNotEnabled()
        compose.onNodeWithText("Generate another password").performScrollTo().performClick()
        compose.runOnIdle { busy.value = true }
        compose.onNodeWithText("Saving…").performScrollTo().assertIsNotEnabled()
        compose.onNodeWithText("Generate another password").assertIsNotEnabled()
        compose.onNodeWithText("Cancel").performScrollTo().assertIsNotEnabled()
        compose.runOnIdle { assertTrue(saved.isEmpty()) }
    }

    @Test fun creationIsAvailableWithoutSavedLoginsAndCancelReturnsToPicker() {
        render(create = false)
        compose.onNodeWithText("Create a strong password").performClick()
        compose.onNodeWithText("New password").assertExists()
        compose.onNodeWithText("Cancel").performScrollTo().performClick()
        compose.onNodeWithText("Create a strong password").assertExists()
        compose.runOnIdle { assertFalse(cancelled); assertTrue(saved.isEmpty()) }
    }
}
