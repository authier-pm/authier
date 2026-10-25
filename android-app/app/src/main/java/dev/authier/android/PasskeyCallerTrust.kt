package dev.authier.android

import android.content.Context
import androidx.annotation.RequiresApi
import androidx.credentials.provider.CallingAppInfo
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

/** Only certificate-pinned browsers may supply a web origin or an opaque client-data hash. */
@RequiresApi(34)
class PasskeyCallerTrust(context: Context) {
    private val browserAllowlist = context.assets.open("passkeyBrowsers.json").bufferedReader().use { it.readText() }

    fun verify(info: CallingAppInfo, rpId: String, clientDataHash: ByteArray?): PasskeyClient {
        validatePasskeyRpId(rpId)
        val browserOrigin = info.getOrigin(browserAllowlist)
        if (browserOrigin != null) {
            require(httpsOrigin(browserOrigin) == browserOrigin) { "Passkeys require a secure website origin." }
            // Trusted browsers perform WebAuthn RP validation, including related-origin requests.
            // Requiring the browser origin's host to equal rpId would break Meta/Google passkeys.
            return PasskeyClient(browserOrigin, clientDataHash)
        }
        require(clientDataHash == null) { "Only a trusted browser can supply a client data hash." }
        val certificates = info.signingInfo.apkContentsSigners.orEmpty().map { it.toByteArray() }
        require(certificates.size == 1) { "This app's signing identity is unsupported." }
        val fingerprints = certificates.map { bytes -> PasskeyWebAuthn.sha256(bytes).joinToString(":") { "%02X".format(it) } }.toSet()
        val request = Request.Builder().url("https://$rpId/.well-known/assetlinks.json").build()
        val authorized = client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) return@use false
            val source = response.body?.source() ?: return@use false
            source.request(MAX_BYTES + 1)
            if (source.buffer.size > MAX_BYTES) return@use false
            authorizesWebCredentials(source.readUtf8(), info.packageName, fingerprints)
        }
        require(authorized) { "This app is not authorized to use passkeys for $rpId. Open the website in your browser instead." }
        return PasskeyClient("android:apk-key-hash:${passkeyBase64(PasskeyWebAuthn.sha256(certificates.single()))}")
    }

    private companion object {
        const val MAX_BYTES = 256L * 1024
        val client = OkHttpClient.Builder().followRedirects(false).followSslRedirects(false).callTimeout(8, TimeUnit.SECONDS).build()
    }
}
