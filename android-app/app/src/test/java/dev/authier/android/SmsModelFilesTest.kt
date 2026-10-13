package dev.authier.android

import java.io.File
import java.io.IOException
import java.security.MessageDigest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class SmsModelFilesTest {
    @get:Rule val temporary = TemporaryFolder()
    private val bytes = "synthetic model".toByteArray()
    private val checksum = MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it) }
    private val entries = listOf("model.int8.onnx", "sentencepiece.bpe.model", "baseModelLicense.txt").map { SmsModelFile(it, bytes.size.toLong(), checksum) }
    private fun files() = SmsModelFiles(temporary.root, SmsModelManifest("test-model", "https://example.com", entries))

    @Test fun `only complete verified downloads become available`() {
        val files = files()
        files.begin()
        assertNull(files.readyDirectory())
        files.write(entries.first(), bytes.inputStream()) {}
        assertThrows(IllegalStateException::class.java) { files.finish() }
        for (entry in entries.drop(1)) files.write(entry, bytes.inputStream()) {}
        files.finish()
        val directory = checkNotNull(files.readyDirectory())
        assertTrue(files.verify(directory))
        File(directory, entries.first().name).writeBytes(ByteArray(bytes.size))
        assertEquals(false, files.verify(directory))
    }

    @Test fun `truncated oversized and corrupt responses never become available`() {
        for (content in listOf(bytes.copyOf(3), bytes + bytes, ByteArray(bytes.size))) {
            val files = files()
            files.begin()
            assertThrows(IOException::class.java) { files.write(entries.first(), content.inputStream()) {} }
            files.discardPartial()
            assertNull(files.readyDirectory())
        }
    }

    @Test fun `manifest cannot escape the private model directory or use cleartext transport`() {
        assertThrows(IllegalArgumentException::class.java) { SmsModelFiles(temporary.root, SmsModelManifest("../outside", "https://example.com", entries)) }
        assertThrows(IllegalArgumentException::class.java) { SmsModelFiles(temporary.root, SmsModelManifest("valid", "http://example.com", entries)) }
        assertThrows(IllegalArgumentException::class.java) { SmsModelFiles(temporary.root, SmsModelManifest("valid", "https://example.com", entries + entries.first())) }
    }
}
