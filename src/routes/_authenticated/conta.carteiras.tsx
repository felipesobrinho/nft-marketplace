import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/conta/carteiras')({
  head: () => ({ meta: [{ title: 'Carteiras | Kurio' }] }),
  component: WalletsRoutePage,
})

function WalletsRoutePage() {
  return (
    <section className="page py-12">
      <h1 className="text-heading font-bold">Carteiras</h1>
    </section>
  )
}
