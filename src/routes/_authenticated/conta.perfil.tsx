import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/conta/perfil')({
  head: () => ({ meta: [{ title: 'Perfil | Kurio' }] }),
  component: ProfileRoutePage,
})

function ProfileRoutePage() {
  return (
    <section className="page py-12">
      <h1 className="text-heading font-bold">Perfil do colecionador</h1>
    </section>
  )
}
