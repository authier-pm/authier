package dev.authier.android

import kotlinx.serialization.Serializable
import java.math.BigInteger
import java.net.URI
import java.time.Instant
import java.util.Base64

/** Wire-compatible with shared/passkeySchema.ts. Serialize this object directly, without a wrapper. */
@Serializable
data class PasskeyData(
    val credentialId: String,
    val rpId: String,
    val rpName: String,
    val userHandle: String,
    val userName: String,
    val userDisplayName: String,
    val privateKeyJwk: PasskeyPrivateJwk,
    val createdAt: String,
    val url: String,
    val label: String,
    val iconUrl: String? = null,
) {
    fun validated(): PasskeyData = apply {
        passkeyBytes(credentialId, 1..1023)
        passkeyBytes(userHandle, 1..64)
        validatePasskeyRpId(rpId)
        privateKeyJwk.validated()
        Instant.parse(createdAt)
        require(url.isNotBlank()) { "Missing passkey website." }
    }

    fun content() = SecretContent(label = label, url = "https://$rpId", username = userName, iconUrl = iconUrl)
}

@Serializable
data class PasskeyPrivateJwk(
    val kty: String = "EC",
    val crv: String = "P-256",
    val x: String,
    val y: String,
    val d: String,
    val key_ops: List<String> = listOf("sign"),
    val ext: Boolean = true,
) {
    fun validated() = apply {
        require(kty == "EC" && crv == "P-256" && key_ops.all { it == "sign" }) { "Unsupported passkey key." }
        val scalar = BigInteger(1, passkeyBytes(d, 32..32))
        require(scalar.signum() > 0 && scalar < PasskeyWebAuthn.curve.order) { "Invalid passkey private key." }
        val prime = BigInteger("ffffffff00000001000000000000000000000000ffffffffffffffffffffffff", 16)
        val px = BigInteger(1, passkeyBytes(x, 32..32))
        val py = BigInteger(1, passkeyBytes(y, 32..32))
        val curve = PasskeyWebAuthn.curve.curve
        require(px < prime && py < prime && py.pow(2).mod(prime) == (px.pow(3) + curve.a * px + curve.b).mod(prime)) {
            "Invalid passkey public key."
        }
    }
}

internal fun passkeyBase64(bytes: ByteArray): String = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)

internal fun passkeyBytes(value: String, size: IntRange): ByteArray {
    require(value.length <= (size.last * 4L + 2) / 3 && value.matches(Regex("[A-Za-z0-9_-]+"))) { "Invalid passkey encoding." }
    return Base64.getUrlDecoder().decode(value).also {
        require(it.size in size && passkeyBase64(it) == value) { "Invalid passkey value length or encoding." }
    }
}

internal fun validatePasskeyRpId(rpId: String) {
    require(rpId.length in 1..253 && rpId == rpId.lowercase() &&
        rpId.split('.').all { it.length in 1..63 && it.matches(Regex("[a-z0-9](?:[a-z0-9-]*[a-z0-9])?")) } &&
        URI("https://$rpId").host == rpId && !rpId.matches(Regex("[0-9.]+"))) { "Invalid passkey domain." }
}
