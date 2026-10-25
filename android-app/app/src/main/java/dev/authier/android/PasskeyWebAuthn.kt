package dev.authier.android

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*
import java.math.BigInteger
import java.security.AlgorithmParameters
import java.security.KeyFactory
import java.security.KeyPairGenerator
import java.security.MessageDigest
import java.security.SecureRandom
import java.security.Signature
import java.security.interfaces.ECPrivateKey
import java.security.interfaces.ECPublicKey
import java.security.spec.ECGenParameterSpec
import java.security.spec.ECParameterSpec
import java.security.spec.ECPrivateKeySpec
import java.time.Instant

@Serializable
data class PasskeyDescriptor(val type: String, val id: String)
@Serializable
data class PasskeyRp(val id: String, val name: String)
@Serializable
data class PasskeyUser(val id: String, val name: String, val displayName: String)
@Serializable
data class PasskeyAlgorithm(val type: String, val alg: Int)
@Serializable
data class PasskeySelection(val authenticatorAttachment: String? = null, val userVerification: String? = null)
@Serializable
data class PasskeyCreateOptions(
    val challenge: String, val rp: PasskeyRp, val user: PasskeyUser,
    val pubKeyCredParams: List<PasskeyAlgorithm>,
    val excludeCredentials: List<PasskeyDescriptor> = emptyList(),
    val authenticatorSelection: PasskeySelection? = null,
    val attestation: String = "none", val extensions: JsonObject = JsonObject(emptyMap()),
)
@Serializable
data class PasskeyGetOptions(
    val challenge: String, val rpId: String, val allowCredentials: List<PasskeyDescriptor> = emptyList(),
    val userVerification: String? = null, val extensions: JsonObject = JsonObject(emptyMap()),
) {
    fun matches(passkey: PasskeyData): Boolean = passkey.rpId == rpId &&
        (allowCredentials.isEmpty() || allowCredentials.any { it.type == "public-key" && it.id == passkey.credentialId })
}

/** Origin has already been authenticated using CallingAppInfo and DAL by PasskeyCallerTrust. */
data class PasskeyClient(val origin: String, val clientDataHash: ByteArray? = null) {
    init { require(clientDataHash == null || clientDataHash.size == 32) { "Invalid client data hash." } }
}

object PasskeyWebAuthn {
    internal val curve: ECParameterSpec = AlgorithmParameters.getInstance("EC").apply {
        init(ECGenParameterSpec("secp256r1"))
    }.getParameterSpec(ECParameterSpec::class.java)

    fun parseCreate(json: String): PasskeyCreateOptions = vaultJson.decodeFromString<PasskeyCreateOptions>(bounded(json)).also {
        validatePasskeyRpId(it.rp.id)
        passkeyBytes(it.challenge, 1..65536)
        passkeyBytes(it.user.id, 1..64)
        require(it.rp.name.length <= 256 && it.user.name.length <= 256 && it.user.displayName.length <= 256) { "Passkey account names are too long." }
        require(it.pubKeyCredParams.size <= 64 && it.pubKeyCredParams.any { alg -> alg.type == "public-key" && alg.alg == -7 }) { "This website requires an unsupported passkey algorithm." }
        require(it.authenticatorSelection?.authenticatorAttachment != "cross-platform" && it.attestation != "enterprise") { "This request needs another passkey provider." }
        require(it.attestation in listOf("none", "direct", "indirect") &&
            it.authenticatorSelection?.authenticatorAttachment in listOf(null, "platform")) { "Invalid passkey options." }
        validateVerification(it.authenticatorSelection?.userVerification)
        descriptors(it.excludeCredentials)
        extensions(it.extensions, creating = true)
    }

    fun parseGet(json: String): PasskeyGetOptions = vaultJson.decodeFromString<PasskeyGetOptions>(bounded(json)).also {
        validatePasskeyRpId(it.rpId)
        passkeyBytes(it.challenge, 1..65536)
        validateVerification(it.userVerification)
        descriptors(it.allowCredentials)
        extensions(it.extensions, creating = false)
    }

    private fun bounded(json: String): String = json.also { require(it.length <= 256 * 1024) { "Passkey request is too large." } }
    private fun validateVerification(value: String?) { require(value == null || value in listOf("required", "preferred", "discouraged")) }
    private fun descriptors(values: List<PasskeyDescriptor>) {
        require(values.size <= 128)
        values.forEach { require(it.type == "public-key"); passkeyBytes(it.id, 1..1023) }
    }
    private fun extensions(values: JsonObject, creating: Boolean) {
        val unsupported = listOf("largeBlob", "appidExclude", "hmacCreateSecret", "hmacGetSecret") + if (creating) emptyList() else listOf("prf")
        require(unsupported.none { values[it] != null && values[it] != JsonPrimitive(false) } &&
            values["enforceCredentialProtectionPolicy"] != JsonPrimitive(true) &&
            (!creating || (values["prf"] as? JsonObject)?.containsKey("evalByCredential") != true)) { "This request needs another passkey provider." }
    }

    fun requireNotExcluded(passkeys: List<PasskeyData>, options: PasskeyCreateOptions) {
        require(passkeys.none { key -> key.rpId == options.rp.id && options.excludeCredentials.any { it.id == key.credentialId } }) {
            "A passkey for this account is already saved in Authier."
        }
    }

    fun create(options: PasskeyCreateOptions, client: PasskeyClient, userVerified: Boolean): Pair<PasskeyData, String> {
        require(userVerified) { "Verify your identity before creating a passkey." }
        val pair = KeyPairGenerator.getInstance("EC").apply { initialize(ECGenParameterSpec("secp256r1")) }.generateKeyPair()
        val public = pair.public as ECPublicKey
        val private = pair.private as ECPrivateKey
        val id = ByteArray(32).also(SecureRandom()::nextBytes)
        val passkey = PasskeyData(passkeyBase64(id), options.rp.id, options.rp.name, options.user.id,
            options.user.name, options.user.displayName,
            PasskeyPrivateJwk(x = coordinate(public.w.affineX), y = coordinate(public.w.affineY), d = coordinate(private.s)),
            Instant.now().toString(), "https://${options.rp.id}", "${options.user.name} | ${options.rp.name}").validated()
        val cose = cborMap(listOf(cborInt(1) to cborInt(2), cborInt(3) to cborInt(-7), cborInt(-1) to cborInt(1),
            cborInt(-2) to cborBytes(passkeyBytes(passkey.privateKeyJwk.x, 32..32)), cborInt(-3) to cborBytes(passkeyBytes(passkey.privateKeyJwk.y, 32..32))))
        val authData = authenticatorData(options.rp.id, true) + ByteArray(16) + byteArrayOf(0, id.size.toByte()) + id + cose
        val attestation = cborMap(listOf(cborText("fmt") to cborText("none"), cborText("attStmt") to cborMap(emptyList()), cborText("authData") to cborBytes(authData)))
        val response = buildJsonObject {
            put("clientDataJSON", clientData("webauthn.create", options.challenge, client)?.let(::passkeyBase64).orEmpty())
            put("authenticatorData", passkeyBase64(authData))
            put("attestationObject", passkeyBase64(attestation))
            put("publicKey", passkeyBase64(pair.public.encoded))
            put("publicKeyAlgorithm", -7)
            putJsonArray("transports") { add("internal") }
        }
        val extensionResults = buildJsonObject {
            if (options.extensions["credProps"] == JsonPrimitive(true)) putJsonObject("credProps") { put("rk", true) }
            if (options.extensions["prf"] is JsonObject) putJsonObject("prf") { put("enabled", false) }
        }
        return passkey to credential(passkey, response, extensionResults)
    }

    fun assertion(passkey: PasskeyData, options: PasskeyGetOptions, client: PasskeyClient, userVerified: Boolean): String {
        require(userVerified) { "Verify your identity before signing in." }
        require(options.matches(passkey)) { "This passkey does not match the request." }
        passkey.validated()
        val data = clientData("webauthn.get", options.challenge, client)
        val authData = authenticatorData(passkey.rpId, false)
        val key = KeyFactory.getInstance("EC").generatePrivate(ECPrivateKeySpec(BigInteger(1, passkeyBytes(passkey.privateKeyJwk.d, 32..32)), curve))
        // Java emits ASN.1 DER ECDSA signatures; WebCrypto emits P1363 and converts to DER.
        val signature = Signature.getInstance("SHA256withECDSA").run {
            initSign(key); update(authData + (client.clientDataHash ?: sha256(requireNotNull(data)))); sign()
        }
        val response = buildJsonObject {
            put("clientDataJSON", data?.let(::passkeyBase64).orEmpty())
            put("authenticatorData", passkeyBase64(authData)); put("signature", passkeyBase64(signature)); put("userHandle", passkey.userHandle)
        }
        val extensionResults = buildJsonObject { if ((options.extensions["appid"] as? JsonPrimitive)?.isString == true) put("appid", false) }
        return credential(passkey, response, extensionResults)
    }

    private fun clientData(type: String, challenge: String, client: PasskeyClient): ByteArray? {
        // Browsers replace the empty clientDataJSON placeholder with their own bytes when supplying a hash.
        if (client.clientDataHash != null) return null
        return buildJsonObject { put("type", type); put("challenge", challenge); put("origin", client.origin); put("crossOrigin", false) }.toString().toByteArray()
    }
    private fun credential(passkey: PasskeyData, response: JsonObject, extensions: JsonObject) = buildJsonObject {
        put("id", passkey.credentialId); put("rawId", passkey.credentialId); put("type", "public-key")
        put("authenticatorAttachment", "platform"); put("clientExtensionResults", extensions); put("response", response)
    }.toString()
    private fun authenticatorData(rpId: String, attested: Boolean): ByteArray =
        sha256(rpId.toByteArray()) + byteArrayOf(if (attested) 0x5d else 0x1d, 0, 0, 0, 0) // UP, UV, BE, BS; zero counter for sync.
    internal fun sha256(bytes: ByteArray): ByteArray = MessageDigest.getInstance("SHA-256").digest(bytes)
    private fun coordinate(value: BigInteger): String = passkeyBase64(value.toByteArray().takeLast(32).toByteArray().let { ByteArray(32 - it.size) + it })
    private fun cborHead(major: Int, size: Int): ByteArray = when {
        size < 24 -> byteArrayOf(((major shl 5) or size).toByte())
        size < 256 -> byteArrayOf(((major shl 5) or 24).toByte(), size.toByte())
        else -> byteArrayOf(((major shl 5) or 25).toByte(), (size shr 8).toByte(), size.toByte())
    }
    private fun cborInt(value: Int) = if (value >= 0) cborHead(0, value) else cborHead(1, -1 - value)
    private fun cborBytes(bytes: ByteArray) = cborHead(2, bytes.size) + bytes
    private fun cborText(text: String) = text.toByteArray().let { cborHead(3, it.size) + it }
    private fun cborMap(entries: List<Pair<ByteArray, ByteArray>>) = entries.fold(cborHead(5, entries.size)) { bytes, (key, value) -> bytes + key + value }
}
