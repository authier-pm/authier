package dev.authier.android

import kotlinx.serialization.Serializable

val lockTimeoutOptions = listOf(
    0 to "When app enters background",
    60 to "1 minute", 300 to "5 minutes", 900 to "15 minutes",
    1800 to "30 minutes", 3600 to "1 hour", 14400 to "4 hours",
    28800 to "8 hours", 43200 to "12 hours", 86400 to "1 day",
)

@Serializable
data class UnlockLease(val wallTime: Long, val elapsedTime: Long, val bootCount: Int) {
    fun isValid(now: UnlockLease, timeoutSeconds: Int): Boolean {
        if (timeoutSeconds !in 1..86400) return false
        val wallAge = now.wallTime - wallTime
        if (wallAge < 0 || wallAge >= timeoutSeconds * 1000L) return false
        if (now.bootCount != bootCount) return true
        val elapsedAge = now.elapsedTime - elapsedTime
        return elapsedAge >= 0 && elapsedAge < timeoutSeconds * 1000L
    }
}
