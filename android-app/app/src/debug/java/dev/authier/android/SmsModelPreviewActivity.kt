package dev.authier.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

/** Only synthetic download states; no vault access, download or SMS permissions. */
class SmsModelPreviewActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AuthierTheme {
                Surface(Modifier.fillMaxSize(), color = Canvas) {
                    Column(Modifier.safeDrawingPadding().padding(24.dp), verticalArrangement = Arrangement.spacedBy(28.dp)) {
                        Text("SMS codes to browsers", style = MaterialTheme.typography.headlineMedium)
                        Text("Send verification codes to your browser while your vault is unlocked. Other messages never leave this phone.", color = Muted)
                        SettingSection("DOWNLOADING", "A one-time 145 MB download adds support for more languages and SMS formats.") {
                            SmsModelDownloadNotice(SmsModelDownloadStatus.Downloading(0.45f)) {}
                        }
                        SettingSection("READY", "Extraction works offline after the download.") {
                            SmsModelDownloadNotice(SmsModelDownloadStatus.Ready) {}
                        }
                        SettingSection("DOWNLOAD INTERRUPTED", "Existing SMS templates remain available.") {
                            SmsModelDownloadNotice(SmsModelDownloadStatus.Failed) {}
                        }
                    }
                }
            }
        }
    }
}
