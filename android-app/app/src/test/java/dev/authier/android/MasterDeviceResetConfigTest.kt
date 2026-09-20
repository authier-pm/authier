package dev.authier.android

import org.junit.Assert.*
import org.junit.Test

class MasterDeviceResetConfigTest {
    @Test fun defaultsMatchExtensionAndWebVault() {
        assertEquals(MasterDeviceResetConfig(1, 2880, emptyList()), RecoverySetupDraft().toConfig())
    }
    @Test fun supportsBothBoundariesAndMultipleEmails() {
        assertEquals(MasterDeviceResetConfig(0, 5, listOf("backup@example.com", "family@example.com")),
            RecoverySetupDraft("0", "5", 1, listOf(" backup@example.com ", "family@example.com", "")).toConfig())
        assertEquals(129600, RecoverySetupDraft("10", "90", 1440).toConfig().waitMinutes)
    }
    @Test fun rejectsInvalidSettingsBeforeRegistration() {
        for (draft in listOf(RecoverySetupDraft(approvals = "11"), RecoverySetupDraft(approvals = "-1"),
            RecoverySetupDraft(approvals = "1.5"), RecoverySetupDraft(wait = "4", unitMinutes = 1),
            RecoverySetupDraft(wait = "129601", unitMinutes = 1), RecoverySetupDraft(wait = "NaN"),
            RecoverySetupDraft(wait = "5.5", unitMinutes = 1), RecoverySetupDraft(emails = listOf("invalid")))) {
            assertTrue("Accepted $draft", runCatching { draft.toConfig() }.isFailure)
        }
    }
}
