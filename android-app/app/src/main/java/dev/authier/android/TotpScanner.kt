package dev.authier.android

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.google.zxing.BarcodeFormat
import com.journeyapps.barcodescanner.BarcodeCallback
import com.journeyapps.barcodescanner.BarcodeResult
import com.journeyapps.barcodescanner.CameraPreview
import com.journeyapps.barcodescanner.DecoratedBarcodeView
import com.journeyapps.barcodescanner.DefaultDecoderFactory

@Composable
fun TotpScanner(onCancel: () -> Unit, onScanned: (SecretContent) -> Unit) {
    val context = LocalContext.current
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    fun hasPermission() = ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
    var permitted by remember { mutableStateOf(hasPermission()) }
    var denied by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val permission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        permitted = granted
        denied = !granted
    }
    DisposableEffect(lifecycle) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) permitted = hasPermission()
        }
        lifecycle.addObserver(observer)
        onDispose { lifecycle.removeObserver(observer) }
    }
    BackHandler(onBack = onCancel)
    Column(Modifier.fillMaxSize().safeDrawingPadding().padding(24.dp), verticalArrangement = Arrangement.spacedBy(18.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Scan QR code", style = MaterialTheme.typography.headlineSmall)
            TextButton(onCancel) { Text("Cancel") }
        }
        Text("Point your camera at the QR code shown when setting up two-factor authentication.", color = Muted)
        if (permitted) {
            QrCamera(Modifier.fillMaxWidth().weight(1f), onError = { error = it }) { scanned ->
                val result = runCatching { TotpProvisioning.parse(scanned) }
                result.fold(onSuccess = onScanned, onFailure = { error = it.message })
                result.isSuccess
            }
        } else {
            Text(if (denied) "Camera access was denied. Allow camera access to scan a QR code, or enter a setup key manually." else "Allow camera access to scan your setup QR code. Images are processed only on this device.")
            Button({ permission.launch(Manifest.permission.CAMERA) }, modifier = Modifier.fillMaxWidth()) { Text("Allow camera access") }
            if (denied) TextButton({
                context.startActivity(Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${context.packageName}")))
            }) { Text("Open app settings") }
            Spacer(Modifier.weight(1f))
        }
        error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        Text("Scanning happens on your device. Review the account before saving it to your encrypted vault.", color = Muted, style = MaterialTheme.typography.bodySmall)
        OutlinedButton(onCancel, modifier = Modifier.fillMaxWidth()) { Text("Enter setup key manually") }
    }
}

@Composable
private fun QrCamera(modifier: Modifier, onError: (String) -> Unit, onCode: (String) -> Boolean) {
    val context = LocalContext.current
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    val currentOnCode by rememberUpdatedState(onCode)
    val currentOnError by rememberUpdatedState(onError)
    val scanner = remember(context) {
        DecoratedBarcodeView(context).apply {
            setStatusText("")
            barcodeView.decoderFactory = DefaultDecoderFactory(listOf(BarcodeFormat.QR_CODE))
        }
    }
    AndroidView(factory = { scanner }, modifier = modifier)
    DisposableEffect(scanner, lifecycle) {
        var accepted = false
        scanner.decodeContinuous(object : BarcodeCallback {
            override fun barcodeResult(result: BarcodeResult) {
                if (!accepted && lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)) {
                    accepted = currentOnCode(result.text ?: return)
                    if (accepted) scanner.pause()
                }
            }
        })
        val cameraState = object : CameraPreview.StateListener {
            override fun previewSized() = Unit
            override fun previewStarted() = Unit
            override fun previewStopped() = Unit
            override fun cameraClosed() = Unit
            override fun cameraError(error: Exception) {
                currentOnError("Unable to open the camera. Close other camera apps and try scanning again, or enter the setup key manually.")
            }
        }
        scanner.barcodeView.addStateListener(cameraState)
        fun resume() {
            if (!accepted && ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) scanner.resume()
        }
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_RESUME -> resume()
                Lifecycle.Event.ON_PAUSE -> scanner.pause()
                else -> Unit
            }
        }
        lifecycle.addObserver(observer)
        if (lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)) resume()
        onDispose {
            lifecycle.removeObserver(observer)
            scanner.barcodeView.stopDecoding()
            scanner.pause()
        }
    }
}
