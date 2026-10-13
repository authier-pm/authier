package dev.authier.android

import ai.onnxruntime.OnnxTensor
import ai.onnxruntime.OrtEnvironment
import ai.onnxruntime.OrtSession
import java.io.Closeable
import java.io.File
import java.nio.LongBuffer

/** Native XLM-R tokenization and the selected MiniLM ONNX weights, entirely local. */
internal class SmsMiniLm(directory: File) : Closeable {
    private val environment = OrtEnvironment.getEnvironment()
    private val tokenizer = SmsSentencePiece(File(directory, "sentencepiece.bpe.model").path)
    private val model = OrtSession.SessionOptions().use { options ->
        options.setIntraOpNumThreads(2)
        options.setInterOpNumThreads(1)
        environment.createSession(File(directory, "model.int8.onnx").path, options)
    }

    fun predict(message: String): List<SmsModelPrediction> {
        require(message.length <= 32_000)
        val text = SmsModelDecoder.normalize(message)
        // Hugging Face treats these literal control tokens specially; do not route
        // such messages through a SentencePiece-only tokenizer.
        if (Regex("<(?:s|/s|pad|unk|mask)>").containsMatchIn(text)) return emptyList()
        val tokens = tokenizer.tokenize(text)
        return SmsModelDecoder.windows(tokens).map { window ->
            val shape = longArrayOf(1, window.size.toLong())
            OnnxTensor.createTensor(environment, LongBuffer.wrap(window.map { it.id }.toLongArray()), shape).use { ids ->
                OnnxTensor.createTensor(environment, LongBuffer.wrap(LongArray(window.size) { 1L }), shape).use { mask ->
                    model.run(mapOf("input_ids" to ids, "attention_mask" to mask)).use { output ->
                        fun floats(index: Int) = (output[index] as OnnxTensor).floatBuffer.let { buffer ->
                            FloatArray(buffer.remaining()).also { buffer.get(it) }
                        }
                        SmsModelDecoder.decode(text, window, floats(0), floats(1), floats(3))
                    }
                }
            }
        }
    }

    override fun close() {
        model.close()
        tokenizer.close()
    }
}
