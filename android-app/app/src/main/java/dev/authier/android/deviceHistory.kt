package dev.authier.android

import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.util.Locale

internal enum class DeviceSortOrder(val label: String, private val byAdded: Boolean, private val newestFirst: Boolean) {
    LAST_SYNC_NEWEST("Last synced · newest first", false, true),
    LAST_SYNC_OLDEST("Last synced · oldest first", false, false),
    ADDED_NEWEST("Added · newest first", true, true),
    ADDED_OLDEST("Added · oldest first", true, false);

    fun sort(devices: List<DeviceInfo>): List<DeviceInfo> {
        val dateOrder = if (newestFirst) reverseOrder<Instant>() else naturalOrder<Instant>()
        return devices.sortedWith(compareBy<DeviceInfo, Instant?>(nullsLast(dateOrder)) { device ->
            val timestamp = if (byAdded) device.createdAt else device.lastSyncAt
            timestamp?.let(Instant::parse)
        }.thenBy { it.id })
    }
}

internal fun formatDeviceTimestamp(
    timestamp: String,
    locale: Locale = Locale.getDefault(),
    zone: ZoneId = ZoneId.systemDefault(),
): String = DateTimeFormatter.ofLocalizedDateTime(FormatStyle.MEDIUM, FormatStyle.SHORT)
    .withLocale(locale).withZone(zone).format(Instant.parse(timestamp))
