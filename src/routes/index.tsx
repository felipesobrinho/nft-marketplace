import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: 'Kurio | Marketplace de NFTs' }] }),
  component: HomePage,
})

function HomePage() {
  return (
    <section className="page py-16">
      <p className="text-small text-subtle">Bem-vindo à Kurio</p>
      <h1 className="text-display-sm font-bold md:text-display">Seja dono do futuro da arte digital</h1>
    </section>
  )
}
