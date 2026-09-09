package dev.authier.android

import android.os.Bundle
import android.view.MotionEvent
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle

class MainActivity : ComponentActivity() {
    private val model: VaultViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(statusBarStyle = SystemBarStyle.dark(android.graphics.Color.TRANSPARENT), navigationBarStyle = SystemBarStyle.dark(android.graphics.Color.TRANSPARENT))
        if (!(BuildConfig.DEBUG && intent.getBooleanExtra("demo", false))) window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
        if (BuildConfig.DEBUG && intent.getBooleanExtra("demo", false)) model.demo()
        setContent { AuthierTheme { AuthierApp(model) } }
    }

    override fun onPause() { model.lock(); super.onPause() }
    override fun dispatchTouchEvent(event: MotionEvent): Boolean { model.touch(); return super.dispatchTouchEvent(event) }
    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) clearExpiredClipboard(this)
    }
}

@Composable
fun AuthierApp(model: VaultViewModel) {
    val state by model.ui.collectAsStateWithLifecycle()
    var tab by remember { mutableIntStateOf(0) }
    Scaffold(containerColor = Canvas, bottomBar = {
        if (state.unlocked) NavigationBar(containerColor = Canvas, tonalElevation = 0.dp) {
            listOf("Vault" to Icons.Outlined.GridView, "Devices" to Icons.Outlined.Devices, "Settings" to Icons.Outlined.Tune).forEachIndexed { index, (label, icon) ->
                NavigationBarItem(selected = tab == index, onClick = { tab = index; if (index > 0) model.loadDevices() }, icon = { Icon(icon, label) }, label = { Text(label) }, colors = NavigationBarItemDefaults.colors(indicatorColor = Mint.copy(alpha = .12f), selectedIconColor = Mint, selectedTextColor = Mint, unselectedIconColor = Muted, unselectedTextColor = Muted))
            }
        }
    }) { padding ->
        Column(Modifier.fillMaxSize().padding(padding)) {
            if (state.busy) LinearProgressIndicator(Modifier.fillMaxWidth(), color = Mint, trackColor = Panel)
            if (state.error != null || state.notice != null) MessageBanner(state.error ?: state.notice.orEmpty(), state.error != null, model::clearMessage, state.errorDetails)
            if (!state.unlocked) key(state.lockGeneration) { AuthScreen(state, model) }
            else when (tab) {
                0 -> VaultScreen(state, model)
                1 -> DevicesScreen(state, model)
                else -> SettingsScreen(state, model)
            }
        }
    }
}
