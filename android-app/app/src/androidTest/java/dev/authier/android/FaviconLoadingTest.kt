package dev.authier.android

import android.content.Context
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.unit.dp
import androidx.test.core.app.ApplicationProvider
import coil.EventListener
import coil.ImageLoader
import coil.request.ImageRequest
import coil.request.SuccessResult
import coil.request.ErrorResult
import android.graphics.Bitmap
import java.io.ByteArrayOutputStream
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import okhttp3.mockwebserver.Dispatcher
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import okhttp3.mockwebserver.RecordedRequest
import okio.Buffer
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import java.util.concurrent.CopyOnWriteArrayList

class FaviconLoadingTest {
    @get:Rule val compose = createComposeRule()
    private val server = MockWebServer()
    private val requested = CopyOnWriteArrayList<String>()
    private val failures = CopyOnWriteArrayList<String>()
    private val loaded = CopyOnWriteArrayList<String>()
    private lateinit var loader: ImageLoader

    @Before fun setup() {
        val bitmap = Bitmap.createBitmap(32, 32, Bitmap.Config.ARGB_8888)
        bitmap.eraseColor(android.graphics.Color.GREEN)
        val png = ByteArrayOutputStream().use { output ->
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, output)
            output.toByteArray()
        }
        bitmap.recycle()
        server.dispatcher = object : Dispatcher() {
            override fun dispatch(request: RecordedRequest): MockResponse {
                requested.add(requireNotNull(request.path))
                return MockResponse().setHeader("Content-Type", "image/png").setBody(Buffer().write(png))
            }
        }
        server.start()
        val context = ApplicationProvider.getApplicationContext<Context>()
        loader = FaviconImages.create(context).newBuilder().eventListener(object : EventListener {
            override fun onError(request: ImageRequest, result: ErrorResult) {
                failures.add(result.throwable.stackTraceToString())
            }
            override fun onSuccess(request: ImageRequest, result: SuccessResult) {
                loaded.add(request.data.toString())
            }
        }).build()
    }

    @After fun cleanup() { loader.shutdown(); server.shutdown() }

    @Test fun onlyNearbyRowsFetchAndScrollingBackUsesMemoryCache() {
        lateinit var state: LazyListState
        lateinit var scope: CoroutineScope
        val entries = (0 until 1000).map { index ->
            SecretContent(label = "Item $index", iconUrl = server.url("/$index.png").toString())
        }
        compose.setContent {
            state = rememberLazyListState()
            scope = rememberCoroutineScope()
            AuthierTheme {
                LazyColumn(state = state, modifier = Modifier.height(176.dp)) {
                    items(entries, key = { it.label }) { content ->
                        SecretItemIcon(content, loader)
                    }
                }
            }
        }
        compose.waitUntil(10_000) { failures.isNotEmpty() || loaded.any { it.endsWith("/0.png") } }
        assertTrue("Image load failed: ${failures.joinToString()}", failures.isEmpty())
        compose.waitForIdle()
        assertTrue("Only composed rows may fetch", requested.size <= 10)
        assertFalse(requested.contains("/80.png"))
        compose.runOnIdle { scope.launch { state.scrollToItem(80) } }
        compose.waitUntil(10_000) { loaded.any { it.endsWith("/80.png") } }
        compose.runOnIdle { scope.launch { state.scrollToItem(0) } }
        compose.waitUntil(10_000) { loaded.count { it.endsWith("/0.png") } >= 2 }
        assertEquals("Returning to a cached icon must not refetch it", 1, requested.count { it == "/0.png" })
        assertTrue("Scrolling must not fetch the whole vault", requested.size <= 20)
        assertNull(loader.diskCache)
        assertTrue(requireNotNull(loader.memoryCache).maxSize <= 4 * 1024 * 1024)
    }
}
