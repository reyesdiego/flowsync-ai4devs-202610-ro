import { ApiError } from '@/lib/api'

export type FormErrors = {
  /** Error not tied to a single field, shown in an alert above the form. */
  form?: string
  fields: Record<string, string>
}

const GENERIC_ERROR = 'Algo salió mal. Inténtalo de nuevo.'

/** Spanish messages for the VineJS rules used in `backend/app/validators/user.ts`. */
function fieldMessage(
  field: string,
  rule: string | undefined,
  fallback: string,
) {
  switch (rule) {
    case 'required':
      return 'Este campo es obligatorio.'
    case 'email':
      return 'Introduce un email válido.'
    case 'database.unique':
      return field === 'email'
        ? 'Ya existe una cuenta con ese email.'
        : fallback
    case 'minLength':
      return 'Debe tener al menos 8 caracteres.'
    case 'maxLength':
      return field === 'email'
        ? 'El email es demasiado largo.'
        : 'Debe tener como máximo 32 caracteres.'
    case 'sameAs':
      return 'Las contraseñas no coinciden.'
    default:
      return fallback
  }
}

/**
 * Turns whatever a request threw into messages the forms can display.
 * `messagesByStatus` overrides the form-level message for specific statuses
 * (e.g. 400 on login means invalid credentials).
 */
export function toFormErrors(
  error: unknown,
  messagesByStatus: Record<number, string> = {},
): FormErrors {
  if (!(error instanceof ApiError)) return { form: GENERIC_ERROR, fields: {} }

  if (messagesByStatus[error.status]) {
    return { form: messagesByStatus[error.status], fields: {} }
  }

  if (error.status === 0) return { form: error.message, fields: {} }

  if (error.status === 422) {
    const fields: Record<string, string> = {}
    for (const { field, rule, message } of error.errors) {
      if (field && !fields[field])
        fields[field] = fieldMessage(field, rule, message)
    }
    if (Object.keys(fields).length > 0) return { fields }
  }

  return { form: GENERIC_ERROR, fields: {} }
}
