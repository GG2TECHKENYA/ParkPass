import React, { useState, useEffect, createContext, useContext } from 'react'
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile
} from 'firebase/auth'
import { 
  getFirestore, 
  doc,
  getDoc,
  setDoc,
  serverTimestamp 
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyA_GXf4y2dZcntDyGvMW0I9saZwi4Ao4AQ",
  authDomain: "parkpass-93ca6.firebaseapp.com",
  projectId: "parkpass-93ca6",
  storageBucket: "parkpass-93ca6.firebasestorage.app",
  messagingSenderId: "201729055832",
  appId: "1:201729055832:web:389bb92099680b14f2be2d"
}

import { initializeApp } from 'firebase/app'
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        const profile = await getUserProfile(user.uid)
        setUserProfile(profile)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const getUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        return userDoc.data()
      }
      return null
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      
      await setDoc(doc(db, 'users', result.user.uid), {
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
        createdAt: serverTimestamp(),
        role: 'user'
      }, { merge: true })
      
      return result.user
    } catch (error) {
      console.error('Google sign-in error:', error)
      throw error
    }
  }

  const signUpWithEmail = async (email, password, displayName) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(result.user, { displayName })
      
      await setDoc(doc(db, 'users', result.user.uid), {
        displayName,
        email,
        createdAt: serverTimestamp(),
        role: 'user'
      })
      
      return result.user
    } catch (error) {
      console.error('Email sign-up error:', error)
      throw error
    }
  }

  const signInWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      return result.user
    } catch (error) {
      console.error('Email sign-in error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUserProfile(null)
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}