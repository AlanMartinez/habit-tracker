import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { auth } from './firebase'

const googleProvider = new GoogleAuthProvider()

export const signInWithGoogle = async (): Promise<User> => {
  const result = await signInWithPopup(auth, googleProvider)
  return result.user
}

export const signOutCurrentUser = async (): Promise<void> => {
  await signOut(auth)
}

export const subscribeToAuthChanges = (
  callback: (user: User | null) => void,
): (() => void) => onAuthStateChanged(auth, callback)
