import browser from 'webextension-polyfill'
import { device } from './ExtensionDevice'
import { PENDING_SECRET_PREFIX } from './pendingSecrets'

const alarmName = 'sync-pending-secrets'
const retry = () => {
  void device.state?.flushPendingSecrets().catch(() => {
    // Offline, authorization, and quota failures retain the encrypted queue.
    // The vault status remains pending until a server acknowledgement arrives.
  })
}

export async function initializePendingSecretSync() {
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === alarmName) retry()
  })
  browser.storage.onChanged.addListener((changes, area) => {
    if (
      area === 'local' &&
      Object.keys(changes).some(
        (key) => key.startsWith(PENDING_SECRET_PREFIX) && changes[key].newValue
      )
    )
      retry()
    if (
      area === 'session' &&
      changes.backgroundState?.newValue &&
      !changes.backgroundState.oldValue
    )
      retry()
  })
  // Alarms survive closing every extension page and wake an idle MV3 worker.
  await browser.alarms.create(alarmName, { periodInMinutes: 1 })
  device.onInitDone(retry)
}
