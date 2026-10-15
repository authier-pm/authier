package dev.authier.android

import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class DeviceManagementTest {
    @get:Rule val compose = createComposeRule()
    private val devices = listOf(
        DeviceInfo("phone", "Pixel", "Android", "2026-09-01T12:00:00Z", "2026-10-13T08:42:00Z", true),
        DeviceInfo("browser", "Chrome on MacBook", "Browser", "2026-10-10T16:15:00Z", null, false),
    )
    private val state = mutableStateOf(VaultUiState(unlocked = true, devices = devices, security = SecurityInfo(masterDeviceId = "phone")))
    private var transfers = emptyList<String>()

    private fun render() {
        compose.setContent {
            AuthierTheme {
                DeviceManagementScreen(state.value, {}, { _, _ -> }, {}, { id ->
                    transfers = transfers + id
                    state.value = state.value.copy(security = state.value.security.copy(masterDeviceId = id))
                })
            }
        }
    }

    @Test fun showsHistoryAndSortsByAddedWithoutLosingSelectionOnRefresh() {
        render()
        compose.onNodeWithText(formatDeviceTimestamp(devices.first().lastSyncAt!!)).assertIsDisplayed()
        compose.onNodeWithText(formatDeviceTimestamp(devices.first().createdAt)).assertIsDisplayed()
        compose.onNodeWithText("Never synced").assertIsDisplayed()
        assertDeviceOrder("Pixel", "Chrome on MacBook")

        compose.onNodeWithText("Sort: Last synced · newest first").performClick()
        compose.onNodeWithText("Added · newest first").performClick()
        assertDeviceOrder("Chrome on MacBook", "Pixel")
        compose.runOnIdle { state.value = state.value.copy(devices = devices.reversed()) }
        compose.onNodeWithText("Sort: Added · newest first").assertIsDisplayed()
        assertDeviceOrder("Chrome on MacBook", "Pixel")

        compose.onNodeWithText("Sort: Added · newest first").performClick()
        compose.onNodeWithText("Added · oldest first").performClick()
        assertDeviceOrder("Pixel", "Chrome on MacBook")
    }

    private fun assertDeviceOrder(first: String, second: String) {
        val firstTop = compose.onNodeWithText(first).fetchSemanticsNode().boundsInRoot.top
        val secondTop = compose.onNodeWithText(second).fetchSemanticsNode().boundsInRoot.top
        assertTrue("$first should appear before $second", firstTop < secondTop)
    }

    @Test fun transferRequiresConfirmationAndMovesTheBadgeAndControls() {
        render()
        compose.onNodeWithText("Pixel").onParent().assert(hasAnyDescendant(hasText("Master device")))
        compose.onNodeWithText("Make master device").performScrollTo().performClick()
        compose.onNodeWithText("Make Chrome on MacBook the master device?").assertIsDisplayed()
        compose.onNodeWithText("Cancel").performClick()
        compose.runOnIdle { assertTrue(transfers.isEmpty()) }
        compose.onNodeWithText("Make master device").performClick()
        compose.onNodeWithText("Transfer master role").performClick()
        compose.runOnIdle {
            assertEquals(listOf("browser"), transfers)
            assertFalse(state.value.isCurrentDeviceMaster)
        }
        compose.onNodeWithText("Make master device").assertDoesNotExist()
        compose.onNodeWithText("Master device").assertIsDisplayed()
        compose.onNodeWithText("Chrome on MacBook").onParent().assert(hasAnyDescendant(hasText("Master device")))
    }

    @Test fun nonMasterAndUnknownMasterNeverOfferTransfer() {
        state.value = state.value.copy(security = SecurityInfo(masterDeviceId = "browser"))
        render()
        compose.onNodeWithText("Master device").assertIsDisplayed()
        compose.onNodeWithText("Make master device").assertDoesNotExist()
        compose.runOnIdle { state.value = state.value.copy(security = SecurityInfo(masterDeviceId = null)) }
        compose.onNodeWithText("Master device").assertDoesNotExist()
        compose.onNodeWithText("Make master device").assertDoesNotExist()
        compose.runOnIdle { assertTrue(transfers.isEmpty()) }
    }

    @Test fun busyAndStaleRoleDisableConfirmation() {
        render()
        compose.runOnIdle { state.value = state.value.copy(busy = true) }
        compose.onNodeWithText("Make master device").performScrollTo().assertIsNotEnabled()
        compose.runOnIdle { state.value = state.value.copy(busy = false) }
        compose.onNodeWithText("Make master device").performClick()
        compose.runOnIdle { state.value = state.value.copy(busy = true) }
        compose.onNodeWithText("Transfer master role").assertIsNotEnabled()
        compose.runOnIdle { state.value = state.value.copy(busy = false, security = SecurityInfo(masterDeviceId = "browser")) }
        compose.onNodeWithText("Transfer master role").assertDoesNotExist()
        compose.runOnIdle { assertTrue(transfers.isEmpty()) }
    }

    @Test fun signedOutTargetCannotBeChosenOrConfirmed() {
        render()
        compose.onNodeWithText("Make master device").performScrollTo().performClick()
        compose.runOnIdle {
            state.value = state.value.copy(devices = devices.map {
                if (it.isCurrent) it else it.copy(logoutAt = "2026-09-10T12:00:00Z")
            })
        }
        compose.onNodeWithText("Transfer master role").assertDoesNotExist()
        compose.onNodeWithText("Make master device").assertDoesNotExist()
        compose.runOnIdle { assertTrue(transfers.isEmpty()) }
    }
}
