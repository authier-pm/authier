import { initializeApp } from 'firebase/app'
import { getMessaging, getToken } from 'firebase/messaging'
import browser from 'webextension-polyfill'

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

export async function generateFireToken() {
  const existingToken = await browser.storage.local.get('fireToken')
  if (existingToken.fireToken) {
    console.debug('Token already exists:', existingToken.fireToken)
    return existingToken.fireToken
  }
  const token = await getToken(messaging, {
    vapidKey:
      'BPxh_JmX3cR4Cb6lCYon2cC0iAVlv8dOL1pjX2Q33ROT0VILKuGAlTqG1uH8YZXQRCscLlxqct0XeTiUvF4sy4A'
  })

  console.log('Firebase Token generated:', token)
  await browser.storage.local.set({ fireToken: token })

  return token
}
