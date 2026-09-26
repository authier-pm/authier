import { firebaseSendNotification } from './firebaseAdmin'

export type PushDeliveryCounts = {
  pushNotificationsSentCount: number
  pushNotificationsFailedCount: number
}

export const sendNewDeviceLoginPushNotifications = async (
  firebaseTokens: string[],
  notificationBody: string
): Promise<PushDeliveryCounts> => {
  const results = await Promise.allSettled(
    firebaseTokens.map((firebaseToken) => {
      return firebaseSendNotification({
        token: firebaseToken,
        notification: {
          title: 'New device login!',
          body: notificationBody
        },
        data: {
          type: 'Devices'
        },
        android: {
          priority: 'high'
        },
        apns: {
          payload: {
            aps: {
              contentAvailable: true,
              priority: 10
            }
          }
        }
      })
    })
  )

  let pushNotificationsSentCount = 0
  let pushNotificationsFailedCount = 0

  for (const result of results) {
    if (result.status === 'rejected') {
      pushNotificationsFailedCount += 1
      continue
    }

    if (result.value.ok) {
      pushNotificationsSentCount += 1
    } else {
      pushNotificationsFailedCount += 1
    }
  }

  return {
    pushNotificationsSentCount,
    pushNotificationsFailedCount
  }
}
