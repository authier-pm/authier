package dev.authier.android

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val Mint = Color(0xFFAFF4C6)
val Canvas = Color(0xFF101923)
val Panel = Color(0xFF192531)
val Muted = Color(0xFF91A1B2)
val Border = Color(0xFF2B3946)

@Composable
fun AuthierTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = darkColorScheme(primary = Mint, onPrimary = Canvas, background = Canvas,
        surface = Canvas, surfaceVariant = Panel, onSurface = Color(0xFFF4F7F9), onSurfaceVariant = Muted,
        outline = Border, secondary = Mint, error = Color(0xFFFFB4AB)), content = content)
}
