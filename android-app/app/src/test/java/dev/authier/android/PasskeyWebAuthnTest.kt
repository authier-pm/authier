package dev.authier.android

import dev.authier.android.crypto.AuthierCrypto
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.*
import org.junit.Assert.*
import org.junit.Test
import java.io.File
import java.math.BigInteger
import java.security.KeyFactory
import java.security.Signature
import java.security.spec.ECPoint
import java.security.spec.ECPublicKeySpec
import java.util.Base64
import javax.crypto.spec.SecretKeySpec

class PasskeyWebAuthnTest {
    private val file = File(System.getProperty("authier.repoRoot"), "shared/passkeyInteropVectors.json")
    private val vectors = vaultJson.parseToJsonElement(file.readText()).jsonObject
    private val extension = vectors.getValue("extension").jsonObject
    private val options = PasskeyWebAuthn.parseCreate(extension.getValue("options").toString())
    private val origin = extension.getValue("origin").jsonPrimitive.content
    private val client = PasskeyClient(origin)
    private val key = SecretKeySpec(Base64.getDecoder().decode(vectors.getValue("rawKey").jsonPrimitive.content), "AES")
    private val salt = vectors.getValue("salt").jsonPrimitive.content
    private val passkey = decodePasskey(extension.getValue("passkey").toString())
    private val getOptions = PasskeyWebAuthn.parseGet(extension.getValue("getOptions").toString())

    @Test fun decryptsExtensionPayloadAndSignsWithTheSameCredential() {
        assertEquals(passkey, decodePasskey(AuthierCrypto.decrypt(key, extension.getValue("encrypted").jsonPrimitive.content)))
        val result = PasskeyWebAuthn.assertion(passkey, getOptions, client, true)
        verify(passkey, result)
        verify(passkey, extension.getValue("assertion").toString())
        assertEquals(passkey.credentialId, vaultJson.parseToJsonElement(result).jsonObject.getValue("id").jsonPrimitive.content)
        assertEquals(passkey, decodePasskey(vaultJson.encodeToString(passkey)))
    }

    @Test fun androidCreationUsesSyncedFlagsCounterCoseAndNoneAttestation() {
        val (created, registration) = PasskeyWebAuthn.create(options, client, true)
        val response = vaultJson.parseToJsonElement(registration).jsonObject.getValue("response").jsonObject
        val auth = decode(response, "authenticatorData")
        assertArrayEquals(PasskeyWebAuthn.sha256(options.rp.id.toByteArray()), auth.copyOfRange(0, 32))
        assertEquals(0x5d, auth[32].toInt())
        assertArrayEquals(ByteArray(4 + 16), auth.copyOfRange(33, 53))
        assertEquals(32, auth[54].toInt())
        assertArrayEquals(passkeyBytes(created.credentialId, 32..32), auth.copyOfRange(55, 87))
        assertEquals(0xa5, auth[87].toInt() and 255) // five COSE entries
        val assertion = PasskeyWebAuthn.assertion(created, getOptions.copy(allowCredentials = emptyList()), client, true)
        verify(created, assertion)
        val assertionData = vaultJson.parseToJsonElement(assertion).jsonObject.getValue("response").jsonObject
        assertEquals(0x1d, decode(assertionData, "authenticatorData")[32].toInt())
        assertEquals("webauthn.get", vaultJson.parseToJsonElement(String(decode(assertionData, "clientDataJSON"))).jsonObject.getValue("type").jsonPrimitive.content)

        // Opt-in fixture generation uses the actual Android implementation; normal tests never write sources.
        if (System.getenv("AUTHIER_WRITE_PASSKEY_VECTOR") == "1") {
            val android = buildJsonObject {
                put("passkey", vaultJson.encodeToJsonElement(created)); put("credential", vaultJson.parseToJsonElement(registration))
                put("assertion", vaultJson.parseToJsonElement(assertion)); put("origin", origin)
                put("encrypted", AuthierCrypto.encrypt(key, vaultJson.encodeToString(created), salt))
            }
            file.writeText(Json { prettyPrint = true }.encodeToString(JsonObject(vectors + ("android" to android))) + "\n")
        }
    }

    @Test fun signsBrowserSuppliedHashAndReturnsAPlaceholderForBrowserClientData() {
        val hash = PasskeyWebAuthn.sha256("browser-owned client data including crossOrigin".toByteArray())
        val result = PasskeyWebAuthn.assertion(passkey, getOptions, PasskeyClient(origin, hash), true)
        verify(passkey, result, hash)
        val response = vaultJson.parseToJsonElement(result).jsonObject.getValue("response").jsonObject
        assertEquals("", response.getValue("clientDataJSON").jsonPrimitive.content)
        assertThrows(IllegalArgumentException::class.java) { PasskeyClient(origin, ByteArray(31)) }
    }

    @Test fun isolatesRpAndAllowedCredentialsAndRequiresFreshVerification() {
        assertFalse(getOptions.copy(rpId = "evil.example").matches(passkey))
        assertFalse(getOptions.copy(allowCredentials = listOf(PasskeyDescriptor("public-key", "AQ"))).matches(passkey))
        assertTrue(getOptions.copy(allowCredentials = emptyList()).matches(passkey))
        assertThrows(IllegalArgumentException::class.java) { PasskeyWebAuthn.assertion(passkey, getOptions.copy(rpId = "evil.example"), client, true) }
        assertThrows(IllegalArgumentException::class.java) { PasskeyWebAuthn.assertion(passkey, getOptions, client, false) }
        assertThrows(IllegalArgumentException::class.java) { PasskeyWebAuthn.create(options, client, false) }
        assertThrows(IllegalArgumentException::class.java) { PasskeyWebAuthn.requireNotExcluded(listOf(passkey), options.copy(excludeCredentials = getOptions.allowCredentials)) }
        PasskeyWebAuthn.requireNotExcluded(listOf(passkey.copy(rpId = "other.example")), options.copy(excludeCredentials = getOptions.allowCredentials))
    }

    @Test fun refusesUnsupportedExtensionsAlgorithmsAndMalformedKeys() {
        val create = extension.getValue("options").jsonObject
        val get = extension.getValue("getOptions").jsonObject
        for (name in listOf("prf", "largeBlob", "appidExclude", "hmacGetSecret")) {
            assertThrows(IllegalArgumentException::class.java) { PasskeyWebAuthn.parseGet(JsonObject(get + ("extensions" to buildJsonObject { putJsonObject(name) {} })).toString()) }
        }
        assertThrows(IllegalArgumentException::class.java) { PasskeyWebAuthn.parseCreate(JsonObject(create + ("pubKeyCredParams" to buildJsonArray { addJsonObject { put("type", "public-key"); put("alg", -257) } })).toString()) }
        assertThrows(IllegalArgumentException::class.java) { passkey.copy(privateKeyJwk = passkey.privateKeyJwk.copy(d = passkeyBase64(ByteArray(32)))).validated() }
        assertThrows(IllegalArgumentException::class.java) { passkey.copy(privateKeyJwk = passkey.privateKeyJwk.copy(x = passkeyBase64(ByteArray(32)))).validated() }
        for (rp in listOf("example.com/path", "Example.com", "127.0.0.1", "example.com:443", ".example.com", "user@example.com")) {
            assertThrows(IllegalArgumentException::class.java) { validatePasskeyRpId(rp) }
        }
        assertThrows(IllegalArgumentException::class.java) { passkeyBytes("AA==", 1..64) }
        assertThrows(IllegalArgumentException::class.java) { passkeyBytes("AB", 1..64) }
        assertThrows(IllegalArgumentException::class.java) { PasskeyWebAuthn.parseGet(JsonObject(get + ("challenge" to JsonPrimitive(""))).toString()) }
    }

    @Test fun legacyAppIdAndOptionalRegistrationPrfMatchTheExtension() {
        val legacy = getOptions.copy(extensions = buildJsonObject { put("appid", "https://example.com/u2f") })
        val response = vaultJson.parseToJsonElement(PasskeyWebAuthn.assertion(passkey, legacy, client, true)).jsonObject
        assertEquals(JsonPrimitive(false), response.getValue("clientExtensionResults").jsonObject["appid"])
        val requested = options.copy(extensions = buildJsonObject { putJsonObject("prf") {}; put("credProps", true) })
        val parsed = PasskeyWebAuthn.parseCreate(vaultJson.encodeToString(requested))
        val created = vaultJson.parseToJsonElement(PasskeyWebAuthn.create(parsed, client, true).second).jsonObject
        assertEquals(JsonPrimitive(false), created.getValue("clientExtensionResults").jsonObject.getValue("prf").jsonObject["enabled"])
    }

    @Test fun renamePreservesPrivateKeyUnknownFieldsAndEncryptedOutbox() {
        val original = JsonObject(extension.getValue("passkey").jsonObject + ("futureField" to JsonPrimitive("preserve me")))
        val record = SecretRecord("id", AuthierCrypto.encrypt(key, original.toString(), salt), "PASSKEY", 4, passkey.createdAt)
        val snapshot = VaultSnapshot(encryptionSalt = salt, secrets = listOf(record))
        val renamed = renamePasskey(snapshot, record.id, "Work account", key)
        val plaintext = AuthierCrypto.decrypt(key, renamed.secrets.single().encrypted)
        val updated = vaultJson.parseToJsonElement(plaintext).jsonObject
        assertEquals(JsonObject(original - "label"), JsonObject(updated - "label"))
        assertEquals("Work account", decodePasskey(plaintext).label)
        assertEquals(record.version, renamed.outbox.single().expectedVersion)
        assertEquals(renamed.secrets.single().encrypted, renamed.outbox.single().encrypted)
        val visible = decodeVaultItem(record, original.toString(), null)
        assertEquals("", visible.content.password)
        assertEquals("", visible.content.secret)
        assertThrows(IllegalArgumentException::class.java) { renamePasskey(renamed, record.id, "Again", key) }
        assertTrue(readPasskeys(snapshot.copy(secrets = listOf(record.copy(deletedAt = passkey.createdAt))), key).isEmpty())
        val queued = queuePasskey(snapshot.copy(secrets = emptyList()), passkey, key)
        assertEquals(passkey, readPasskeys(queued.first, key).single().passkey)
        assertEquals("PASSKEY", queued.first.outbox.single().kind)
    }

    private fun decode(response: JsonObject, name: String) = Base64.getUrlDecoder().decode(response.getValue(name).jsonPrimitive.content)
    private fun verify(passkey: PasskeyData, json: String, hash: ByteArray? = null) {
        val response = vaultJson.parseToJsonElement(json).jsonObject.getValue("response").jsonObject
        val point = ECPoint(BigInteger(1, passkeyBytes(passkey.privateKeyJwk.x, 32..32)), BigInteger(1, passkeyBytes(passkey.privateKeyJwk.y, 32..32)))
        val publicKey = KeyFactory.getInstance("EC").generatePublic(ECPublicKeySpec(point, PasskeyWebAuthn.curve))
        assertTrue(Signature.getInstance("SHA256withECDSA").run {
            initVerify(publicKey); update(decode(response, "authenticatorData") + (hash ?: PasskeyWebAuthn.sha256(decode(response, "clientDataJSON"))))
            verify(decode(response, "signature"))
        })
    }
}
