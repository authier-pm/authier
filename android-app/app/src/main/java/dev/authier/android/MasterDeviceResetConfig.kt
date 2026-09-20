package dev.authier.android

/** Same bounds and defaults as shared/masterDeviceResetConfig.ts; the server validates again. */
data class MasterDeviceResetConfig(
    val requiredApprovals: Int = 1,
    val waitMinutes: Int = 48 * 60,
    val notificationEmails: List<String> = emptyList(),
) {
    fun validated(): MasterDeviceResetConfig {
        require(requiredApprovals in 0..10) { "Choose 0 to 10 device approvals." }
        require(waitMinutes in 5..129600) { "Choose a wait from 5 minutes to 90 days." }
        require(notificationEmails.size <= 20) { "Use at most 20 notification addresses." }
        val emails = notificationEmails.map(String::trim)
        require(emails.all { it.length <= 254 && isRecoveryEmail(it) }) { "Enter valid notification email addresses." }
        return copy(notificationEmails = emails)
    }
}

fun isRecoveryEmail(value: String): Boolean = Regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$").matches(value)

data class RecoverySetupDraft(
    val approvals: String = "1",
    val wait: String = "48",
    val unitMinutes: Int = 60,
    val emails: List<String> = emptyList(),
) {
    fun toConfig(): MasterDeviceResetConfig {
        val count = requireNotNull(approvals.toIntOrNull()) { "Enter a whole number of approvals." }
        val minutes = wait.toBigDecimalOrNull()?.multiply(unitMinutes.toBigDecimal())
        require(minutes != null && minutes >= 5.toBigDecimal() && minutes <= 129600.toBigDecimal() && minutes.stripTrailingZeros().scale() <= 0) {
            "Choose a wait from 5 minutes to 90 days, in whole minutes."
        }
        return MasterDeviceResetConfig(count, minutes.toInt(), emails.filter(String::isNotBlank)).validated()
    }
}
