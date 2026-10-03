package dev.authier.android

import org.junit.Assert.*
import org.junit.Test
import java.util.Arrays

class NativeAutofillTargetTest {
    private val fields = listOf(NativeAutofillNode(hints = listOf("username")), NativeAutofillNode(passwordInput = true))
    private val newPassword = NativeAutofillNode(hints = listOf("newPassword"), passwordInput = true)
    private val currentPassword = NativeAutofillNode(hints = listOf("current-password"), passwordInput = true)
    private fun select(nodes: List<NativeAutofillNode>) = NativeAutofillTarget.select("com.example.app", nodes)

    @Test fun `matches only exact explicit package associations`() {
        assertTrue(NativeAutofillTarget.matchesAssociation("com.github.android", "com.github.android"))
        assertTrue(NativeAutofillTarget.matchesAssociation("androidapp://com.github.android", "com.github.android"))
        for (association in listOf(null, "https://github.com", "com.github.*", "com.github.android.evil", "androidapp://com.github.android/path", "com.github.android@evil.app")) {
            assertFalse(NativeAutofillTarget.matchesAssociation(association, "com.github.android"))
        }
    }

    @Test fun `generic single password supports saved login and generation`() {
        assertEquals(NativeAutofillSelection(0, 1, listOf(1)), select(fields))
        assertEquals(NativeAutofillSelection(null, 0, listOf(0)), select(listOf(fields[1])))
        assertEquals(NativeAutofillSelection(null, 0), select(listOf(currentPassword)))
    }

    @Test fun `null framework hints do not hide recognized login and new password hints`() {
        val username = NativeAutofillNode(hints = Arrays.asList<String>(null, "USERNAME", null))
        val current = NativeAutofillNode(hints = Arrays.asList<String>(null, "CURRENT-PASSWORD"))
        val new = NativeAutofillNode(hints = Arrays.asList<String>("NEWPASSWORD", null))
        assertEquals(NativeAutofillSelection(0, 1), select(listOf(username, current)))
        assertEquals(NativeAutofillSelection(0, 1, listOf(2, 3)), select(listOf(username, current, new, new)))
    }

    @Test fun `null hints preserve selection by input type`() {
        val username = NativeAutofillNode(hints = listOf(null), emailInput = true)
        val password = NativeAutofillNode(hints = listOf(null), passwordInput = true)
        assertEquals(NativeAutofillSelection(0, 1, listOf(1)), select(listOf(username, password)))
    }

    @Test fun `null and unrecognized hints alone cannot identify a password field`() {
        assertNull(select(listOf(NativeAutofillNode(hints = listOf(null)))))
        assertNull(select(listOf(NativeAutofillNode(hints = listOf(null, "", "unsupported")))))
    }

    @Test fun `registration fills only explicitly identified new and confirmation fields`() {
        assertEquals(NativeAutofillSelection(0, null, listOf(1, 2)), select(listOf(fields[0], newPassword, newPassword)))
        assertEquals(NativeAutofillSelection(null, null, listOf(0)), select(listOf(newPassword)))
        assertEquals(NativeAutofillSelection(null, 0, listOf(1, 2)), select(listOf(currentPassword, newPassword, newPassword)))
    }

    @Test fun `focused current and new fields get the appropriate action`() {
        assertEquals(NativeAutofillSelection(null, 0), select(listOf(currentPassword.copy(focused = true), newPassword, newPassword)))
        assertEquals(NativeAutofillSelection(null, null, listOf(1, 2)), select(listOf(currentPassword, newPassword.copy(focused = true), newPassword)))
    }

    @Test fun `web fields require a single known HTTPS origin and never fill native chrome`() {
        val web = fields.map { it.copy(webContent = true, webOrigin = "https://github.com") }
        assertEquals(NativeAutofillSelection(0, 1, listOf(1), "https://github.com"), select(web + fields))
        assertNull(select(web + newPassword.copy(webContent = true, webOrigin = "https://evil.example", visible = false)))
        assertEquals(NativeAutofillSelection(0, 1, listOf(1), "https://github.com"),
            select(web + NativeAutofillNode(webContent = true, editable = false)))
        assertNull(select(web + NativeAutofillNode(webContent = true)))
        assertNull(select(fields.map { it.copy(webContent = true) }))
        assertNull(select(fields.map { it.copy(webContent = true, webOrigin = "http://github.com") }))
    }

    @Test fun `rejects ambiguous invisible and invalid targets`() {
        assertNull(select(fields + fields[1]))
        assertNull(select(fields + fields[0]))
        assertNull(select(List(3) { newPassword }))
        assertNull(select(listOf(newPassword.copy(hints = listOf("new-password", "current-password")))))
        assertNull(select(listOf(newPassword.copy(hints = listOf(null, "new-password", "current-password")))))
        assertNull(NativeAutofillTarget.select("https://github.com", fields))
        assertNull(select(fields.map { it.copy(hasAutofillId = false) }))
        assertNull(select(fields.map { it.copy(visible = false) }))
        assertEquals(NativeAutofillSelection(0, 1, listOf(1)), select(fields + newPassword.copy(visible = false)))
    }

    @Test fun `web matching separates schemes ports subdomains and misleading hosts`() {
        val destination = AutofillDestination("com.android.chrome", "https://github.com")
        assertTrue(destination.matches(SecretContent(url = "https://GitHub.COM:443/login?next=1")))
        for (url in listOf("http://github.com", "https://github.com.evil.example", "https://evil.example/github.com", "https://github.com@evil.example", "https://user:pass@github.com", "https://github.com:8443", "https://login.github.com", null)) {
            assertFalse(destination.matches(SecretContent(url = url, androidUri = "com.android.chrome")))
        }
    }
}
