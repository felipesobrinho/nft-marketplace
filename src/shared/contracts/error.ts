import { z } from 'zod'

export const apiErrorCodes = [
  'bad_request',
  'validation_error',
  'unauthenticated',
  'invalid_credentials',
  'session_expired',
  'forbidden',
  'not_found',
  'out_of_stock',
  'edition_unavailable',
  'quantity_limit',
  'price_changed',
  'quote_outdated',
  'quote_expired',
  'account_conflict',
  'idempotency_conflict',
  'coupon_invalid',
  'coupon_expired',
  'wallet_refused',
  'service_unavailable',
  'internal_error',
] as const

export const apiErrorCodeSchema = z.enum(apiErrorCodes)

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>

export const apiErrorBodySchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    fields: z.record(z.string(), z.string()).optional(),
    details: z.unknown().optional(),
  }),
})

export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>
