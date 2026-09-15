package dev.authier.android

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import okhttp3.OkHttpClient
import okhttp3.Request
import java.security.MessageDigest
import java.util.concurrent.TimeUnit

/** Only the user's chosen browser may assert arbitrary origins. Embedded apps need website consent. */
class WebAutofillTrust(private val context: Context) {
    fun verify(destination: AutofillDestination): Boolean {
        val origin = destination.webOrigin ?: return true
        if (httpsOrigin(origin) != origin) return false
        if (isDefaultBrowser(destination.packageName)) return true
        val fingerprints = signingFingerprints(destination.packageName)
        if (fingerprints.isEmpty()) return false
        val request = Request.Builder().url("$origin/.well-known/assetlinks.json").build()
        return client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) return@use false
            val body = response.body ?: return@use false
            // No cookies, vault headers, redirects, disk cache, or unbounded remote documents.
            val source = body.source()
            source.request(MAX_BYTES + 1)
            if (source.buffer.size > MAX_BYTES) return@use false
            authorizesWebCredentials(source.readUtf8(), destination.packageName, fingerprints)
        }
    }

    private fun isDefaultBrowser(packageName: String): Boolean {
        // A hostless URI excludes host-specific deep-link handlers. Android's resolver
        // returns its selected general HTTPS browser (or the system chooser if unset).
        val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://"))
            .addCategory(Intent.CATEGORY_BROWSABLE)
        val resolved = context.packageManager.resolveActivity(browserIntent, PackageManager.MATCH_DEFAULT_ONLY) ?: return false
        return resolved.activityInfo?.packageName == packageName
    }

    @Suppress("DEPRECATION")
    private fun signingFingerprints(packageName: String): Set<String> {
        val signatures = if (Build.VERSION.SDK_INT >= 28) {
            context.packageManager.getPackageInfo(packageName, PackageManager.GET_SIGNING_CERTIFICATES).signingInfo?.apkContentsSigners
        } else context.packageManager.getPackageInfo(packageName, PackageManager.GET_SIGNATURES).signatures
        return signatures.orEmpty().map { signature ->
            MessageDigest.getInstance("SHA-256").digest(signature.toByteArray()).joinToString(":") { "%02X".format(it) }
        }.toSet()
    }

    private companion object {
        const val MAX_BYTES = 256L * 1024
        val client = OkHttpClient.Builder().followRedirects(false).followSslRedirects(false)
            .callTimeout(5, TimeUnit.SECONDS).build()
    }
}

internal fun authorizesWebCredentials(document: String, packageName: String, fingerprints: Set<String>): Boolean {
    val statements = vaultJson.parseToJsonElement(document) as? JsonArray ?: return false
    val authorized = statements.flatMap { statement ->
        val entry = statement as? JsonObject ?: return@flatMap emptyList()
        val relations = entry["relation"] as? JsonArray ?: return@flatMap emptyList()
        if (JsonPrimitive("delegate_permission/common.get_login_creds") !in relations) return@flatMap emptyList()
        val target = entry["target"] as? JsonObject ?: return@flatMap emptyList()
        if (target["namespace"] != JsonPrimitive("android_app") || target["package_name"] != JsonPrimitive(packageName)) return@flatMap emptyList()
        (target["sha256_cert_fingerprints"] as? JsonArray).orEmpty().mapNotNull { (it as? JsonPrimitive)?.content?.uppercase() }
    }.toSet()
    return fingerprints.isNotEmpty() && fingerprints.all { it.uppercase() in authorized }
}
