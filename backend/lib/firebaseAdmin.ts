import firebase, { ServiceAccount } from 'firebase-admin'

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
