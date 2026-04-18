import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { signOut } from 'firebase/auth'
import { authApi } from '../api'
import { firebaseAuth, signInWithGooglePopup } from '../lib/firebase-auth'
import type { AuthUser, UserRole } from '../types/auth'

interface AuthContextValue {
  user: AuthUser | null
  role: UserRole | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  loginWithGoogle: () => Promise<AuthUser>
  register: (fullName: string, email: string, phone: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)
const SESSION_TOKEN_MARKER = 'cookie_session'

function normalizeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data
    const message =
      typeof responseData?.message === 'string'
        ? responseData.message
        : typeof responseData === 'string'
          ? responseData
          : error.message
    return `HTTP ${error.response?.status ?? 'ERR'}: ${message}`
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unexpected error'
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSession = async () => {
    try {
      const response = await authApi.me()
      setUser(response.data)
      setToken(SESSION_TOKEN_MARKER)
    } catch {
      setUser(null)
      setToken(null)
    }
  }

  useEffect(() => {
    let mounted = true

    const bootstrap = async () => {
      try {
        const response = await authApi.me()
        if (mounted) {
          setToken(SESSION_TOKEN_MARKER)
          setUser(response.data)
        }
      } catch {
        if (mounted) {
          setUser(null)
          setToken(null)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    bootstrap()

    return () => {
      mounted = false
    }
  }, [])

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password })
    const token = response.data.token
    if (token) {
      localStorage.setItem('resto_token', token)
    }
    
    try {
      const meResponse = await authApi.me()
      setToken(SESSION_TOKEN_MARKER)
      setUser(meResponse.data)
      return meResponse.data
    } catch (error) {
      throw new Error(normalizeError(error))
    }
  }

  const loginWithGoogle = async () => {
    const firebaseIdToken = await signInWithGooglePopup()
    localStorage.setItem('resto_token', firebaseIdToken) // Store the token!
    await authApi.firebaseLogin({ token: firebaseIdToken })

    try {
      const meResponse = await authApi.me()
      setToken(SESSION_TOKEN_MARKER)
      setUser(meResponse.data)
      return meResponse.data
    } catch (error) {
      throw new Error(normalizeError(error))
    }
  }

  const register = async (fullName: string, email: string, phone: string, password: string) => {
    await authApi.register({ fullName, email, phone: phone.trim() || undefined, password })
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      localStorage.removeItem('resto_token') // Clear the token!
      setUser(null)
      setToken(null)
      await signOut(firebaseAuth).catch(() => undefined)
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      token,
      isAuthenticated: !!user,
      isLoading,
      login,
      loginWithGoogle,
      register,
      logout,
      refreshSession,
    }),
    [isLoading, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
