package dev.authier.android

import org.junit.Assert.*
import org.junit.Test

class WebAutofillTrustTest {
    private val document = """[{"relation":["delegate_permission/common.get_login_creds"],"target":{"namespace":"android_app","package_name":"com.example.app","sha256_cert_fingerprints":["AA:BB"]}}]"""

    @Test fun `website must authorize the exact package and every installed signer for credentials`() {
        assertTrue(authorizesWebCredentials(document, "com.example.app", setOf("aa:bb")))
        assertFalse(authorizesWebCredentials(document, "com.example.app.evil", setOf("AA:BB")))
        assertFalse(authorizesWebCredentials(document, "com.example.app", setOf("CC:DD")))
        assertFalse(authorizesWebCredentials(document, "com.example.app", setOf("AA:BB", "CC:DD")))
        assertFalse(authorizesWebCredentials(document, "com.example.app", emptySet()))
        assertFalse(authorizesWebCredentials(document.replace("get_login_creds", "handle_all_urls"), "com.example.app", setOf("AA:BB")))
        assertFalse(authorizesWebCredentials(document.replace("android_app", "web"), "com.example.app", setOf("AA:BB")))
        assertFalse(authorizesWebCredentials("[]", "com.example.app", setOf("AA:BB")))
    }
}
