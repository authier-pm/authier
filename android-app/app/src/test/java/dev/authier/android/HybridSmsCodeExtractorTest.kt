package dev.authier.android

import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Test

class HybridSmsCodeExtractorTest {
    private val policy = SmsModelPolicy(mapOf("en" to SmsModelThreshold(7.0, 3.0), "zh" to SmsModelThreshold(8.0, 4.0)))

    @Test fun `known sender and payment templates bypass language detection and the model`() = runTest {
        val extractor = HybridSmsCodeExtractor(policy, { error("No language detection for a known template") }, { error("No model for a known template") })
        assertEquals("123456", extractor.extract("G-123456 is your Google verification code."))
        assertEquals("567890", extractor.extract("Kód pro platbu kartou *1234: 567890"))
        assertEquals("12345", extractor.extract("Telegram code: 12345"))
    }

    @Test fun `explicit exclusions and ambiguous templates are terminal`() = runTest {
        val extractor = HybridSmsCodeExtractor(policy, { error("Rejected SMS must bypass detection") }, { error("Rejected SMS must bypass inference") })
        for (message in listOf("Use code SAVE20 for 20% off", "123456 verification code 654321", "Your verification code: 123456789", "Your code: PLATBA", "Your expired verification code: 123456", "Your balance is 1234 CZK. Code words are fun.", "", "x".repeat(32_001))) {
            assertEquals(message, null, extractor.extract(message))
        }
    }

    @Test fun `unrecognized wording in a known language uses calibrated model thresholds`() = runTest {
        val extractor = HybridSmsCodeExtractor(policy, { listOf(SmsLanguage("en-US", 0.99f)) }, { listOf(SmsModelPrediction("079288", 8.0, 5.0)) })
        assertEquals("079288", extractor.extract("Pair this phone with your account. Type 079288 on the other device."))
    }

    @Test fun `unknown uncertain and conflicting language guesses do not invoke the model`() = runTest {
        for (guesses in listOf(emptyList(), listOf(SmsLanguage("und", 1f)), listOf(SmsLanguage("ja", 1f)), listOf(SmsLanguage("en", 0.6f)), listOf(SmsLanguage("en", 0.85f), SmsLanguage("zh", 0.8f)))) {
            val extractor = HybridSmsCodeExtractor(policy, { guesses }, { error("No model for uncertain language") })
            assertEquals(null, extractor.extract("Pair this phone. Type 123456."))
        }
    }

    @Test fun `low confidence low margin invalid and conflicting window results abstain`() = runTest {
        for (predictions in listOf(
            listOf(SmsModelPrediction("123456", 7.0, 4.0)),
            listOf(SmsModelPrediction("123456", 9.0, 2.0)),
            listOf(SmsModelPrediction("invented code", 9.0, 4.0)),
            listOf(SmsModelPrediction("123456", Double.NaN, 4.0)),
            listOf(SmsModelPrediction("123456", 9.0, 4.0), SmsModelPrediction("654321", 9.0, 4.0)),
        )) {
            val extractor = HybridSmsCodeExtractor(policy, { listOf(SmsLanguage("en", 1f)) }, { predictions })
            assertEquals(null, extractor.extract("Pair this phone. Type 123456."))
        }
        val chinese = HybridSmsCodeExtractor(policy, { listOf(SmsLanguage("zh-Hans", 1f)) }, { listOf(SmsModelPrediction("123456", 7.5, 5.0)) })
        assertEquals(null, chinese.extract("输入123456继续"))
    }
}
