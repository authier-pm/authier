package dev.authier.android

import dev.authier.android.crypto.Totp
import java.net.URI
import java.net.URISyntaxException
import java.net.URLDecoder
import java.util.Locale

/** Untrusted QR data is parsed locally; errors never include the URI or setup key. */
object TotpProvisioning {
    fun parse(value: String): SecretContent {
        require(value.length <= 8192) { "This QR code is too large. Scan a single account's setup QR code." }
        val uri = try {
            URI(value.trim())
        } catch (_: URISyntaxException) {
            throw IllegalArgumentException("This QR code is not a valid authenticator setup link.")
        }
        require(uri.scheme.equals("otpauth", ignoreCase = true)) { "Scan an authenticator setup QR code (otpauth://totp)." }
        require(uri.rawAuthority.equals("totp", ignoreCase = true)) { "Only time-based (TOTP) QR codes are supported. Counter-based HOTP codes cannot be added." }
        require(uri.rawFragment == null) { "This authenticator setup link is malformed." }
        val parameters = mutableMapOf<String, String>()
        for (part in uri.rawQuery.orEmpty().split('&').filter { it.isNotEmpty() }) {
            val key = decode(part.substringBefore('='))
            if (key !in setOf("secret", "issuer", "algorithm", "digits", "period")) continue
            require(!parameters.containsKey(key)) { "This QR code contains duplicate settings." }
            parameters[key] = decode(part.substringAfter('=', ""))
        }
        val secret = parameters["secret"].orEmpty().uppercase(Locale.ROOT)
        require(secret.matches(Regex("[A-Z2-7]+=*"))) { "This QR code has a missing or invalid Base32 setup key." }
        val algorithm = parameters["algorithm"]?.uppercase(Locale.ROOT) ?: "SHA1"
        require(algorithm == "SHA1") { "This QR code uses an unsupported algorithm. Authier currently supports SHA1 setup codes." }
        val digits = integer(parameters, "digits", 6)
        val period = integer(parameters, "period", 30)
        require(digits in 6..8) { "This QR code must use 6 to 8 digits." }
        require(period > 0) { "This QR code must have a positive code period." }
        // Validate against the same generator used by the vault before changing the editor.
        require(runCatching { Totp.generate(secret, algorithm, digits, period) }.isSuccess) { "This QR code has an invalid setup key." }
        val label = decode(uri.rawPath.orEmpty().removePrefix("/")).trim()
        val issuer = parameters["issuer"].orEmpty().trim()
        val labelIssuer = if (':' in label) label.substringBefore(':').trim() else ""
        require(issuer.isEmpty() || labelIssuer.isEmpty() || issuer == labelIssuer) { "The account name and issuer in this QR code do not match." }
        val account = label.substringAfter(':').trim()
        val provider = issuer.ifEmpty { labelIssuer }
        val name = listOf(provider, account).filter { it.isNotBlank() }.joinToString(": ")
        return SecretContent(label = name, username = account, secret = secret, algorithm = algorithm, digits = digits, period = period)
    }

    private fun integer(parameters: Map<String, String>, key: String, default: Int): Int {
        val value = parameters[key] ?: return default
        require(value.matches(Regex("[0-9]+"))) { "This QR code has an invalid $key setting." }
        return requireNotNull(value.toIntOrNull()) { "This QR code has an invalid $key setting." }
    }

    // A literal + is valid in an email address; otpauth uses URI percent encoding.
    private fun decode(value: String): String = URLDecoder.decode(value.replace("+", "%2B"), "UTF-8")
}

fun SecretContent.withTotpProvisioning(scanned: SecretContent): SecretContent = copy(
    label = scanned.label.ifBlank { label },
    username = scanned.username,
    secret = scanned.secret,
    algorithm = scanned.algorithm,
    digits = scanned.digits,
    period = scanned.period,
)
