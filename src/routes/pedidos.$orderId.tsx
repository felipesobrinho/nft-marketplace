import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/pedidos/$orderId')({
  head: () => ({ meta: [{ title: 'Pedido | Kurio' }] }),
  component: OrderRoutePage,
})

function OrderRoutePage() {
  return (
    <section className="page py-12">
      <h1 className="text-heading font-bold">Pedido</h1>
    </section>
  )
}
