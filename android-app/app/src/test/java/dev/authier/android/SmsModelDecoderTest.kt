package dev.authier.android

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class SmsModelDecoderTest {
    @Test fun `normalizes decimal digits and invisible separators without losing case`() {
        assertEquals("Ab012345-67\n", SmsModelDecoder.normalize("Ab０١٢٣٤٥–6\u200b7\r\n"))
    }

    @Test fun `converts UTF8 offsets including supplementary characters to Kotlin indices`() {
        val text = "🔐 输入1234。"
        val prefix = "🔐 输入"
        val offset = prefix.toByteArray().size
        val tokens = SmsModelDecoder.tokens(text, intArrayOf(0, 4, 5, 2), intArrayOf(0, 0, offset, text.toByteArray().size))
        assertEquals(prefix.length, tokens[2].start)
        assertEquals(text.length, tokens[2].end)
    }

    @Test fun `trims punctuation and preserves leading zeroes`() {
        val text = "输入001234。"
        val tokens = listOf(SmsToken(0, 0, 0), SmsToken(4, 0, 2), SmsToken(5, 2, text.length), SmsToken(2, 0, 0))
        val result = SmsModelDecoder.decode(text, tokens, floatArrayOf(0f, -10f, 10f, -10f), floatArrayOf(0f, -10f, 10f, -10f), floatArrayOf(0f, 0f, 9f, 0f))
        assertEquals("001234", result.code)
        assertEquals(9.0, result.score, 0.0)
    }

    @Test fun `multipart windows overlap and oversized texts abstain rather than truncate`() {
        fun tokens(count: Int) = listOf(SmsToken(0, 0, 0)) + List(count) { SmsToken(4, it, it + 1) } + SmsToken(2, 0, 0)
        val windows = SmsModelDecoder.windows(tokens(300))
        assertEquals(2, windows.size)
        assertEquals(windows[0][127], windows[1][1])
        assertEquals(300, windows.last()[windows.last().lastIndex - 1].end)
        assertTrue(SmsModelDecoder.windows(tokens(2000)).isEmpty())
    }
}
