import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const requiredConfig = Object.entries(firebaseConfig).filter(([, value]) => !value)
if (requiredConfig.length > 0) {
  const missing = requiredConfig.map(([key]) => key).join(', ')
  throw new Error(`Missing Firebase configuration values: ${missing}`)
}

const app = initializeApp(firebaseConfig)
export const firebaseAuth = getAuth(app)

const googleProvider = new GoogleAuthProvider()

googleProvider.setCustomParameters({
  prompt: 'select_account',
})

export async function signInWithGoogle() {
  await signInWithRedirect(firebaseAuth, googleProvider)
}

export async function getGoogleRedirectResult() {
  const result = await getRedirectResult(firebaseAuth)
  return result ? result.user.getIdToken() : null
}
