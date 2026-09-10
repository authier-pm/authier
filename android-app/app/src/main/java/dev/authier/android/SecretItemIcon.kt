package dev.authier.android

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.InsertDriveFile
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.material3.Icon
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import coil.ImageLoader
import coil.compose.AsyncImage
import coil.request.ImageRequest

@Composable
internal fun SecretItemIcon(content: SecretContent, imageLoader: ImageLoader = FaviconImages.get(LocalContext.current)) {
    val context = LocalContext.current
    val pixels = with(LocalDensity.current) { 32.dp.roundToPx() }
    val source = remember(content.iconUrl, content.url) { resolveFavicon(content.iconUrl, content.url) }
    val request = remember(source, pixels, context) {
        val data = when (source) {
            is FaviconSource.Remote -> source.url
            is FaviconSource.Embedded -> source.bytes
            null -> null
        }
        ImageRequest.Builder(context).data(data).size(pixels).build()
    }
    var loaded by remember(source) { mutableStateOf(false) }
    Box(Modifier.size(44.dp).background(Color(0xFFF0F3F2), RoundedCornerShape(12.dp)), contentAlignment = Alignment.Center) {
        if (!loaded) Icon(Icons.Outlined.InsertDriveFile, contentDescription = null, tint = Muted, modifier = Modifier.size(28.dp))
        // Created only for composed LazyColumn rows; Coil cancels requests when a row leaves composition.
        AsyncImage(model = request, imageLoader = imageLoader, contentDescription = null,
            onLoading = { loaded = false }, onSuccess = { loaded = true }, onError = { loaded = false },
            modifier = Modifier.size(32.dp), contentScale = ContentScale.Fit)
    }
}
