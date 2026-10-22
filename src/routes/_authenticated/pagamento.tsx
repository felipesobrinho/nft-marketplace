import { createFileRoute } from '@tanstack/react-router'
import { CheckoutPage } from '@/modules/checkout'

export const Route = createFileRoute('/_authenticated/pagamento')({
  head: () => ({ meta: [{ title: 'Pagamento | Kurio' }] }),
  component: CheckoutPage,
})
