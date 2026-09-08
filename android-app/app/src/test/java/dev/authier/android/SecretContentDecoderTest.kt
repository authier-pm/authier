package dev.authier.android

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Test

class SecretContentDecoderTest {
    @Test
    fun `normalizes legacy login fields and falls back to the website`() {
        val content = SecretContentDecoder.decode("""{"url":"https://example.com","label":null,"username":null,"password":"🔐","iconUrl":"","androidUri":null}""", "LOGIN_CREDENTIALS")
        assertEquals("https://example.com", content.label)
        assertEquals("", content.username)
        assertEquals("🔐", content.password)
        assertNull(content.iconUrl)
        assertNull(content.androidUri)
        assertEquals("alice", SecretContentDecoder.decode("""{"username":"alice"}""", "LOGIN_CREDENTIALS").label)
        assertEquals("Untitled login", SecretContentDecoder.decode("{}", "LOGIN_CREDENTIALS").label)
    }

    @Test
    fun `accepts imported TOTP names numeric strings and nullable metadata`() {
        val content = SecretContentDecoder.decode("""{"originalName":"Imported code","secret":"JBSWY3DPEHPK3PXP","digits":"8","period":"60","url":null,"iosUri":null,"ignored":true}""", "TOTP")
        assertEquals("Imported code", content.label)
        assertEquals(8, content.digits)
        assertEquals(60, content.period)
        assertEquals("SHA1", content.algorithm)
        assertNull(content.url)
        assertEquals("Untitled TOTP", SecretContentDecoder.decode("{}", "TOTP").label)
    }

    @Test
    fun `preserves package associations and explicit names`() {
        val content = SecretContentDecoder.decode("""{"label":"GitHub","androidUri":"com.github.android","username":"alice","url":"https://github.com"}""", "LOGIN_CREDENTIALS")
        assertEquals("GitHub", content.label)
        assertEquals("com.github.android", content.androidUri)
    }

    @Test
    fun `does not silently round invalid TOTP parameters or accept nonobjects`() {
        assertThrows(IllegalArgumentException::class.java) { SecretContentDecoder.decode("[]", "TOTP") }
        assertThrows(IllegalArgumentException::class.java) { SecretContentDecoder.decode("""{"digits":6.5}""", "TOTP") }
        assertEquals(6, SecretContentDecoder.decode("""{"digits":"unknown"}""", "TOTP").digits)
    }

    @Test
    fun `never coerces passkeys or future secret kinds into editable password content`() {
        val passkey = """{"label":"Website passkey","rpId":"example.test","userName":"alice","privateKeyJwk":{"d":"private-key-material"}}"""
        assertThrows(IllegalArgumentException::class.java) { SecretContentDecoder.decode(passkey, "PASSKEY") }
        assertThrows(IllegalArgumentException::class.java) { requireNativeEditableKind("PASSKEY") }
        assertThrows(IllegalArgumentException::class.java) { requireNativeEditableKind("FUTURE_KIND") }
    }
}
