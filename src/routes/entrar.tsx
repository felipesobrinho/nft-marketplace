import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

export const Route = createFileRoute('/entrar')({
  validateSearch: z.object({
    redirect: z.string().startsWith('/').optional().catch(undefined),
  }),
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
