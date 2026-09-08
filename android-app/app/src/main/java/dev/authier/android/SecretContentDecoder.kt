package dev.authier.android

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull

/** Mirrors vault-web/src/lib/vaultSecrets.ts normalization for existing imported items. */
object SecretContentDecoder {
    private val json = Json { ignoreUnknownKeys = true }

    fun decode(plaintext: String, kind: String): SecretContent {
        requireNativeEditableKind(kind)
        val payload = json.parseToJsonElement(plaintext) as? JsonObject
            ?: throw IllegalArgumentException("Vault item must be a JSON object")
        val username = payload.string("username")
        val url = payload.nullableString("url", preserveEmpty = true)
        val label = payload.string("label").ifEmpty {
            if (kind == "TOTP") payload.string("originalName").ifEmpty { url.orEmpty().ifEmpty { "Untitled TOTP" } }
            else url.orEmpty().ifEmpty { username.ifEmpty { "Untitled login" } }
        }
        return SecretContent(
            label = label,
            url = if (kind == "LOGIN_CREDENTIALS") url.orEmpty() else url,
            username = username,
            password = payload.string("password"),
            secret = payload.string("secret"),
            digits = if (kind == "TOTP") payload.integer("digits", 6) else 6,
            period = if (kind == "TOTP") payload.integer("period", 30) else 30,
            algorithm = payload.string("algorithm").ifEmpty { "SHA1" },
            iconUrl = payload.nullableString("iconUrl"),
            androidUri = payload.nullableString("androidUri"),
            iosUri = payload.nullableString("iosUri"),
        )
    }

    private fun JsonObject.string(name: String): String = nullableString(name, preserveEmpty = true).orEmpty()

    private fun JsonObject.nullableString(name: String, preserveEmpty: Boolean = false): String? {
        val primitive = get(name) as? JsonPrimitive ?: return null
        if (!primitive.isString) return null
        val value = primitive.content
        return value.takeIf { preserveEmpty || it.isNotEmpty() }
    }

    private fun JsonObject.integer(name: String, fallback: Int): Int {
        val primitive = get(name) as? JsonPrimitive ?: return fallback
        val numeric = primitive.contentOrNull?.toDoubleOrNull() ?: return fallback
        if (!numeric.isFinite()) return fallback
        require(numeric % 1.0 == 0.0 && numeric >= Int.MIN_VALUE && numeric <= Int.MAX_VALUE) {
            "Vault item $name must be a whole number"
        }
        return numeric.toInt()
    }
}
