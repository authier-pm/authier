package dev.authier.android

import java.io.File
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Assert.assertEquals
import org.junit.Test

class SmsCodeExtractorTest {
    // The extension's TypeScript extractor is tested against the same file.
    private val vectors = Json.parseToJsonElement(
        File(System.getProperty("authier.smsCodeVectors", "../../shared/smsVerificationCodeVectors.json")).readText(),
    ).jsonArray.map { element ->
        val vector = element.jsonObject
        val code = vector.getValue("code")
        vector.getValue("text").jsonPrimitive.content to if (code is JsonNull) null else code.jsonPrimitive.content
    }

    @Test
    fun `extracts the same code as the browser extension for every shared vector`() {
        check(vectors.size > 30)
        for ((text, code) in vectors) assertEquals(text, code, SmsCodeExtractor.extract(text))
    }

    // Long runs without spaces once took seconds on the JVM through regex backtracking.
    @Test(timeout = 2_000)
    fun `rejects oversized input without scanning past the length limit`() {
        assertEquals(null, SmsCodeExtractor.extract("x".repeat(40_000) + " Your code: 123456"))
    }
}
