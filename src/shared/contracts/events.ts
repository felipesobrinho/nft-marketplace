import { z } from 'zod'
import { ethAmountSchema, isoDateTimeSchema, versionSchema } from './common'
import { editionStatusSchema, nftAvailabilitySchema } from './catalog'

export const orderStatusSchema = z.enum(['pending', 'confirmed', 'refused'])

export type OrderStatus = z.infer<typeof orderStatusSchema>

const envelope = <Type extends string, Resource extends string, Data extends z.ZodType>(
  type: Type,
  resource: Resource,
  data: Data,
) =>
  z.object({
    eventId: z.string().min(1),
    type: z.literal(type),
    resource: z.object({ type: z.literal(resource), id: z.string().min(1) }),
    version: versionSchema,
    occurredAt: isoDateTimeSchema,
    userId: z.string().min(1).optional(),
    data,
  })

export const nftUpdatedEventSchema = envelope(
  'nft.updated',
  'nft',
  z.object({
    name: z.string().min(1),
    price: ethAmountSchema,
    previousPrice: ethAmountSchema.nullable(),
    availability: nftAvailabilitySchema,
    editions: z.array(
      z.object({
        id: z.string().min(1),
        price: ethAmountSchema,
        available: z.number().int().min(0).nullable(),
        status: editionStatusSchema,
      }),
    ),
  }),
)

export type NftUpdatedEvent = z.infer<typeof nftUpdatedEventSchema>

export const orderUpdatedEventSchema = envelope(
  'order.updated',
  'order',
  z.object({
    status: orderStatusSchema,
    reason: z.string().min(1).nullable(),
    transactionRef: z.string().min(1).nullable(),
  }),
)

export type OrderUpdatedEvent = z.infer<typeof orderUpdatedEventSchema>

export const realtimeEventSchema = z.discriminatedUnion('type', [
  nftUpdatedEventSchema,
  orderUpdatedEventSchema,
])

export type RealtimeEvent = z.infer<typeof realtimeEventSchema>

export type RealtimeEventType = RealtimeEvent['type']

export const REALTIME_PATH = '/realtime/'

export const REALTIME_EVENT_TYPES: readonly RealtimeEventType[] = ['nft.updated', 'order.updated']
