package dev.authier.android

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.work.WorkInfo
import androidx.work.WorkManager

internal sealed interface SmsModelDownloadStatus {
    data object Waiting : SmsModelDownloadStatus
    data class Downloading(val progress: Float) : SmsModelDownloadStatus
    data object Ready : SmsModelDownloadStatus
    data object Failed : SmsModelDownloadStatus
}

@Composable
internal fun SmsModelDownloadStatus(demo: Boolean) {
    val context = LocalContext.current
    if (demo) {
        SmsModelDownloadNotice(SmsModelDownloadStatus.Downloading(0.45f)) {}
        return
    }
    val manager = remember(context) { WorkManager.getInstance(context) }
    val work by remember(manager) { manager.getWorkInfosForUniqueWorkFlow(SmsModelDownload.WORK) }.collectAsState(emptyList())
    val current = work.firstOrNull { !it.state.isFinished } ?: work.firstOrNull()
    val status = when {
        SmsModelDownload.files(context).readyDirectory() != null -> SmsModelDownloadStatus.Ready
        current?.state == WorkInfo.State.FAILED || current?.state == WorkInfo.State.CANCELLED -> SmsModelDownloadStatus.Failed
        current?.state == WorkInfo.State.RUNNING -> {
            val total = current.progress.getLong(SmsModelDownload.TOTAL, 0)
            val bytes = current.progress.getLong(SmsModelDownload.BYTES, 0)
            SmsModelDownloadStatus.Downloading(if (total > 0) bytes.toFloat() / total else 0f)
        }
        else -> SmsModelDownloadStatus.Waiting
    }
    SmsModelDownloadNotice(status) { SmsModelDownload.ensure(context) }
}

@Composable
internal fun SmsModelDownloadNotice(status: SmsModelDownloadStatus, retry: () -> Unit) {
    Column {
        val message = when (status) {
            SmsModelDownloadStatus.Waiting -> "Additional languages: waiting to download (145 MB). Familiar SMS formats already work."
            is SmsModelDownloadStatus.Downloading -> "Downloading additional languages · ${(status.progress.coerceIn(0f, 1f) * 100).toInt()}%. Familiar SMS formats already work."
            SmsModelDownloadStatus.Ready -> "Additional languages ready. Messages are processed on this phone."
            SmsModelDownloadStatus.Failed -> "Additional languages could not be downloaded. Familiar SMS formats still work."
        }
        Text(message, color = Muted, style = MaterialTheme.typography.bodySmall)
        if (status is SmsModelDownloadStatus.Downloading)
            LinearProgressIndicator(progress = { status.progress.coerceIn(0f, 1f) }, modifier = Modifier.fillMaxWidth())
        if (status == SmsModelDownloadStatus.Failed) TextButton(retry) { Text("Retry download") }
    }
}
