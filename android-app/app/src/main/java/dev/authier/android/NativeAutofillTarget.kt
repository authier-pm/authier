package dev.authier.android

/** Plain metadata keeps the security decisions independently testable on the JVM. */
data class NativeAutofillNode(
    val hints: List<String> = emptyList(),
    val passwordInput: Boolean = false,
    val emailInput: Boolean = false,
    val webContent: Boolean = false,
    val hasAutofillId: Boolean = true,
    val editable: Boolean = true,
)

data class NativeAutofillSelection(val usernameIndex: Int?, val passwordIndex: Int)

object NativeAutofillTarget {
    private val packagePattern = Regex("[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z][A-Za-z0-9_]*)+")

    fun packageFromAssociation(value: String?): String? = value?.trim()
        ?.removePrefix("androidapp://")?.takeIf(packagePattern::matches)

    fun matchesAssociation(value: String?, requestedPackage: String): Boolean =
        packageFromAssociation(value) == requestedPackage && packagePattern.matches(requestedPackage)

    fun select(packageName: String, nodes: List<NativeAutofillNode>): NativeAutofillSelection? {
        if (!packagePattern.matches(packageName) || nodes.any { it.webContent }) return null
        if (nodes.any { node -> node.hints.any { it.lowercase() in setOf("newpassword", "new-password") } }) return null
        val passwords = nodes.indices.filter { index ->
            val node = nodes[index]
            val hints = node.hints.map(String::lowercase)
            node.hasAutofillId && node.editable &&
                "newpassword" !in hints && "new-password" !in hints &&
                (node.passwordInput || hints.any { it == "password" || it == "current-password" })
        }
        // Multiple password fields often indicate signup/change-password or an ambiguous form.
        if (passwords.size != 1) return null
        val usernames = nodes.indices.filter { index ->
            val node = nodes[index]
            index != passwords.single() && node.hasAutofillId && node.editable &&
                (node.emailInput || node.hints.any { it.lowercase() in setOf("username", "emailaddress", "email") })
        }
        if (usernames.size > 1) return null
        return NativeAutofillSelection(usernames.singleOrNull(), passwords.single())
    }
}
