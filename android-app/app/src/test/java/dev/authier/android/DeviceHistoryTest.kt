package dev.authier.android

import java.time.ZoneId
import java.util.Locale
import org.junit.Assert.assertEquals
import org.junit.Test

class DeviceHistoryTest {
    private val devices = listOf(
        DeviceInfo("never", "Tablet", "Android", "2026-10-13T08:00:00Z", null, false),
        DeviceInfo("older", "Browser", "Browser", "2026-10-12T08:00:00Z", "2026-10-13T10:00:00+02:00", false),
        DeviceInfo("newer", "Phone", "Android", "2026-09-01T08:00:00Z", "2026-10-13T08:30:00Z", true),
    )

    @Test fun `sorts sync instants across time zones and puts never synced last in both directions`() {
        assertEquals(listOf("newer", "older", "never"), DeviceSortOrder.LAST_SYNC_NEWEST.sort(devices).map { it.id })
        assertEquals(listOf("older", "newer", "never"), DeviceSortOrder.LAST_SYNC_OLDEST.sort(devices).map { it.id })
    }

    @Test fun `sorts added dates independently of sync history`() {
        assertEquals(listOf("never", "older", "newer"), DeviceSortOrder.ADDED_NEWEST.sort(devices).map { it.id })
        assertEquals(listOf("newer", "older", "never"), DeviceSortOrder.ADDED_OLDEST.sort(devices).map { it.id })
    }

    @Test fun `equal timestamps keep a deterministic order after a refresh`() {
        val tied = devices.map { it.copy(lastSyncAt = "2026-10-13T08:00:00Z") }
        for (order in listOf(DeviceSortOrder.LAST_SYNC_NEWEST, DeviceSortOrder.LAST_SYNC_OLDEST)) {
            assertEquals(order.sort(tied), order.sort(tied.reversed()))
        }
        assertEquals(emptyList<DeviceInfo>(), DeviceSortOrder.ADDED_NEWEST.sort(emptyList()))
    }

    @Test fun `displays the timestamp in the users locale and time zone`() {
        assertEquals("Oct 13, 2026, 10:42 AM", formatDeviceTimestamp("2026-10-13T08:42:00Z", Locale.US, ZoneId.of("Europe/Prague")))
        assertEquals("13. 10. 2026 10:42", formatDeviceTimestamp("2026-10-13T08:42:00Z", Locale.forLanguageTag("cs-CZ"), ZoneId.of("Europe/Prague")))
    }
}
