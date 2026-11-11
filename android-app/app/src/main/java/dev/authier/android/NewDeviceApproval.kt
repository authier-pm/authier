package dev.authier.android

enum class NewDeviceApprovalPolicy {
    EMAIL,
    OTHER_DEVICE,
    EMAIL_OR_OTHER_DEVICE,
    EMAIL_AND_OTHER_DEVICE;

    val allowsEmail: Boolean get() = this != OTHER_DEVICE
    val allowsOtherDevice: Boolean get() = this != EMAIL
    val requiresBoth: Boolean get() = this == EMAIL_AND_OTHER_DEVICE
}

data class NewDeviceApprovalSelection(
    val email: Boolean = false,
    val otherDevice: Boolean = false,
    val requireBoth: Boolean = false,
) {
    val policy: NewDeviceApprovalPolicy?
        get() = when {
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
            else ->
                "Confirm this sign-in from the email or from Devices in another Authier app. Either approval is enough."
        }
}
