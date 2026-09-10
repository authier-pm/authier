package dev.authier.android

import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import java.net.URLDecoder
import java.util.Base64

internal sealed interface FaviconSource {
    data class Remote(val url: String) : FaviconSource
    data class Embedded(val bytes: ByteArray) : FaviconSource
}

/** Same precedence/provider as the extension's SecretItemIcon; never send paths or credentials to the provider. */
internal fun resolveFavicon(iconUrl: String?, website: String?): FaviconSource? {
    val saved = iconUrl?.trim()?.takeIf { it.isNotEmpty() }
    if (saved != null) {
        if (saved.startsWith("data:image/")) return embeddedFavicon(saved)
        val parsed = saved.toHttpUrlOrNull() ?: return null
        if (parsed.username.isNotEmpty() || parsed.password.isNotEmpty()) return null
        return FaviconSource.Remote(parsed.toString())
    }
    val url = website?.trim()?.takeIf { it.isNotEmpty() } ?: return null
    val normalized = if (url.contains("://")) url else "https://$url"
    val host = normalized.toHttpUrlOrNull()?.host ?: return null
    return FaviconSource.Remote("https://icons.duckduckgo.com/ip3/$host.ico")
}

private fun embeddedFavicon(value: String): FaviconSource.Embedded? {
    // Saved browser icons can be data URLs; bound decoding before allocating their payload.
    if (value.length > 128 * 1024) return null
    val separator = value.indexOf(',')
    if (separator < 0) return null
    val header = value.substring(0, separator)
    val body = value.substring(separator + 1)
    val bytes = runCatching {
        if (header.endsWith(";base64")) Base64.getDecoder().decode(body)
        else URLDecoder.decode(body.replace("+", "%2B"), "UTF-8").toByteArray()
    }.getOrNull() ?: return null
    return FaviconSource.Embedded(bytes)
}
