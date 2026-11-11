package dev.authier.android

import org.junit.Assert.*
import org.junit.Test
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

class NewDeviceApprovalTest {
    @Test fun `requires a choice and supports all four protection combinations`() {
        assertNull(NewDeviceApprovalSelection().policy)
        assertEquals(NewDeviceApprovalPolicy.OTHER_DEVICE, NewDeviceApprovalSelection(otherDevice = true).policy)
        assertEquals(NewDeviceApprovalPolicy.EMAIL, NewDeviceApprovalSelection(email = true).policy)
        assertEquals(NewDeviceApprovalPolicy.EMAIL_OR_OTHER_DEVICE, NewDeviceApprovalSelection(email = true, otherDevice = true).policy)
        assertEquals(NewDeviceApprovalPolicy.EMAIL_AND_OTHER_DEVICE, NewDeviceApprovalSelection(email = true, otherDevice = true, requireBoth = true).policy)
        NewDeviceApprovalPolicy.entries.forEach { policy ->
            assertEquals(policy, NewDeviceApprovalSelection.from(policy).policy)
        }
    }

    @Test fun `both-required login still asks for the outstanding approval`() {
        val emailComplete = LoginApprovalProgress(NewDeviceApprovalPolicy.EMAIL_AND_OTHER_DEVICE, emailApprovedAt = "2026-11-11T10:01:00Z")
        assertTrue(emailComplete.instructions.startsWith("Email approved."))
        assertTrue(emailComplete.instructions.contains("another Authier app"))
        val deviceComplete = LoginApprovalProgress(NewDeviceApprovalPolicy.EMAIL_AND_OTHER_DEVICE, deviceApprovedAt = "2026-11-11T10:01:00Z")
        assertTrue(deviceComplete.instructions.startsWith("Another device approved."))
        assertTrue(deviceComplete.instructions.contains("approval email"))
    }

    @Test fun `email approval and either approval never claim another device is mandatory`() {
        val emailOnly = LoginApprovalProgress(NewDeviceApprovalPolicy.EMAIL)
        assertFalse(emailOnly.instructions.contains("another Authier"))
        val either = LoginApprovalProgress(NewDeviceApprovalPolicy.EMAIL_OR_OTHER_DEVICE)
        assertTrue(either.instructions.contains("Either approval is enough"))
    }

    @Test fun `required policy setup survives a stored vault restart`() {
        val snapshot = VaultSnapshot(email = "test@example.com", requiresApprovalSetup = true)
        assertTrue(Json.decodeFromString<VaultSnapshot>(Json.encodeToString(snapshot)).requiresApprovalSetup)
        assertFalse(Json.decodeFromString<VaultSnapshot>("{}").requiresApprovalSetup)
    }
}
