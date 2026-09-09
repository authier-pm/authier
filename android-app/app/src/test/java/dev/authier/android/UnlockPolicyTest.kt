package dev.authier.android

import org.junit.Assert.*
import org.junit.Test

class UnlockPolicyTest {
    private val unlocked = UnlockLease(1_000_000, 100_000, 4)

    @Test fun fifteenMinutesSurvivesBackgroundAndRestartButExpiresAtDeadline() {
        assertTrue(unlocked.isValid(UnlockLease(1_899_999, 999_999, 4), 900))
        assertFalse(unlocked.isValid(UnlockLease(1_900_000, 1_000_000, 4), 900))
    }

    @Test fun oneDayIsSupportedAndBounded() {
        assertTrue(unlocked.isValid(UnlockLease(87_399_999, 86_499_999, 4), 86400))
        assertFalse(unlocked.isValid(UnlockLease(87_400_000, 86_500_000, 4), 86400))
        assertFalse(unlocked.isValid(unlocked, 86401))
        assertFalse(unlocked.isValid(unlocked, 0))
        assertFalse(unlocked.isValid(unlocked, -1))
    }

    @Test fun rebootPreservesOriginalWallClockDeadline() {
        assertTrue(unlocked.isValid(UnlockLease(1_100_000, 500, 5), 900))
        assertFalse(unlocked.isValid(UnlockLease(1_900_000, 500, 5), 900))
    }

    @Test fun clockRollbackCannotExtendTheSession() {
        assertFalse(unlocked.isValid(UnlockLease(999_999, 100_001, 4), 900))
        assertFalse(unlocked.isValid(UnlockLease(1_100_000, 1_000_000, 4), 900))
        assertFalse(unlocked.isValid(UnlockLease(1_100_000, 99_999, 4), 900))
    }
}
