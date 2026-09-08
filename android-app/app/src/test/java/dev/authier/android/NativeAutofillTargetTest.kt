package dev.authier.android

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class NativeAutofillTargetTest {
    private val fields = listOf(NativeAutofillNode(hints = listOf("username")), NativeAutofillNode(passwordInput = true))

    @Test
    fun `matches only exact explicit package associations`() {
        assertTrue(NativeAutofillTarget.matchesAssociation("com.github.android", "com.github.android"))
        assertTrue(NativeAutofillTarget.matchesAssociation("androidapp://com.github.android", "com.github.android"))
        for (association in listOf(null, "https://github.com", "com.github.*", "com.github.android.evil", "androidapp://com.github.android/path", "com.github.android@evil.app")) {
            assertFalse(NativeAutofillTarget.matchesAssociation(association, "com.github.android"))
        }
    }

    @Test
    fun `finds native login fields including password-only forms`() {
        assertEquals(NativeAutofillSelection(0, 1), NativeAutofillTarget.select("com.github.android", fields))
        assertEquals(NativeAutofillSelection(null, 0), NativeAutofillTarget.select("com.github.android", listOf(fields[1])))
    }

    @Test
    fun `rejects web content anywhere in the request including unrelated nodes`() {
        assertNull(NativeAutofillTarget.select("com.github.android", fields + NativeAutofillNode(webContent = true, hasAutofillId = false)))
        assertNull(NativeAutofillTarget.select("com.android.chrome", fields.map { it.copy(webContent = true) }))
    }

    @Test
    fun `rejects signup ambiguous fields and invalid packages`() {
        assertNull(NativeAutofillTarget.select("com.github.android", fields + fields[1]))
        assertNull(NativeAutofillTarget.select("com.github.android", listOf(NativeAutofillNode(hints = listOf("newPassword"), passwordInput = true))))
        assertNull(NativeAutofillTarget.select("com.github.android", fields + NativeAutofillNode(hints = listOf("newPassword"), passwordInput = true)))
        assertNull(NativeAutofillTarget.select("com.github.android", fields + fields[0]))
        assertNull(NativeAutofillTarget.select("https://github.com", fields))
        assertNull(NativeAutofillTarget.select("com.github.android", fields.map { it.copy(hasAutofillId = false) }))
    }
}
