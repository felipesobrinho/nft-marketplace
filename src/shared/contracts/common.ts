import { z } from 'zod'

export const ethAmountSchema = z
  .string()
  .regex(/^(0|[1-9]\d*)(\.\d{1,18})?$/, 'Valor em ETH deve ser decimal com ponto e até 18 casas')

export type EthAmount = z.infer<typeof ethAmountSchema>

export const isoDateTimeSchema = z.iso.datetime({ offset: true })

export const quantitySchema = z.number().int().min(1)

export const versionSchema = z.number().int().min(1)

export const imageSchema = z.object({
  src: z.string().startsWith('/'),
  alt: z.string().min(1),
})

export type Image = z.infer<typeof imageSchema>

export const networkIdSchema = z.enum(['ethereum', 'polygon', 'solana'])

export type NetworkId = z.infer<typeof networkIdSchema>

export const networkNames: Record<NetworkId, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

export function pageSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  })
}
