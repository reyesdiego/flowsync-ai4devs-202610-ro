import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthLayout } from '@/components/auth-layout'
import { FormField } from '@/components/form-field'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { toFormErrors } from '@/lib/errors'
import type { FormErrors } from '@/lib/errors'

export function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [errors, setErrors] = useState<FormErrors>({ fields: {} })
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (password !== passwordConfirmation) {
      setErrors({
        fields: { passwordConfirmation: 'Las contraseñas no coinciden.' },
      })
      return
    }

    setSubmitting(true)
    setErrors({ fields: {} })
    try {
      // The backend requires the `fullName` key; it accepts null when empty.
      await signup({
        fullName: fullName.trim() || null,
        email: email.trim(),
        password,
        passwordConfirmation,
      })
      navigate('/profile', { replace: true })
    } catch (error) {
      setErrors(toFormErrors(error))
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Crea tu cuenta"
      description="Regístrate para empezar a usar FlowSync."
      footer={
        <p>
          ¿Ya tienes cuenta?{' '}
          <Link
            to="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Inicia sesión
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        {errors.form && (
          <Alert variant="destructive">
            <AlertDescription>{errors.form}</AlertDescription>
          </Alert>
        )}
        <FormField
          id="fullName"
          label="Nombre completo (opcional)"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={errors.fields.fullName}
        />
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.fields.email}
        />
        <FormField
          id="password"
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={32}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.fields.password}
        />
        <FormField
          id="passwordConfirmation"
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={32}
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          error={errors.fields.passwordConfirmation}
        />
        <p className="-mt-2 text-xs text-muted-foreground">
          Entre 8 y 32 caracteres.
        </p>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>
      </form>
    </AuthLayout>
  )
}
