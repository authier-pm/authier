package dev.authier.android

import kotlinx.serialization.Serializable

@Serializable
internal data class SmsModelThreshold(val nullThreshold: Double, val minimumMargin: Double)

@Serializable
internal data class SmsModelPolicy(
    val languages: Map<String, SmsModelThreshold>,
    val minimumLanguageConfidence: Float = 0.8f,
    val minimumLanguageMargin: Float = 0.2f,
)

internal data class SmsLanguage(val tag: String, val confidence: Float)
@Serializable
internal data class SmsModelPrediction(val code: String?, val score: Double, val margin: Double)

/** Pure routing policy; Android supplies local language detection and local inference. */
internal class HybridSmsCodeExtractor(
    private val policy: SmsModelPolicy,
    private val identify: suspend (String) -> List<SmsLanguage>,
    private val predict: suspend (String) -> List<SmsModelPrediction>,
) {
    suspend fun extract(text: String): String? {
        when (val decision = SmsCodeExtractor.route(text)) {
            is SmsCodeExtractor.Decision.Recognized -> return decision.code
            SmsCodeExtractor.Decision.Rejected -> return null
            SmsCodeExtractor.Decision.Unrecognized -> Unit
        }
        val guesses = identify(text).filter { it.confidence.isFinite() }.sortedByDescending { it.confidence }
        val language = guesses.firstOrNull() ?: return null
        if (language.confidence < policy.minimumLanguageConfidence ||
            language.confidence - (guesses.getOrNull(1)?.confidence ?: 0f) < policy.minimumLanguageMargin) return null
        // ML Kit can return regional BCP-47 tags. Unknown/unsupported languages abstain.
        val threshold = policy.languages[language.tag.lowercase().substringBefore('-')] ?: return null
        val codes = predict(text).mapNotNull { prediction ->
            if (prediction.score.isFinite() && prediction.margin.isFinite() &&
                prediction.score > threshold.nullThreshold && prediction.margin >= threshold.minimumMargin &&
                prediction.code?.matches(Regex("[A-Za-z0-9]{4,10}")) == true) prediction.code else null
        }.toSet()
        return codes.singleOrNull()
    }
}
