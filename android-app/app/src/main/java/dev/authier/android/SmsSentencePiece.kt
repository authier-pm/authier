package dev.authier.android

import java.io.Closeable

internal class SmsSentencePiece(path: String) : Closeable {
    private var handle = create(path)
    private external fun create(path: String): Long
    private external fun encode(handle: Long, text: ByteArray): IntArray
    private external fun destroy(handle: Long)

    fun tokenize(text: String): List<SmsToken> {
        check(handle != 0L)
        val encoded = encode(handle, text.toByteArray(Charsets.UTF_8))
        require(encoded.size % 2 == 0)
        return SmsModelDecoder.tokens(text, IntArray(encoded.size / 2) { encoded[it * 2] }, IntArray(encoded.size / 2) { encoded[it * 2 + 1] })
    }

    override fun close() {
        if (handle != 0L) destroy(handle)
        handle = 0
    }

    private companion object {
        init { System.loadLibrary("authier_sms_tokenizer") }
    }
}
