import { z } from 'zod'
import { emailSchema, passwordSchema, usernameSchema } from './auth'
import { isoDateTimeSchema, networkIdSchema } from './common'

export const ensNameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Use pelo menos 3 caracteres')
  .max(32, 'Use no máximo 32 caracteres')
  .regex(/^[a-z0-9-]+(\.[a-z0-9-]+)*$/, 'Use letras minúsculas, números, hífen e ponto entre partes')

export const profileSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  username: z.string().min(1),
  email: z.string().min(1),
  ensName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  updatedAt: isoDateTimeSchema,
})

export type Profile = z.infer<typeof profileSchema>

export const updateProfileRequestSchema = z.object({
  displayName: z.string().trim().min(2, 'Use pelo menos 2 caracteres').max(40, 'Use no máximo 40 caracteres'),
  username: usernameSchema,
  email: emailSchema,
  ensName: ensNameSchema.nullable(),
})

export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>

export const AVATAR_MAX_BYTES = 1_000_000
export const avatarMimeTypes = ['image/png', 'image/jpeg', 'image/webp'] as const

export const updateAvatarRequestSchema = z.object({
  dataUrl: z
    .string()
    .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/, 'Envie uma imagem PNG, JPEG ou WebP')
    .nullable(),
})

export type UpdateAvatarRequest = z.infer<typeof updateAvatarRequestSchema>

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual'),
  newPassword: passwordSchema,
})

export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>

export const walletRoleSchema = z.enum(['primary', 'secondary'])
export const walletTypeSchema = z.enum(['metamask', 'walletconnect', 'coinbase'])

export type WalletRole = z.infer<typeof walletRoleSchema>
export type WalletType = z.infer<typeof walletTypeSchema>

export const walletTypeNames: Record<WalletType, string> = {
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase Wallet',
}

const evmAddress = /^0x[0-9a-fA-F]{40}$/
const solanaAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

export const walletSchema = z.object({
  id: z.string().min(1),
  role: walletRoleSchema,
  nickname: z.string().min(1),
  network: networkIdSchema,
  address: z.string().min(1),
  type: walletTypeSchema,
  ensName: z.string().nullable(),
  updatedAt: isoDateTimeSchema,
})

export type Wallet = z.infer<typeof walletSchema>

export const walletInputSchema = z
  .object({
    role: walletRoleSchema,
    nickname: z.string().trim().min(2, 'Use pelo menos 2 caracteres').max(30, 'Use no máximo 30 caracteres'),
    network: networkIdSchema,
    address: z.string().trim().min(1, 'Informe o endereço da carteira'),
    type: walletTypeSchema,
    ensName: ensNameSchema.nullable(),
  })
  .superRefine((value, context) => {
    const valid =
      value.network === 'solana' ? solanaAddress.test(value.address) : evmAddress.test(value.address)
    if (!valid) {
      context.addIssue({
        code: 'custom',
        path: ['address'],
        message:
          value.network === 'solana'
            ? 'Endereço Solana deve ter de 32 a 44 caracteres em base58'
            : 'Endereço deve começar com 0x e ter 40 caracteres hexadecimais',
      })
    }
  })

export type WalletInput = z.infer<typeof walletInputSchema>

export const walletListResponseSchema = z.object({ items: z.array(walletSchema) })

export const walletConnectionSchema = z.object({
  walletId: z.string().min(1),
  provider: walletTypeSchema,
  status: z.literal('connected'),
  connectedAt: isoDateTimeSchema,
})

export type WalletConnection = z.infer<typeof walletConnectionSchema>

export const connectWalletRequestSchema = z.object({ provider: walletTypeSchema })
