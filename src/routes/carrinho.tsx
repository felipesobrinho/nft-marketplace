import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/carrinho')({
  head: () => ({ meta: [{ title: 'Carrinho | Kurio' }] }),
  component: CartRoutePage,
})

function CartRoutePage() {
  return (
    <section className="page py-12">
      <h1 className="text-heading font-bold">Carrinho de NFTs</h1>
    </section>
  )
}
