import { log } from 'console'
import type { ServiceAccount } from 'firebase-admin'
import firebase from 'firebase-admin'
import type { Message } from 'firebase-admin/messaging'

import { db } from '../prisma/prismaClient'
import { sendEmail } from '../utils/email'
const { FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL } =
  process.env as {
    FIREBASE_PROJECT_ID: string
    FIREBASE_PRIVATE_KEY: string
    FIREBASE_CLIENT_EMAIL: string
  }

const adminConfig: ServiceAccount = {
  projectId: FIREBASE_PROJECT_ID,
  privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  clientEmail: FIREBASE_CLIENT_EMAIL
}

export const firebaseAdmin = firebase.initializeApp({
  credential: firebase.credential.cert(adminConfig)
})

export async function firebaseSendNotification(msg: Message) {
  try {
    await firebaseAdmin.messaging().send(msg)
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.match(/Requested entity was not found/) &&
      'token' in msg
    ) {
      log('device not found, deleting master device')

      const msgToken = (msg as { token: string }).token

      // Find the device by firebase token
      const device = await db.query.device.findFirst({
        where: { firebaseToken: msgToken }
      })

      if (!device) {
        throw new Error(`Device not found for firebase token ${msgToken}`)
      }

      // Find the user whose masterDeviceId matches this device
      const user = await db.query.user.findFirst({
        where: { masterDeviceId: device.id }
      })

      if (!user) {
        throw new Error(`User not found for firebase token ${msgToken}`)
      }

      if (user.email) {
        await sendEmail(user.email, {
          Subject: 'Master device change required',
          TextPart: 'Your device has been deleted',
          HTMLPart: `<p>Your device ${device.name} is no longer reachable via firebase cloud messaging. 
          You need to make another device your master device. To confirm making your latest device your master device, please click <a href="${process.env.FRONTEND_URL}/confirm-master-device?token=${device.id}">here</a></p>` // TODO add this route on FE
        })
      }
    } else {
      throw err
    }
  }
}
