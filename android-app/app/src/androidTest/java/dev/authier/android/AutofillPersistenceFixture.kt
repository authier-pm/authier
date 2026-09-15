package dev.authier.android

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import androidx.test.platform.app.InstrumentationRegistry
import dev.authier.android.crypto.AuthierCrypto
import kotlinx.serialization.encodeToString
import org.junit.Assert.*
import org.junit.Assume.assumeTrue
import org.junit.Test
import javax.crypto.spec.SecretKeySpec

/** Opt-in verification after the host drives one native and one web Save and fill round trip. */
class AutofillPersistenceFixture {
    @Test fun verifyGeneratedLogins() {
        assumeTrue(InstrumentationRegistry.getArguments().getString("autofillFixture") == "verify")
        val context: Context = ApplicationProvider.getApplicationContext()
        val snapshot = VaultStore(context).read()
        assertEquals("synthetic@example.test", snapshot.email)
        assertEquals(2, snapshot.secrets.size)
        assertEquals(2, snapshot.outbox.size)
        val key = SecretKeySpec(ByteArray(32) { (it + 1).toByte() }, "AES")
        val serialized = vaultJson.encodeToString(snapshot)
        val contents = snapshot.secrets.map { record ->
            val content = SecretContentDecoder.decode(AuthierCrypto.decrypt(key, record.encrypted), record.kind)
            assertEquals(24, content.password.length)
            assertFalse(serialized.contains(content.password))
            assertEquals(record.encrypted, snapshot.outbox.single { it.id == record.id }.encrypted)
            assertEquals("create", snapshot.outbox.single { it.id == record.id }.operation)
            content
        }
        assertEquals(1, contents.count { it.androidUri == "dev.authier.autofillfixture" && it.url.isNullOrBlank() })
        assertEquals(1, contents.count { it.url == "https://example.com" && it.androidUri.isNullOrBlank() })
    }
}
