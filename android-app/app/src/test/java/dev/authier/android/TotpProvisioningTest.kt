package dev.authier.android

import com.google.zxing.BarcodeFormat
import com.google.zxing.BinaryBitmap
import com.google.zxing.MultiFormatReader
import com.google.zxing.RGBLuminanceSource
import com.google.zxing.common.HybridBinarizer
import com.google.zxing.qrcode.QRCodeWriter
import dev.authier.android.crypto.Totp
import org.junit.Assert.*
import org.junit.Test

class TotpProvisioningTest {
    private val secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"
    private val uri = "otpauth://totp/GitHub:alice%2Btest%40example.com?secret=$secret&issuer=GitHub"

    @Test fun decodesRealQrPixelsAndUsesRfcSettings() {
        val matrix = QRCodeWriter().encode("$uri&digits=8&period=30&algorithm=SHA1", BarcodeFormat.QR_CODE, 600, 600)
        val pixels = IntArray(600 * 600) { if (matrix[it % 600, it / 600]) 0xff000000.toInt() else 0xffffffff.toInt() }
        val decoded = MultiFormatReader().decode(BinaryBitmap(HybridBinarizer(RGBLuminanceSource(600, 600, pixels))))
        val content = TotpProvisioning.parse(decoded.text)
        assertEquals("GitHub: alice+test@example.com", content.label)
        assertEquals("alice+test@example.com", content.username)
        assertEquals("94287082", Totp.generate(content.secret, content.algorithm, content.digits, content.period, 59_000))
    }

    @Test fun usesDefaultsAndPreservesLiteralPlusAndUnicode() {
        val content = TotpProvisioning.parse("otpauth://totp/alice+test%40example.com?secret=${secret.lowercase()}&issuer=%C4%8Cesk%C3%A1%20slu%C5%BEba")
        assertEquals("Česká služba: alice+test@example.com", content.label)
        assertEquals(secret, content.secret)
        assertEquals(6, content.digits)
        assertEquals(30, content.period)
        assertEquals("SHA1", content.algorithm)
        assertEquals("GitHub: alice+test@example.com", TotpProvisioning.parse(uri.substringBefore("&issuer")).label)
    }

    @Test fun importsCustomPeriodAndPreservesUnrelatedEditorFields() {
        val initial = SecretContent(label = "Old", url = "https://example.com", iconUrl = "saved-icon", secret = "OLD", period = 60, digits = 8)
        val merged = initial.withTotpProvisioning(TotpProvisioning.parse("$uri&period=45&digits=7"))
        assertEquals(initial.url, merged.url)
        assertEquals(initial.iconUrl, merged.iconUrl)
        assertEquals(45, merged.period)
        assertEquals(7, merged.digits)
        assertEquals(secret, merged.secret)
        assertEquals(30, merged.withTotpProvisioning(TotpProvisioning.parse(uri)).period)
    }

    @Test fun rejectsMalformedOrUnsupportedCodesWithoutLeakingSecrets() {
        val invalid = listOf(
            "https://example.com/?secret=$secret", "otpauth-migration://offline?data=$secret",
            uri.replace("totp/", "hotp/"), "otpauth://totp/account", uri.replace(secret, "INVALID0189"),
            uri.replace(secret, "A"), "$uri&digits=5", "$uri&digits=9", "$uri&digits=abc", "$uri&digits=",
            "$uri&period=0", "$uri&period=-30", "$uri&period=2147483648", "$uri&period=1.5",
            "$uri&algorithm=SHA256", "$uri&algorithm=SHA512", "$uri&algorithm=",
            "$uri&secret=$secret", "$uri&digits=6&digits=8", "$uri#fragment",
            uri.replace("GitHub:alice", "Wrong:alice"), "$uri&issuer=%ZZ", "x".repeat(8193),
        )
        invalid.forEach { input ->
            val failure = runCatching { TotpProvisioning.parse(input) }.exceptionOrNull()
            assertTrue("Expected sanitized validation failure", failure is IllegalArgumentException)
            assertFalse(failure!!.message.orEmpty().contains(secret))
        }
    }
}
