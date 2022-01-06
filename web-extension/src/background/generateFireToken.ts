import { initializeApp } from 'firebase/app'
import { getMessaging, getToken } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: 'AIzaSyBkBIcE71acyLg1yMNJwn3Ys_CxbY5gt7U',
  authDomain: 'authier-bc184.firebaseapp.com',
  projectId: 'authier-bc184',
  storageBucket: 'authier-bc184.appspot.com',
  messagingSenderId: '500382892914',
  appId: '1:500382892914:web:6b202f90d6c0c6bcc213eb',
  measurementId: 'G-0W2MW55WVF'
}

const firebaseApp = initializeApp(firebaseConfig)
export const messaging = getMessaging(firebaseApp)

// export function setLockTime(val: number) {
//   log('setLockTime', val)
//   if (typeof val !== 'number') {
//     throw new Error('setLockTime must have a number value')
//   }
//   lockTime = val
// }
// broadcast.onmessage = (event) => {
//   if (event.data.data.success === 'true') {
//     log('sec', typeof otpCode)
//     let a = executeScriptInCurrentTab(
//       `const OTP = ${otpCode};` + `(` + fillInput.toString() + `)()`
//     )
//   }
// }

export async function generateFireToken() {
  return await getToken(messaging, {
    vapidKey:
      'BPxh_JmX3cR4Cb6lCYon2cC0iAVlv8dOL1pjX2Q33ROT0VILKuGAlTqG1uH8YZXQRCscLlxqct0XeTiUvF4sy4A'
  })
}
