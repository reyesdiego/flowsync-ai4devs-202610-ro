import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ApiError, apiRequest } from '@/lib/api'
import type { User } from '@/lib/api'
import { useAuth } from '@/lib/auth'

type ProfileState =
  | { status: 'loading' }
  | { status: 'ready'; user: User }
  | { status: 'error'; message: string }

const dateFormatter = new Intl.DateTimeFormat('es', { dateStyle: 'long' })

export function ProfilePage() {
  const { token, logout, clearSession } = useAuth()
  const [state, setState] = useState<ProfileState>({ status: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    apiRequest<User>('/account/profile', { token })
      .then((user) => {
        if (!cancelled) setState({ status: 'ready', user })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        // Expired or revoked token: drop it; ProtectedRoute sends us to /login.
        if (error instanceof ApiError && error.status === 401) {
          clearSession()
          return
        }
        setState({
          status: 'error',
          message:
            error instanceof ApiError && error.status === 0
              ? error.message
              : 'No se pudo cargar tu perfil.',
        })
      })
    return () => {
      cancelled = true
    }
  }, [token, clearSession, reloadKey])

  async function handleLogout() {
    setLoggingOut(true)
    setLogoutError(null)
    try {
      await logout()
    } catch (error) {
      setLogoutError(
        error instanceof ApiError && error.status === 0
          ? error.message
          : 'No se pudo cerrar la sesión. Inténtalo de nuevo.',
      )
      setLoggingOut(false)
    }
  }

  function retry() {
    setState({ status: 'loading' })
    setReloadKey((key) => key + 1)
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Tu perfil</CardTitle>
          <CardDescription>Datos de tu cuenta de FlowSync.</CardDescription>
        </CardHeader>
        <CardContent>
          {state.status === 'loading' && (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          )}
          {state.status === 'error' && (
            <div className="grid gap-3">
              <Alert variant="destructive">
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
              <Button variant="outline" onClick={retry}>
                Reintentar
              </Button>
            </div>
          )}
          {state.status === 'ready' && <ProfileDetails user={state.user} />}
        </CardContent>
        <CardFooter className="flex-col gap-3">
          {logoutError && (
            <Alert variant="destructive">
              <AlertDescription>{logoutError}</AlertDescription>
            </Alert>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}

function ProfileDetails({ user }: { user: User }) {
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <div
          aria-hidden
          className="flex size-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground"
        >
          {user.initials}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">
            {user.fullName ?? 'Sin nombre'}
          </p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Miembro desde {dateFormatter.format(new Date(user.createdAt))}
      </p>
    </div>
  )
}
