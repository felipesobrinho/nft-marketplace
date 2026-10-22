import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/entrar')({
  head: () => ({ meta: [{ title: 'Entrar | Kurio' }] }),
  component: LoginRoutePage,
})

function LoginRoutePage() {
  return (
    <section className="page py-12">
      <h1 className="text-heading font-bold">Entrar</h1>
    </section>
  )
}
