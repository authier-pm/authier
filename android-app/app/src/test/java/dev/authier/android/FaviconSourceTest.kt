package dev.authier.android

import org.junit.Assert.*
import org.junit.Test

class FaviconSourceTest {
    @Test fun savedIconTakesPrecedenceOverWebsite() {
        assertEquals(FaviconSource.Remote("https://cdn.example.com/logo.svg"),
            resolveFavicon("https://cdn.example.com/logo.svg", "https://other.example/login"))
    }

    @Test fun websiteUsesTheExtensionsHostnameProviderWithoutPathOrCredentials() {
        assertEquals(FaviconSource.Remote("https://icons.duckduckgo.com/ip3/accounts.example.com.ico"),
            resolveFavicon(null, "https://user:password@accounts.example.com:8443/private?token=secret"))
        assertEquals(FaviconSource.Remote("https://icons.duckduckgo.com/ip3/github.com.ico"), resolveFavicon("", "github.com/login"))
        assertEquals(FaviconSource.Remote("https://icons.duckduckgo.com/ip3/xn--bcher-kva.de.ico"), resolveFavicon(null, "https://bücher.de"))
    }

    @Test fun missingAndUnsupportedUrlsUsePlaceholderWithoutFetchingLocalFiles() {
        assertNull(resolveFavicon(null, null))
        assertNull(resolveFavicon(null, "not a website"))
        assertNull(resolveFavicon("file:///private/vault", "https://example.com"))
        assertNull(resolveFavicon("content://private/vault", null))
        assertNull(resolveFavicon("https://username:password@example.com/icon.png", null))
        assertNull(resolveFavicon(null, "android://com.example"))
    }

    @Test fun embeddedBrowserIconsAreDecodedWithoutNetwork() {
        val result = resolveFavicon("data:image/png;base64,AQID", null) as FaviconSource.Embedded
        assertArrayEquals(byteArrayOf(1, 2, 3), result.bytes)
        val svg = resolveFavicon("data:image/svg+xml,%3Csvg%3E+%3C/svg%3E", null) as FaviconSource.Embedded
        assertEquals("<svg>+</svg>", String(svg.bytes))
        assertNull(resolveFavicon("data:image/png;base64,!!", null))
        assertNull(resolveFavicon("data:image/png;base64," + "A".repeat(128 * 1024), null))
    }
}
