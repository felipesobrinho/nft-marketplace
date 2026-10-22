import { z } from 'zod'
import { walletTypeSchema } from './account'
import { emailSchema, usernameSchema } from './auth'
import { nftSummarySchema } from './catalog'
import {
  ethAmountSchema,
  imageSchema,
  isoDateTimeSchema,
  networkIdSchema,
  quantitySchema,
  versionSchema,
} from './common'
import { orderStatusSchema } from './events'

export const favoriteListResponseSchema = z.object({ items: z.array(nftSummarySchema) })

export const favoriteStateSchema = z.object({ nftId: z.string().min(1), favorited: z.boolean() })

export type FavoriteState = z.infer<typeof favoriteStateSchema>

export const couponSchema = z.object({
  code: z.string().min(1),
  percentBps: z.number().int().min(1).max(10_000),
  description: z.string().min(1),
})

export type Coupon = z.infer<typeof couponSchema>

export const cartItemSchema = z.object({
  id: z.string().min(1),
  nftId: z.string().min(1),
  editionId: z.string().min(1),
  quantity: quantitySchema,
  name: z.string().min(1),
  tokenId: z.number().int().min(0),
  image: imageSchema,
  editionLabel: z.string().min(1),
  unitPrice: ethAmountSchema,
  lineTotal: ethAmountSchema,
  maxQuantity: z.number().int().min(0),
  status: z.enum(['available', 'limited', 'sold_out']),
})

export type CartItem = z.infer<typeof cartItemSchema>

export const cartSchema = z.object({
  id: z.string().min(1),
  items: z.array(cartItemSchema),
  coupon: couponSchema.nullable(),
  itemCount: z.number().int().min(0),
  subtotal: ethAmountSchema,
  version: versionSchema,
})

export type Cart = z.infer<typeof cartSchema>

export const addCartItemRequestSchema = z.object({
  nftId: z.string().min(1),
  editionId: z.string().min(1),
  quantity: quantitySchema,
})

export type AddCartItemRequest = z.infer<typeof addCartItemRequestSchema>

export const updateCartItemRequestSchema = z.object({ quantity: quantitySchema })

export const applyCouponRequestSchema = z.object({
  code: z.string().trim().toUpperCase().min(1, 'Informe o código promocional').max(20),
})

export const mergeCartRequestSchema = z.object({ guestCartId: z.string().min(1) })

export const cartAdjustmentSchema = z.object({
  nftId: z.string().min(1),
  editionId: z.string().min(1),
  name: z.string().min(1),
  requested: z.number().int().min(1),
  applied: z.number().int().min(0),
  reason: z.enum(['quantity_limit', 'out_of_stock']),
})

export type CartAdjustment = z.infer<typeof cartAdjustmentSchema>

export const mergeCartResponseSchema = z.object({
  cart: cartSchema,
  adjustments: z.array(cartAdjustmentSchema),
})

export type MergeCartResponse = z.infer<typeof mergeCartResponseSchema>

export const quoteRequestSchema = z.object({ network: networkIdSchema })

export const quoteIssueSchema = z.object({
  code: z.enum(['price_changed', 'out_of_stock', 'quantity_limit', 'coupon_expired']),
  cartItemId: z.string().min(1).nullable(),
  message: z.string().min(1),
})

export type QuoteIssue = z.infer<typeof quoteIssueSchema>

export const quoteLineSchema = z.object({
  cartItemId: z.string().min(1),
  nftId: z.string().min(1),
  editionId: z.string().min(1),
  name: z.string().min(1),
  tokenId: z.number().int().min(0),
  image: imageSchema,
  editionLabel: z.string().min(1),
  unitPrice: ethAmountSchema,
  quantity: quantitySchema,
  lineTotal: ethAmountSchema,
})

export type QuoteLine = z.infer<typeof quoteLineSchema>

export const quoteSchema = z.object({
  id: z.string().min(1),
  version: versionSchema,
  cartVersion: versionSchema,
  network: networkIdSchema,
  lines: z.array(quoteLineSchema),
  coupon: couponSchema.nullable(),
  subtotal: ethAmountSchema,
  discount: ethAmountSchema,
  networkFee: ethAmountSchema,
  total: ethAmountSchema,
  issues: z.array(quoteIssueSchema),
  createdAt: isoDateTimeSchema,
  expiresAt: isoDateTimeSchema,
})

export type Quote = z.infer<typeof quoteSchema>

export const buyerSchema = z.object({
  displayName: z.string().trim().min(2, 'Use pelo menos 2 caracteres').max(40, 'Use no máximo 40 caracteres'),
  username: usernameSchema,
  email: emailSchema,
  referralCode: z
    .string()
    .trim()
    .max(20, 'Use no máximo 20 caracteres')
    .regex(/^[A-Za-z0-9-]*$/, 'Use só letras, números e hífen'),
  note: z.string().trim().max(280, 'Use no máximo 280 caracteres'),
})

export type Buyer = z.infer<typeof buyerSchema>

export const createOrderRequestSchema = z.object({
  quoteId: z.string().min(1),
  walletId: z.string().min(1),
  network: networkIdSchema,
  provider: walletTypeSchema,
  buyer: buyerSchema,
})

export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>

export const IDEMPOTENCY_HEADER = 'Idempotency-Key'

export const receiptSchema = z.object({
  lines: z.array(quoteLineSchema),
  coupon: couponSchema.nullable(),
  subtotal: ethAmountSchema,
  discount: ethAmountSchema,
  networkFee: ethAmountSchema,
  total: ethAmountSchema,
})

export type Receipt = z.infer<typeof receiptSchema>

export const orderSchema = z.object({
  id: z.string().min(1),
  status: orderStatusSchema,
  reason: z.string().min(1).nullable(),
  transactionRef: z.string().min(1).nullable(),
  network: networkIdSchema,
  provider: walletTypeSchema,
  wallet: z.object({ id: z.string().min(1), nickname: z.string().min(1), address: z.string().min(1) }),
  buyer: buyerSchema,
  receipt: receiptSchema,
  quoteId: z.string().min(1),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
  version: versionSchema,
})

export type Order = z.infer<typeof orderSchema>

export const orderListResponseSchema = z.object({ items: z.array(orderSchema) })

export const quoteOutdatedDetailsSchema = z.object({ quote: quoteSchema })
