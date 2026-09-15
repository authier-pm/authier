package dev.authier.android

import okhttp3.HttpUrl.Companion.toHttpUrlOrNull

/** Plain metadata keeps field selection and origin boundaries testable on the JVM. */
data class NativeAutofillNode(
    val hints: List<String> = emptyList(),
    val passwordInput: Boolean = false,
    val emailInput: Boolean = false,
    val webContent: Boolean = false,
    val hasAutofillId: Boolean = true,
    val editable: Boolean = true,
    val webOrigin: String? = null,
    val focused: Boolean = false,
    val visible: Boolean = true,
)

data class NativeAutofillSelection(
    val usernameIndex: Int?,
    val passwordIndex: Int?,
    val generatedPasswordIndices: List<Int> = emptyList(),
    val webOrigin: String? = null,
)

/** A web login is associated with its origin, never the browser's Android package. */
data class AutofillDestination(val packageName: String, val webOrigin: String? = null) {
    val label: String get() = webOrigin ?: packageName
    fun matches(content: SecretContent): Boolean = if (webOrigin != null) {
        httpsOrigin(content.url) == webOrigin
    } else NativeAutofillTarget.matchesAssociation(content.androidUri, packageName)
}

fun httpsOrigin(value: String?): String? {
    val url = value?.toHttpUrlOrNull() ?: return null
    if (url.scheme != "https" || url.username.isNotEmpty() || url.password.isNotEmpty()) return null
    return url.newBuilder().encodedPath("/").query(null).fragment(null).build().toString().removeSuffix("/")
}

object NativeAutofillTarget {
    private val packagePattern = Regex("[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z][A-Za-z0-9_]*)+")
    private val newHints = setOf("newpassword", "new-password")
    private val usernameHints = setOf("username", "newusername", "new-username", "emailaddress", "email")

    fun packageFromAssociation(value: String?): String? = value?.trim()
        ?.removePrefix("androidapp://")?.takeIf(packagePattern::matches)

    fun matchesAssociation(value: String?, requestedPackage: String): Boolean =
        packageFromAssociation(value) == requestedPackage && packagePattern.matches(requestedPackage)

    fun select(packageName: String, nodes: List<NativeAutofillNode>): NativeAutofillSelection? {
        if (!packagePattern.matches(packageName)) return null
        val webNodes = nodes.filter { it.webContent }
        val origins = webNodes.mapNotNull { it.webOrigin }.distinct()
        // Reject unknown field origins and mixed-origin frames, including hidden frames.
        if (webNodes.isNotEmpty() && (origins.size != 1 || webNodes.any { it.editable && it.webOrigin == null })) return null
        val origin = origins.singleOrNull()
        if (origin != null && httpsOrigin(origin) != origin) return null
        val eligible = nodes.indices.filter { index ->
            val node = nodes[index]
            node.hasAutofillId && node.editable && node.visible && node.webOrigin == origin &&
                (origin == null || node.webContent)
        }
        fun hints(index: Int) = nodes[index].hints.map(String::lowercase).toSet()
        val passwords = eligible.filter { nodes[it].passwordInput || hints(it).any { hint -> hint in newHints || hint in setOf("password", "current-password") } }
        if (passwords.any { "current-password" in hints(it) && hints(it).any(newHints::contains) }) return null
        val newPasswords = passwords.filter { hints(it).any(newHints::contains) }
        val currentPasswords = passwords - newPasswords.toSet()
        if (passwords.isEmpty() || currentPasswords.size > 1 || newPasswords.size > 2) return null
        // Never guess which of several unlabeled password fields is the current password.
        val generation = when {
            newPasswords.isNotEmpty() -> newPasswords
            currentPasswords.size == 1 && "current-password" !in hints(currentPasswords.single()) -> currentPasswords
            else -> emptyList()
        }
        val usernames = eligible.filter { it !in passwords && (nodes[it].emailInput || hints(it).any(usernameHints::contains)) }
        if (usernames.size > 1) return null
        val focusedPassword = passwords.firstOrNull { nodes[it].focused }
        val login = currentPasswords.singleOrNull()?.takeUnless { focusedPassword in newPasswords }
        val generated = generation.takeUnless { focusedPassword != null && focusedPassword !in generation }.orEmpty()
        if (login == null && generated.isEmpty()) return null
        return NativeAutofillSelection(usernames.singleOrNull(), login, generated, origin)
    }
}
