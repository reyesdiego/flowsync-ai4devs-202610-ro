import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { apiRequest } from '@/lib/api'
import type { Session } from '@/lib/api'

const TOKEN_KEY = 'flowsync.token'

export type SignupInput = {
  fullName: string | null
  email: string
  password: string
  passwordConfirmation: string
}

type AuthContextValue = {
  token: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (input: SignupInput) => Promise<void>
  logout: () => Promise<void>
  /** Drops the local session without calling the API (e.g. after a 401). */
  clearSession: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function storeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Storage unavailable (private mode): the session lives only in memory.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(readStoredToken)

  const startSession = useCallback((session: Session) => {
    storeToken(session.token)
    setToken(session.token)
  }, [])

  const clearSession = useCallback(() => {
    storeToken(null)
    setToken(null)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      startSession(
        await apiRequest<Session>('/auth/login', {
          method: 'POST',
          body: { email, password },
        }),
      )
    },
    [startSession],
  )

  const signup = useCallback(
    async (input: SignupInput) => {
      startSession(
        await apiRequest<Session>('/auth/signup', {
          method: 'POST',
          body: input,
        }),
      )
    },
    [startSession],
  )

  const logout = useCallback(async () => {
    try {
      await apiRequest('/account/logout', { method: 'POST', token })
    } catch {
      // The token may already be invalid; the local session is dropped anyway.
    } finally {
      clearSession()
    }
  }, [token, clearSession])

  const value = useMemo(
    () => ({ token, login, signup, logout, clearSession }),
    [token, login, signup, logout, clearSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// The hook lives next to its provider; fast refresh falls back to a full reload here.
// oxlint-disable-next-line react/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
