import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { isApiError } from '@/shared/domain/apiError'

export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fieldNames: readonly Path<T>[],
): boolean {
  if (!isApiError(error)) return false
  let applied = false
  for (const [field, message] of Object.entries(error.fields)) {
    const name = fieldNames.find((candidate) => candidate === field)
    if (!name) continue
    setError(name, { type: 'server', message }, { shouldFocus: !applied })
    applied = true
  }
  return applied
}
