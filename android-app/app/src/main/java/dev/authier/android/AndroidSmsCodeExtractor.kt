package dev.authier.android

import android.content.Context
import com.google.mlkit.nl.languageid.LanguageIdentification
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.tasks.await
import kotlinx.serialization.json.Json

internal object AndroidSmsCodeExtractor {
    private val mutex = Mutex()
    private var model: SmsMiniLm? = null

    suspend fun close() = mutex.withLock {
        model?.close()
        model = null
    }

    suspend fun extract(context: Context, text: String): String? {
        // Keep recognized SMS immediate, even while offline or downloading the model.
        when (val decision = SmsCodeExtractor.route(text)) {
            is SmsCodeExtractor.Decision.Recognized -> return decision.code
            SmsCodeExtractor.Decision.Rejected -> return null
            SmsCodeExtractor.Decision.Unrecognized -> Unit
        }
        val files = SmsModelDownload.files(context)
        val directory = files.readyDirectory() ?: return null
        val policy = context.assets.open("smsModelPolicy.json").bufferedReader().use { Json.decodeFromString<SmsModelPolicy>(it.readText()) }
        val extractor = HybridSmsCodeExtractor(policy, identify = { message ->
            val identifier = LanguageIdentification.getClient()
            try {
                identifier.identifyPossibleLanguages(message).await().map { SmsLanguage(it.languageTag, it.confidence) }
            } finally {
                identifier.close()
            }
        }, predict = { message ->
            mutex.withLock {
                if (model == null) {
                    if (!files.verify(directory)) {
                        files.invalidate()
                        SmsModelDownload.ensure(context)
                        return@withLock emptyList()
                    }
                    model = SmsMiniLm(directory)
                }
                checkNotNull(model).predict(message)
            }
        })
        return extractor.extract(text)
    }
}
