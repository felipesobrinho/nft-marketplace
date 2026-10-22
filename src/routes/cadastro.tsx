import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/cadastro')({
  head: () => ({ meta: [{ title: 'Criar conta | Kurio' }] }),
  component: RegisterRoutePage,
})

function RegisterRoutePage() {
  return (
    <section className="page py-12">
      <h1 className="text-heading font-bold">Criar conta</h1>
    </section>
  )
}
