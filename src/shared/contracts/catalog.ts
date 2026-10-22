import { z } from 'zod'
import {
  ethAmountSchema,
  imageSchema,
  isoDateTimeSchema,
  networkIdSchema,
  pageSchema,
  versionSchema,
} from './common'

export const catalogTabs = ['all', 'new', 'trending'] as const
export const catalogSorts = ['recent', 'price_asc', 'price_desc', 'name_asc', 'name_desc'] as const

export const catalogTabSchema = z.enum(catalogTabs)
export const catalogSortSchema = z.enum(catalogSorts)

export type CatalogTab = z.infer<typeof catalogTabSchema>
export type CatalogSort = z.infer<typeof catalogSortSchema>

export const CATALOG_PAGE_SIZE = 9

export const nftListQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  collection: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  network: networkIdSchema.optional(),
  minPrice: ethAmountSchema.optional(),
  maxPrice: ethAmountSchema.optional(),
  tab: catalogTabSchema.default('all'),
  sort: catalogSortSchema.default('recent'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(CATALOG_PAGE_SIZE),
})

export type NftListQuery = z.infer<typeof nftListQuerySchema>

export const editionStatusSchema = z.enum(['available', 'sold_out'])

export const editionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  supply: z.number().int().min(1).nullable(),
  available: z.number().int().min(0).nullable(),
  price: ethAmountSchema,
  maxPerOrder: z.number().int().min(1),
  status: editionStatusSchema,
})

export type Edition = z.infer<typeof editionSchema>

export const nftAvailabilitySchema = z.enum(['available', 'sold_out'])

export const collectionRefSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
})

export const nftSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  tokenId: z.number().int().min(0),
  collection: collectionRefSchema,
  network: networkIdSchema,
  image: imageSchema,
  price: ethAmountSchema,
  previousPrice: ethAmountSchema.nullable(),
  badge: z.enum(['rare', 'new']).nullable(),
  availability: nftAvailabilitySchema,
  listedAt: isoDateTimeSchema,
  version: versionSchema,
})

export type NftSummary = z.infer<typeof nftSummarySchema>

export const reviewSchema = z.object({
  id: z.string().min(1),
  author: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1),
  createdAt: isoDateTimeSchema,
})

export type Review = z.infer<typeof reviewSchema>

export const nftDetailSchema = nftSummarySchema.extend({
  description: z.string().min(1),
  story: z.array(z.string().min(1)),
  creator: z.string().min(1),
  contractAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  royaltiesBps: z.number().int().min(0).max(10_000),
  attributes: z.array(z.string().min(1)),
  rating: z.object({
    average: z.number().min(0).max(5),
    count: z.number().int().min(0),
  }),
  editions: z.array(editionSchema).min(1),
  reviews: z.array(reviewSchema),
})

export type NftDetail = z.infer<typeof nftDetailSchema>

export const nftListResponseSchema = pageSchema(nftSummarySchema).extend({
  priceRange: z.object({ min: ethAmountSchema, max: ethAmountSchema }),
})

export type NftListResponse = z.infer<typeof nftListResponseSchema>

export const featuredNftsResponseSchema = z.object({
  hero: z.array(nftSummarySchema),
  spotlight: nftSummarySchema.nullable(),
})

export type FeaturedNftsResponse = z.infer<typeof featuredNftsResponseSchema>

export const facetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  count: z.number().int().min(0),
})

export type Facet = z.infer<typeof facetSchema>

export const facetListResponseSchema = z.object({ items: z.array(facetSchema) })
