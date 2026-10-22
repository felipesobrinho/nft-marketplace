import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/pagamento')({
  head: () => ({ meta: [{ title: 'Pagamento | Kurio' }] }),
  component: CheckoutRoutePage,
})

function CheckoutRoutePage() {
  return (
    <section className="page py-12">
      <h1 className="text-heading font-bold">Pagamento</h1>
    </section>
  )
}
