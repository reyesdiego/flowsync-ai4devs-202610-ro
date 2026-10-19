export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

export type User = {
  id: number
  fullName: string | null
  email: string
  createdAt: string
  updatedAt: string | null
  initials: string
}

export type Session = { user: User; token: string }

/** One entry of the `{ errors: [...] }` body AdonisJS returns on failure. */
export type ApiFieldError = {
  message: string
  rule?: string
  field?: string
}

export class ApiError extends Error {
  status: number
  errors: ApiFieldError[]

  constructor(status: number, errors: ApiFieldError[], message?: string) {
    super(message ?? errors[0]?.message ?? `HTTP ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST'
  body?: unknown
  token?: string | null
}

/**
 * Calls the FlowSync API and returns the unwrapped `data` payload.
 * Throws `ApiError` for non-2xx responses and network failures (status 0).
 */
export async function apiRequest<T>(
  path: string,
  { method = 'GET', body, token }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${API_URL}/api/v1${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(
      0,
      [],
      'No se pudo conectar con el servidor. Inténtalo de nuevo en unos segundos.',
    )
  }

  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const errors =
      payload && typeof payload === 'object' && 'errors' in payload
        ? (payload.errors as ApiFieldError[])
        : []
    throw new ApiError(response.status, Array.isArray(errors) ? errors : [])
  }

  return (payload as { data: T }).data
}
