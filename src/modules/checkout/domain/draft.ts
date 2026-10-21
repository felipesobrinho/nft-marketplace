import { z } from 'zod'
import { walletTypeSchema, type WalletType } from '@/shared/contracts/account'
import { type Buyer, buyerSchema } from '@/shared/contracts/commerce'

export const checkoutSteps = ['dados', 'carteira', 'revisao'] as const

export const checkoutStepSchema = z.enum(checkoutSteps)

export type CheckoutStep = z.infer<typeof checkoutStepSchema>

export const checkoutAttemptSchema = z.object({
  key: z.string().min(8),
  quoteId: z.string().min(1),
  sent: z.boolean(),
})

export type CheckoutAttempt = z.infer<typeof checkoutAttemptSchema>

export const checkoutDraftSchema = z.object({
  step: checkoutStepSchema,
  buyer: buyerSchema.nullable(),
  walletId: z.string().min(1).nullable(),
  provider: walletTypeSchema.nullable(),
  connected: z.boolean(),
  attempt: checkoutAttemptSchema.nullable(),
})

export type CheckoutDraft = z.infer<typeof checkoutDraftSchema>

export const emptyDraft: CheckoutDraft = {
  step: 'dados',
  buyer: null,
  walletId: null,
  provider: null,
  connected: false,
  attempt: null,
}

export function parseDraft(value: unknown): CheckoutDraft {
  const parsed = checkoutDraftSchema.safeParse(value)
  if (!parsed.success) return emptyDraft
  return { ...parsed.data, step: reachableStep(parsed.data, parsed.data.step) }
}

export function isConnected(draft: CheckoutDraft): boolean {
  return draft.connected && draft.walletId !== null && draft.provider !== null
}

export function furthestStep(draft: CheckoutDraft): CheckoutStep {
  if (!draft.buyer) return 'dados'
  if (!isConnected(draft)) return 'carteira'
  return 'revisao'
}

export function reachableStep(draft: CheckoutDraft, wanted: CheckoutStep): CheckoutStep {
  const limit = checkoutSteps.indexOf(furthestStep(draft))
  return checkoutSteps.indexOf(wanted) <= limit ? wanted : (checkoutSteps[limit] ?? 'dados')
}

export function withBuyer(draft: CheckoutDraft, buyer: Buyer): CheckoutDraft {
  return reachable({ ...draft, buyer, step: 'carteira' })
}

export function withWallet(draft: CheckoutDraft, walletId: string): CheckoutDraft {
  if (draft.walletId === walletId) return draft
  return reachable({ ...draft, walletId, connected: false, attempt: null })
}

export function withProvider(draft: CheckoutDraft, provider: WalletType): CheckoutDraft {
  if (draft.provider === provider) return draft
  return reachable({ ...draft, provider, connected: false, attempt: null })
}

export function withConnection(draft: CheckoutDraft, connected: boolean): CheckoutDraft {
  return reachable({ ...draft, connected, attempt: connected ? draft.attempt : null })
}

export function withStep(draft: CheckoutDraft, step: CheckoutStep): CheckoutDraft {
  return { ...draft, step: reachableStep(draft, step) }
}

export function attemptFor(draft: CheckoutDraft, quoteId: string, newKey: () => string): CheckoutAttempt {
  if (draft.attempt?.quoteId === quoteId) return draft.attempt
  return { key: newKey(), quoteId, sent: false }
}

export function withAttempt(draft: CheckoutDraft, attempt: CheckoutAttempt | null): CheckoutDraft {
  return { ...draft, attempt }
}

function reachable(draft: CheckoutDraft): CheckoutDraft {
  return { ...draft, step: reachableStep(draft, draft.step) }
}
