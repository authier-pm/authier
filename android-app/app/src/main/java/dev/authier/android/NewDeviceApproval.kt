package dev.authier.android

enum class NewDeviceApprovalPolicy {
    EMAIL,
    OTHER_DEVICE,
    EMAIL_OR_OTHER_DEVICE,
    EMAIL_AND_OTHER_DEVICE,
    MASTER_DEVICE;

    val allowsEmail: Boolean get() = this == EMAIL || this == EMAIL_OR_OTHER_DEVICE || this == EMAIL_AND_OTHER_DEVICE
    val allowsOtherDevice: Boolean get() = this == OTHER_DEVICE || this == EMAIL_OR_OTHER_DEVICE || this == EMAIL_AND_OTHER_DEVICE
    val allowsDevice: Boolean get() = allowsOtherDevice || this == MASTER_DEVICE
    val requiresBoth: Boolean get() = this == EMAIL_AND_OTHER_DEVICE

    fun canApproveFromDevice(isMaster: Boolean): Boolean = allowsDevice && (this != MASTER_DEVICE || isMaster)
}

data class NewDeviceApprovalSelection(
    val email: Boolean = false,
    val otherDevice: Boolean = false,
    val requireBoth: Boolean = false,
    val masterOnly: Boolean = false,
) {
    val policy: NewDeviceApprovalPolicy?
        get() = when {
            masterOnly -> NewDeviceApprovalPolicy.MASTER_DEVICE
            email && otherDevice && requireBoth -> NewDeviceApprovalPolicy.EMAIL_AND_OTHER_DEVICE
            email && otherDevice -> NewDeviceApprovalPolicy.EMAIL_OR_OTHER_DEVICE
            email -> NewDeviceApprovalPolicy.EMAIL
            otherDevice -> NewDeviceApprovalPolicy.OTHER_DEVICE
            else -> null
        }

    companion object {
        fun from(policy: NewDeviceApprovalPolicy?) = NewDeviceApprovalSelection(
            email = policy?.allowsEmail == true,
            otherDevice = policy?.allowsOtherDevice == true,
            requireBoth = policy?.requiresBoth == true,
            masterOnly = policy == NewDeviceApprovalPolicy.MASTER_DEVICE,
        )
    }
}

data class LoginApprovalProgress(
    val policy: NewDeviceApprovalPolicy,
    val emailSentAt: String? = null,
    val emailApprovedAt: String? = null,
    val deviceApprovedAt: String? = null,
) {
    val instructions: String
        get() = when {
            policy.requiresBoth && emailApprovedAt != null && deviceApprovedAt == null ->
                "Email approved. Open Devices in another Authier app and approve this phone, then check again."
            policy.requiresBoth && deviceApprovedAt != null && emailApprovedAt == null ->
                "Another device approved. Open the approval email, confirm this sign-in, then check again."
            policy.requiresBoth ->
                "Both approvals are required. Confirm this sign-in from the email and from Devices in another Authier app."
            policy == NewDeviceApprovalPolicy.EMAIL ->
                "Open the approval email and confirm this sign-in, then check again."
            policy == NewDeviceApprovalPolicy.OTHER_DEVICE ->
                "Open Devices in another Authier app and approve this phone, then check again."
            policy == NewDeviceApprovalPolicy.MASTER_DEVICE ->
                "Open Devices on your master device and approve this phone, then check again. Only your master device receives the approval notification."
            else ->
                "Confirm this sign-in from the email or from Devices in another Authier app. Either approval is enough."
        }
}
