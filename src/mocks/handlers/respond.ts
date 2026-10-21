import { HttpResponse, type JsonBodyType } from 'msw'
import type { ZodError, ZodType } from 'zod'
import type { ApiErrorBody, ApiErrorCode } from '@/shared/contracts/error'

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  extra: { fields?: Record<string, string>; details?: unknown } = {},
) {
  const body: ApiErrorBody = { error: { code, message, ...extra } }
  return HttpResponse.json(body, { status })
}

export function fieldErrors(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.map(String).join('.') || 'form'
    fields[key] ??= issue.message
  }
  return fields
}

export function validationError(error: ZodError, message = 'Confira os campos destacados.') {
  return apiError(422, 'validation_error', message, { fields: fieldErrors(error) })
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export type Parsed<T> = { ok: true; data: T } | { ok: false; response: Response }

export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<Parsed<T>> {
  const parsed = schema.safeParse(await readJson(request))
  if (parsed.success) return { ok: true, data: parsed.data }
  return { ok: false, response: validationError(parsed.error) }
}

export function json<T extends JsonBodyType>(schema: ZodType<T>, value: T, init?: ResponseInit) {
  return HttpResponse.json(schema.parse(value), init)
}
