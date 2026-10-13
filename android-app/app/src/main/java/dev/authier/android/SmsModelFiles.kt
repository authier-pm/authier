package dev.authier.android

import java.io.File
import java.io.IOException
import java.io.InputStream
import java.security.MessageDigest
import kotlinx.serialization.Serializable

@Serializable
internal data class SmsModelFile(val name: String, val bytes: Long, val sha256: String)

@Serializable
internal data class SmsModelManifest(val version: String, val baseUrl: String, val files: List<SmsModelFile>)

/** Install only a complete, checksum-verified set. Partial downloads are never loadable. */
internal class SmsModelFiles(private val root: File, val manifest: SmsModelManifest) {
    init {
        require(manifest.version.matches(Regex("[a-zA-Z0-9-]+")))
        require(manifest.baseUrl.startsWith("https://"))
        require(manifest.files.map { it.name }.toSet() == setOf("model.int8.onnx", "sentencepiece.bpe.model", "baseModelLicense.txt"))
        require(manifest.files.size == 3 && manifest.files.all { it.bytes in 1..200_000_000 && it.sha256.matches(Regex("[a-f0-9]{64}")) })
    }

    private val installed get() = File(root, manifest.version)
    private val staging get() = File(root, "${manifest.version}-partial")
    fun readyDirectory(): File? = installed.takeIf { directory ->
        File(directory, "ready").isFile && manifest.files.all { File(directory, it.name).length() == it.bytes }
    }

    fun verify(directory: File): Boolean = manifest.files.all { entry ->
        val file = File(directory, entry.name)
        file.isFile && file.length() == entry.bytes && file.inputStream().use { hash(it) } == entry.sha256
    }

    fun begin() {
        staging.deleteRecursively()
        check(staging.mkdirs()) { "Cannot prepare SMS model directory" }
    }

    fun write(entry: SmsModelFile, input: InputStream, progress: (Long) -> Unit) {
        require(entry in manifest.files)
        val digest = MessageDigest.getInstance("SHA-256")
        var size = 0L
        File(staging, entry.name).outputStream().use { output ->
            val buffer = ByteArray(64 * 1024)
            while (true) {
                val read = input.read(buffer)
                if (read < 0) break
                size += read
                if (size > entry.bytes) throw IOException("SMS model exceeds its expected size")
                digest.update(buffer, 0, read)
                output.write(buffer, 0, read)
                progress(size)
            }
            output.fd.sync()
        }
        if (size != entry.bytes || hex(digest.digest()) != entry.sha256) throw IOException("SMS model checksum mismatch")
    }

    fun finish() {
        check(verify(staging)) { "Incomplete SMS model download" }
        File(staging, "ready").writeText(manifest.version)
        installed.deleteRecursively()
        check(staging.renameTo(installed)) { "Cannot install SMS model" }
    }

    fun discardPartial() { staging.deleteRecursively() }

    fun invalidate() { File(installed, "ready").delete() }

    private fun hash(input: InputStream): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val buffer = ByteArray(64 * 1024)
        while (true) {
            val read = input.read(buffer)
            if (read < 0) break
            digest.update(buffer, 0, read)
        }
        return hex(digest.digest())
    }

    private fun hex(bytes: ByteArray) = bytes.joinToString("") { "%02x".format(it) }
}
