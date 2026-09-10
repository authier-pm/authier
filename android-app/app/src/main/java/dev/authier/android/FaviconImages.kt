package dev.authier.android

import android.content.Context
import coil.ImageLoader
import coil.decode.SvgDecoder
import coil.memory.MemoryCache
import coil.request.CachePolicy
import okhttp3.Dispatcher
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit

/** A single, bounded loader for visible vault icons, separate from the authenticated API client. */
internal object FaviconImages {
    private var loader: ImageLoader? = null

    @Synchronized
    fun get(context: Context): ImageLoader = loader ?: create(context.applicationContext).also { loader = it }

    fun create(context: Context): ImageLoader = ImageLoader.Builder(context.applicationContext)
        .memoryCache { MemoryCache.Builder(context).maxSizeBytes(4 * 1024 * 1024).build() }
        // Avoid persisting a plaintext history of vault websites in image-cache metadata.
        .diskCachePolicy(CachePolicy.DISABLED)
        .diskCache(null)
        .components { add(SvgDecoder.Factory()) }
        .okHttpClient {
            OkHttpClient.Builder()
                .dispatcher(Dispatcher().apply { maxRequests = 4; maxRequestsPerHost = 2 })
                .connectTimeout(5, TimeUnit.SECONDS)
                .callTimeout(10, TimeUnit.SECONDS)
                .build()
        }
        .build()
}
