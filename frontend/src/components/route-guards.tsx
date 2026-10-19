import { Navigate, Outlet } from 'react-router'
import { useAuth } from '@/lib/auth'

/** Only reachable with a session; otherwise sends the user to login. */
export function ProtectedRoute() {
  const { token } = useAuth()
  return token ? <Outlet /> : <Navigate to="/login" replace />
}

/** Login and signup: a user who already has a session goes to their profile. */
export function GuestRoute() {
  const { token } = useAuth()
  return token ? <Navigate to="/profile" replace /> : <Outlet />
}
