import { z } from 'zod'
import { walletSchema } from '@/shared/contracts/account'
import { nftDetailSchema } from '@/shared/contracts/catalog'
import { couponSchema, orderSchema, quoteSchema } from '@/shared/contracts/commerce'
import { isoDateTimeSchema } from '@/shared/contracts/common'

export const nftRecordSchema = nftDetailSchema.extend({
  isNew: z.boolean(),
  isTrending: z.boolean(),
  featured: z.enum(['hero', 'spotlight']).nullable(),
})

export type NftRecord = z.infer<typeof nftRecordSchema>

export const userRecordSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(1),
  email: z.string().min(1),
  passwordHash: z.string().min(1),
  displayName: z.string().min(1),
  ensName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
})

export type UserRecord = z.infer<typeof userRecordSchema>

export const sessionRecordSchema = z.object({
  token: z.string().min(1),
  userId: z.string().min(1),
  createdAt: isoDateTimeSchema,
  expiresAt: isoDateTimeSchema,
})

export type SessionRecord = z.infer<typeof sessionRecordSchema>

export const favoriteRecordSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  nftId: z.string().min(1),
  createdAt: isoDateTimeSchema,
})

export type FavoriteRecord = z.infer<typeof favoriteRecordSchema>

export const cartRecordSchema = z.object({
  id: z.string().min(1),
  userId: z.string().nullable(),
  couponCode: z.string().nullable(),
  version: z.number().int().min(1),
  updatedAt: isoDateTimeSchema,
})

export type CartRecord = z.infer<typeof cartRecordSchema>

export const cartItemRecordSchema = z.object({
  id: z.string().min(1),
  cartId: z.string().min(1),
  nftId: z.string().min(1),
  editionId: z.string().min(1),
  quantity: z.number().int().min(1),
  addedAt: isoDateTimeSchema,
})

export type CartItemRecord = z.infer<typeof cartItemRecordSchema>

export const couponRecordSchema = couponSchema.extend({
  expiresAt: isoDateTimeSchema,
})

export type CouponRecord = z.infer<typeof couponRecordSchema>

export const quoteRecordSchema = quoteSchema.extend({
  cartId: z.string().min(1),
  userId: z.string().nullable(),
})

export type QuoteRecord = z.infer<typeof quoteRecordSchema>

export const orderRecordSchema = orderSchema.extend({
  userId: z.string().min(1),
  cartId: z.string().min(1),
  idempotencyKey: z.string().min(1),
  requestHash: z.string().min(1),
  settlesAt: isoDateTimeSchema,
  outcome: z.enum(['confirmed', 'refused']),
})

export type OrderRecord = z.infer<typeof orderRecordSchema>

export const walletRecordSchema = walletSchema.extend({
  userId: z.string().min(1),
})

export type WalletRecord = z.infer<typeof walletRecordSchema>
