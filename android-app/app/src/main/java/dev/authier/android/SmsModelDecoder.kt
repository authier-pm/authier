package dev.authier.android

import java.text.Normalizer

internal data class SmsToken(val id: Long, val start: Int, val end: Int)

/** Source-span decoder matching ml/sms-code-extractor/decodeSpans.py. */
internal object SmsModelDecoder {
    private val invisible = Regex("[\\u00ad\\u200b-\\u200f\\u202a-\\u202e\\u2060-\\u206f\\ufeff]")
    private val links = Regex("https?://\\S+|www\\.\\S+|\\S+@\\S+\\.\\S+", RegexOption.IGNORE_CASE)
    private val separators = Regex("[\\s\\p{Z}·•-]+")
    private val codeText = Regex("[A-Za-z0-9](?:[A-Za-z0-9\\s\\p{Z}·•-]*[A-Za-z0-9])?")
    private const val PUNCTUATION = ".,:;!?()[]{}<>\"'。！？、，：；（）「」『』«»“”‘’"
    private fun ascii(char: Char) = char in 'A'..'Z' || char in 'a'..'z' || char in '0'..'9'
    private fun boundary(char: Char) = char.isWhitespace() || char in PUNCTUATION

    fun normalize(text: String): String {
        val normalized = Normalizer.normalize(text, Normalizer.Form.NFKC).replace(invisible, "")
            .replace(Regex("[\\u2010-\\u2015\\u2212]"), "-").replace("\r\n", "\n").replace('\r', '\n')
        return buildString {
            normalized.codePoints().forEach { point ->
                if (Character.getType(point) == Character.DECIMAL_DIGIT_NUMBER.toInt()) append(Character.digit(point, 10))
                else appendCodePoint(point)
            }
        }
    }

    /** SentencePiece offsets are UTF-8 byte positions; Kotlin strings use UTF-16. */
    fun tokens(text: String, ids: IntArray, byteOffsets: IntArray): List<SmsToken> {
        require(ids.size == byteOffsets.size && ids.size >= 2 && ids.first() == 0 && ids.last() == 2)
        val byteToChar = IntArray(text.toByteArray(Charsets.UTF_8).size + 1)
        var bytes = 0
        var chars = 0
        while (chars < text.length) {
            val point = text.codePointAt(chars)
            val count = when {
                point <= 0x7f -> 1
                point <= 0x7ff -> 2
                point <= 0xffff -> 3
                else -> 4
            }
            repeat(count) { byteToChar[bytes++] = chars }
            chars += Character.charCount(point)
        }
        byteToChar[bytes] = chars
        require(byteOffsets.all { it in byteToChar.indices })
        require(byteOffsets.asList().zipWithNext().all { (left, right) -> left <= right })
        return ids.indices.map { index ->
            if (index == 0 || index == ids.lastIndex) SmsToken(ids[index].toLong(), 0, 0)
            else SmsToken(ids[index].toLong(), byteToChar[byteOffsets[index]], byteToChar[byteOffsets[index + 1]])
        }
    }

    fun windows(tokens: List<SmsToken>): List<List<SmsToken>> {
        val content = tokens.drop(1).dropLast(1)
        if (content.size > 190 + 126 * 7) return emptyList() // Bound receiver time; never silently truncate.
        val windows = mutableListOf<List<SmsToken>>()
        var start = 0
        do {
            windows += listOf(SmsToken(0, 0, 0)) + content.drop(start).take(190) + SmsToken(2, 0, 0)
            if (start + 190 >= content.size) break
            start += 126 // 64-token overlap, matching the reference runtime.
        } while (true)
        return windows
    }

    fun decode(text: String, tokens: List<SmsToken>, starts: FloatArray, ends: FloatArray, validity: FloatArray): SmsModelPrediction {
        require(listOf(starts.size, ends.size, validity.size).all { it == tokens.size })
        if ((starts.asSequence() + ends.asSequence() + validity.asSequence()).any { !it.isFinite() })
            return SmsModelPrediction(null, -1e6, 0.0)
        val lefts = starts.indices.sortedByDescending { starts[it] }.take(24)
        val rights = ends.indices.sortedByDescending { ends[it] }.take(24)
        val excluded = links.findAll(text).map { it.range }.toList()
        data class Candidate(val code: String, val spanScore: Double, val confidence: Double)
        val candidates = mutableMapOf<String, Candidate>()
        val nullScore = (starts[0] + ends[0]).toDouble()
        for (left in lefts) {
            if (left == 0 || tokens[left].start == tokens[left].end) continue
            for (right in rights) {
                if (right < left || right - left > 32 || tokens[right].start == tokens[right].end) continue
                var start = tokens[left].start
                var end = tokens[right].end
                while (start < end && boundary(text[start])) start++
                while (end > start && boundary(text[end - 1])) end--
                if (end <= start || end - start > 40 ||
                    (start > 0 && ascii(text[start - 1])) || (end < text.length && ascii(text[end])) ||
                    excluded.any { start <= it.last && end > it.first }) continue
                val raw = text.substring(start, end)
                if (!codeText.matches(raw)) continue
                val code = raw.replace(separators, "")
                if (code.length !in 4..10) continue
                val score = (starts[left] + ends[right]).toDouble() - nullScore
                if (score <= (candidates[code]?.spanScore ?: Double.NEGATIVE_INFINITY)) continue
                val confidence = validity.sliceArray(left..right).average()
                candidates[code] = Candidate(code, score, confidence)
            }
        }
        val ranked = candidates.values.sortedByDescending { it.spanScore }
        val best = ranked.firstOrNull() ?: return SmsModelPrediction(null, -1e6, 0.0)
        val margin = ranked.getOrNull(1)?.let { best.spanScore - it.spanScore } ?: 1e6
        return SmsModelPrediction(best.code, best.confidence, margin)
    }
}
