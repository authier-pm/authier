package dev.authier.android

import java.text.Normalizer

/**
 * Port of the SMS mode of web-extension/src/verification-codes/extractVerificationCode.ts.
 * Both implementations must pass shared/smsVerificationCodeVectors.json.
 *
 * JavaScript and Android (ICU) disagree on `\b`, `\s`, `\d` and `$`, so the patterns
 * spell out the JavaScript meaning: ASCII word boundaries and digits, JavaScript
 * whitespace and absolute end of input.
 */
object SmsCodeExtractor {
    private const val WORD = "[A-Za-z0-9_]"
    private const val B = "(?:(?<=$WORD)(?!$WORD)|(?<!$WORD)(?=$WORD))"
    private const val INLINE_SPACE = "\\t\\u000B\\f\\r \\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ufeff"
    private const val S = "[\\n$INLINE_SPACE]"
    private const val NOT_S = "[^\\n$INLINE_SPACE]"
    private val ignoreCase = setOf(RegexOption.IGNORE_CASE)

    private val context = Regex(
        "$B(?:(?:verification|security|confirmation|authentication|authorization|login|log[ -]?in|sign[ -]?in|access|email|launch|one[ -]?time)$S+(?:verification$S+)?(?:code|password|passcode|pin)|otp|passcode|(?:verify|confirm)$S+your$S+(?:email|account|identity))$B",
        ignoreCase,
    )
    private val codeWord = Regex(
        "(?<![\\p{L}\\p{N}])(?:codes?|kódu?|kodu?|kódem|kodem|código|codigo|codice|cod(?:ul)?|kode|koodi|kood|kods|kodas|kodunuz|κωδικός|код[ау]?|кодом|bestätigungscode|sicherheitscode|anmeldecode|zugangscode|freigabecode|verificatiecode|beveiligingscode|inlogcode|verifieringskod|säkerhetskod|engångskod|engangskode|pin|otp|m-?tan|tan|passcode|heslo|hesla|passwort|kennwort|contraseña|senha|parola|hasło|haslo|jelszó|wachtwoord|пароль|şifre|sifre)(?![\\p{L}\\p{N}])",
        ignoreCase,
    )
    private val promotional = Regex("%|$B(?:sale|discount|promo|coupon|voucher|sleva|slevu|rabatt|gutschein|descuento|cupón|réduction|sconto)$B", ignoreCase)
    private val genericExclusion = Regex("$B(?:discount|promo|coupon|gift|postal|zip|referral|tracking|order)$S*\\z", ignoreCase)
    private val nonCodePrefix = Regex("$B(?:call|phone|order|invoice|reference|ticket|tracking)$S*(?:number|id)?$S*(?:is$S*)?[:#]?$S*\\z", ignoreCase)
    private val duration = Regex("^$S*(?:seconds?|secs?|minutes?|mins?|hours?|hrs?|days?)$B", ignoreCase)
    private val amountAfter = Regex("^(?:[.,][0-9]{1,2})? ?(?:czk|kč|kc|eur|usd|gbp|pln|zł|huf|ft|chf|sek|nok|dkk|ron|lei|bgn|uah|rub|inr|jpy|cny|aud|cad|[€$£¥₹₽])(?![\\p{L}\\p{N}])", ignoreCase)
    private val amountOrCardBefore = Regex("(?:[€$£¥₹₽*•]|$B(?:czk|eur|usd|gbp|pln|chf)) ?\\z", ignoreCase)
    private val maskedCard = Regex("^x{2,}[0-9]+\\z", ignoreCase)
    private val senderPrefix = Regex("(?<![\\p{L}\\p{N}])[A-Z]{1,3}-\\z")
    private val beforeBoundary = Regex("[\\p{L}\\p{N}@._/=+-]")
    private val afterBoundary = Regex("^[\\p{L}\\p{N}@_/=+-]|^\\.[\\p{L}\\p{N}]")
    private val token = Regex("[\\p{L}\\p{N}]+")
    private val separator = Regex("^[\\n$INLINE_SPACE\\-·•]+\\z")
    private val spaces = Regex("^$S+\\z")
    private val ascii = Regex("^[a-zA-Z0-9]+\\z")
    private val number = Regex("^[0-9]+\\z")
    private val word = Regex("^[a-zA-Z]{2,}\\z")
    private val ordinaryWords = setOf(
        "A", "AN", "AND", "ARE", "AS", "AT", "BE", "BY", "CAN", "CODE", "COPY", "DO", "FOR", "FROM",
        "HAS", "HERE", "HI", "HOW", "IF", "IN", "IS", "IT", "NOT", "NOW", "OF", "ON", "OR", "OUR",
        "THE", "THIS", "TO", "USE", "WAS", "WE", "WILL", "WITH", "YOU", "YOUR", "ACCOUNT", "ADDRESS",
        "CONFIRM", "CONTACT", "CONTINUE", "DEAR", "EMAIL", "ENTER", "EXAMPLE", "EXPIRES", "HELLO",
        "IGNORE", "INVALID", "MINUTES", "ORDER", "PLEASE", "REGARDS", "REQUEST", "SECURITY", "SIGNIN",
        "SUPPORT", "THANKS", "VERIFY", "WARNING", "WELCOME",
    )

    private data class Candidate(val code: String, val start: Int, val end: Int)

    private fun normalize(value: String): String = Normalizer.normalize(value.take(32_000), Normalizer.Form.NFKC)
        // Soft hyphens, zero-width characters and bidi formatting are not code digits.
        .replace(Regex("[\\u00ad\\u200b-\\u200f\\u202a-\\u202e\\u2060-\\u206f\\ufeff]"), "")
        .replace(Regex("[\\u2010-\\u2015\\u2212]"), "-")
        .replace(Regex("\\r\\n?"), "\n")
        .replace(Regex("[$INLINE_SPACE]+"), " ")
        .replace(Regex("\\n(?: *\\n)+"), "\n")
        // Ignore URLs and email addresses, including codes embedded in query strings.
        // Addresses only start a run of text, so long runs cannot backtrack quadratically.
        .replace(Regex("(?:https?://|www\\.)$NOT_S+|(?<![^\\n$INLINE_SPACE@])[^\\n$INLINE_SPACE@]+@[^\\n$INLINE_SPACE@]+\\.[^\\n$INLINE_SPACE@]+", ignoreCase)) {
            " ".repeat(it.value.length)
        }

    private fun String.slice(start: Int, end: Int) = substring(start.coerceIn(0, length), end.coerceIn(0, length))

    private fun hasBoundaries(text: String, candidate: Candidate): Boolean {
        val before = text.getOrNull(candidate.start - 1)?.toString().orEmpty()
        val separated = !beforeBoundary.containsMatchIn(before) ||
            senderPrefix.containsMatchIn(text.slice(candidate.start - 5, candidate.start))
        return separated && !afterBoundary.containsMatchIn(text.slice(candidate.end, candidate.end + 2))
    }

    private fun isAmountOrCard(text: String, candidate: Candidate) =
        amountAfter.containsMatchIn(text.slice(candidate.end, candidate.end + 8)) ||
            amountOrCardBefore.containsMatchIn(text.slice(candidate.start - 5, candidate.start)) ||
            maskedCard.containsMatchIn(candidate.code)

    private fun hasValidLength(code: String): Boolean {
        if (!ascii.matches(code) || code.none { it in '0'..'9' }) return false
        if (code.length >= 6) return code.length <= 8
        return code.length >= 4 && code.all { it in 'A'..'Z' || it in '0'..'9' }
    }

    private fun isFragment(text: String, value: String, end: Int): Boolean {
        if (number.matches(value)) return !duration.containsMatchIn(text.slice(end, end + 24))
        return value.length <= 4 && ascii.matches(value) && (value.length == 1 || value.uppercase() !in ordinaryWords)
    }

    private fun endsGroup(code: String, next: String, gap: String): Boolean {
        // Short SMS words ("je", "CZK") must never join an adjacent number.
        if (spaces.matches(gap) && ((number.matches(code) && word.matches(next)) || (word.matches(code) && number.matches(next)))) return true
        // Senders prefix codes with their initials, as in G-123456.
        return gap == "-" && code.length <= 3 && code.all { it in 'A'..'Z' } && next.length in 4..8 && number.matches(next)
    }

    private fun candidates(text: String): List<Candidate> {
        val tokens = token.findAll(text).toList()
        val found = mutableListOf<Candidate>()
        fun add(candidate: Candidate) {
            if (!hasValidLength(candidate.code) || candidate.code.uppercase() in ordinaryWords ||
                !hasBoundaries(text, candidate) || isAmountOrCard(text, candidate)) return
            if (nonCodePrefix.containsMatchIn(text.slice(candidate.start - 40, candidate.start))) return
            found += candidate
        }
        var index = 0
        while (index < tokens.size) {
            val first = tokens[index]
            if (!isFragment(text, first.value, first.range.last + 1)) {
                add(Candidate(first.value, first.range.first, first.range.last + 1))
                index++
                continue
            }
            var code = first.value
            var end = first.range.last + 1
            // Reassemble split characters and groups, consuming whole numeric runs.
            while (index + 1 < tokens.size) {
                val next = tokens[index + 1]
                val gap = text.substring(end, next.range.first)
                if (!isFragment(text, next.value, next.range.last + 1) || !separator.matches(gap) || endsGroup(code, next.value, gap)) break
                code += next.value
                end = next.range.last + 1
                index++
            }
            add(Candidate(code, first.range.first, end))
            index++
        }
        return found
    }

    /** Returns the verification code in an SMS, or null when there is none or it is ambiguous. */
    fun extract(message: String): String? {
        val text = normalize(message)
        val contexts = context.findAll(text).map { it.range }.toMutableList()
        if (!promotional.containsMatchIn(text)) {
            contexts += codeWord.findAll(text).map { it.range }
                .filter { !genericExclusion.containsMatchIn(text.slice(it.first - 25, it.first)) }
        }
        // SMS codes always contain a digit, so any code near its context counts.
        val ranked = candidates(text).mapNotNull { candidate ->
            val distance = contexts.minOfOrNull { range ->
                when {
                    candidate.start >= range.last + 1 -> candidate.start - (range.last + 1)
                    candidate.end <= range.first -> range.first - candidate.end
                    else -> Int.MAX_VALUE
                }
            } ?: return@mapNotNull null
            if (distance <= 80) candidate.code to distance else null
        }.sortedBy { it.second }
        val best = ranked.firstOrNull() ?: return null
        val runnerUp = ranked.getOrNull(1)
        if (runnerUp != null && runnerUp.second == best.second && runnerUp.first != best.first) return null
        return best.first
    }
}
