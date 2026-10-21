import { z } from 'zod'
import { isoDateTimeSchema } from './common'

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Use pelo menos 3 caracteres')
  .max(20, 'Use no máximo 20 caracteres')
  .regex(/^[a-z0-9_.]+$/, 'Use só letras minúsculas, números, ponto e sublinhado')

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email('Informe um e-mail válido'))

export const passwordSchema = z
  .string()
  .min(8, 'Use pelo menos 8 caracteres')
  .max(64, 'Use no máximo 64 caracteres')
  .regex(/[a-z]/, 'Inclua uma letra minúscula')
  .regex(/[A-Z]/, 'Inclua uma letra maiúscula')
  .regex(/\d/, 'Inclua um número')

export const registerRequestSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
})

export type RegisterRequest = z.infer<typeof registerRequestSchema>

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe a senha'),
})

export type LoginRequest = z.infer<typeof loginRequestSchema>

export const sessionUserSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(1),
  displayName: z.string().min(1),
  email: z.string().min(1),
  avatarUrl: z.string().nullable(),
})

export type SessionUser = z.infer<typeof sessionUserSchema>

export const sessionResponseSchema = z.object({
  token: z.string().min(1),
  expiresAt: isoDateTimeSchema,
  user: sessionUserSchema,
})

export type SessionResponse = z.infer<typeof sessionResponseSchema>

export const currentSessionSchema = z.object({
  expiresAt: isoDateTimeSchema,
  user: sessionUserSchema,
})

export type CurrentSession = z.infer<typeof currentSessionSchema>
