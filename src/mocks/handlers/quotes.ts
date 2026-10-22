import { quoteRequestSchema, quoteSchema } from '@/shared/contracts/commerce'
import { createQuote, toQuote } from '../services/quotes'
import { apiRoute } from './api'
import { resolveCart } from './cart'
import { json, parseBody } from './respond'
import { isResponse } from './session'

export const quoteHandlers = [
  apiRoute('post', '/quotes', async ({ request }) => {
    const cart = await resolveCart(request)
    if (isResponse(cart)) return cart
    const body = await parseBody(request, quoteRequestSchema)
    if (!body.ok) return body.response
    const quote = await createQuote(cart.id, body.data.network)
    return json(quoteSchema, toQuote(quote))
  }),
]
