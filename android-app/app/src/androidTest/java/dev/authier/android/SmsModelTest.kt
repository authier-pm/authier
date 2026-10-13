package dev.authier.android

import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assume.assumeTrue
import org.junit.Test

/** Opt in after pushing the pinned model files to the app's external fixture directory. */
class SmsModelTest {
    private val instrumentation = InstrumentationRegistry.getInstrumentation()
    private val context = instrumentation.targetContext
    private val fixture get() = File(context.filesDir, "sms-model-fixture")
    private val json = Json { ignoreUnknownKeys = true }

    @Serializable private data class Vector(val text: String, val language: String, val code: String?, val score: Double, val margin: Double)
    @Serializable private data class Regression(val text: String, val code: String?)

    private fun installFixture(): File {
        assumeTrue(InstrumentationRegistry.getArguments().getString("smsModelFixture") == "true")
        val files = SmsModelDownload.files(context)
        files.readyDirectory()?.let { if (files.verify(it)) return it }
        files.begin()
        for (entry in files.manifest.files) File(fixture, entry.name).inputStream().use { files.write(entry, it) {} }
        files.finish()
        return checkNotNull(files.readyDirectory())
    }

    @After fun releaseSessions() = runBlocking { AndroidSmsCodeExtractor.close() }

    @Test fun nativeTokenizerAndModelMatchTheResearchRuntime() {
        val directory = installFixture()
        val vectors = instrumentation.context.assets.open("smsModelVectors.json").bufferedReader().use { Json.decodeFromString<List<Vector>>(it.readText()) }
        SmsMiniLm(directory).use { model ->
            for (vector in vectors) {
                val prediction = model.predict(vector.text).single()
                assertEquals("${vector.language}: ${vector.text}", vector.code, prediction.code)
                assertEquals(vector.score, prediction.score, 0.02)
                assertEquals(vector.margin, prediction.margin, 0.02)
            }
        }
    }

    @Test fun hybridPreservesSharedRegressionCasesWithRealLanguageDetectionAndInference() = runBlocking {
        installFixture()
        val vectors = instrumentation.context.assets.open("smsVerificationCodeVectors.json").bufferedReader().use {
            json.decodeFromString<List<Regression>>(it.readText())
        }
        for (vector in vectors) assertEquals(vector.text, vector.code, AndroidSmsCodeExtractor.extract(context, vector.text))
    }

    @Test fun semanticFallbackExtractsChineseAndEnglishWithoutCodeKeywords() = runBlocking {
        installFixture()
        assertEquals("079288", AndroidSmsCodeExtractor.extract(context, "Pair this phone with your account. Type 079288 on the other device."))
        assertNotNull(AndroidSmsCodeExtractor.extract(context, "请在另一台设备上输入079288以登录您的账户。"))
    }
}
