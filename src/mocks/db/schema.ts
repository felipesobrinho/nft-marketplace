import { z } from 'zod'
import { nftDetailSchema } from '@/shared/contracts/catalog'

export const nftRecordSchema = nftDetailSchema.extend({
  isNew: z.boolean(),
  isTrending: z.boolean(),
  featured: z.enum(['hero', 'spotlight']).nullable(),
})

export type NftRecord = z.infer<typeof nftRecordSchema>
