package dev.authier.android

import java.io.File
import java.security.MessageDigest
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.junit.Assume.assumeTrue
import org.junit.Test

/** Optional replay uses the production router and frozen model outputs, never trains on test. */
class SmsHybridBenchmarkTest {
    @Serializable private data class Row(val id: String, val language: String, val text: String, val code: String?, val prediction: String?, val candidate: SmsModelPrediction)
    @Serializable private data class Metrics(val examples: Int, val correct: Int, val returned: Int, val falsePositives: Int, val precision: Double, val recall: Double, val exactMatch: Double)
    @Serializable private data class Report(val note: String, val sourceSha256: String, val policySha256: String, val regex: Metrics, val minilm: Metrics, val hybrid: Metrics, val routes: Map<String, Int>, val byLanguage: Map<String, Metrics>)
    private val json = Json { ignoreUnknownKeys = true; prettyPrint = true }
    private fun hash(file: File) = MessageDigest.getInstance("SHA-256").digest(file.readBytes()).joinToString("") { "%02x".format(it) }
    private fun metrics(rows: List<Row>, codes: List<String?>): Metrics {
        val pairs = rows.zip(codes)
        val correct = pairs.count { (row, code) -> code != null && row.code == code }
        val returned = codes.count { it != null }
        val positives = rows.count { it.code != null }
        return Metrics(rows.size, correct, returned, pairs.count { (row, code) -> row.code == null && code != null },
            if (returned > 0) correct.toDouble() / returned else 1.0,
            if (positives > 0) correct.toDouble() / positives else 0.0,
            pairs.count { (row, code) -> row.code == code }.toDouble() / rows.size)
    }

    @Test fun replayFrozenTestWithProductionRouting() = runBlocking {
        assumeTrue(System.getenv("AUTHIER_SMS_BENCHMARK") == "1")
        val root = File(checkNotNull(System.getProperty("authier.repoRoot")))
        val source = File(root, "ml/sms-code-extractor/artifacts/minilm-v3g/test.onnx.predictions.jsonl")
        val policyFile = File(root, "android-app/app/src/main/assets/smsModelPolicy.json")
        val policy = json.decodeFromString<SmsModelPolicy>(policyFile.readText())
        val rows = source.readLines().map { json.decodeFromString<Row>(it) }
        val routes = mutableMapOf<String, Int>()
        val codes = rows.map { row ->
            val route = when (SmsCodeExtractor.route(row.text)) {
                is SmsCodeExtractor.Decision.Recognized -> "regex"
                SmsCodeExtractor.Decision.Rejected -> "rejected"
                SmsCodeExtractor.Decision.Unrecognized -> "model"
            }
            routes[route] = (routes[route] ?: 0) + 1
            HybridSmsCodeExtractor(policy, { listOf(SmsLanguage(row.language, 1f)) }, { listOf(row.candidate) }).extract(row.text)
        }
        val report = Report("Synthetic exposed test replay. Uses dataset language labels (oracle routing), not ML Kit predictions. Native language detection is checked separately on regression and semantic examples; these aggregate numbers are not end-to-end phone accuracy.",
            hash(source), hash(policyFile), metrics(rows, rows.map { SmsCodeExtractor.extract(it.text) }), metrics(rows, rows.map { it.prediction }), metrics(rows, codes), routes,
            rows.zip(codes).groupBy { it.first.language }.mapValues { (_, group) -> metrics(group.map { it.first }, group.map { it.second }) })
        val output = File(root, "ml/sms-code-extractor/reports/hybrid/test.json")
        checkNotNull(output.parentFile).mkdirs()
        output.writeText(json.encodeToString(report) + "\n")
    }
}
