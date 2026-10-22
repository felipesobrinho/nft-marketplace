import { type ErrorComponentProps, useRouter } from '@tanstack/react-router'
import { errorMessage } from '@/shared/domain/apiError'

export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  return (
    <section className="page flex flex-col items-start gap-4 py-24" role="alert">
      <h1 className="text-heading font-bold">Algo deu errado</h1>
      <p className="text-body text-muted-foreground">{errorMessage(error)}</p>
      <button
        type="button"
        className="rounded-sm bg-primary px-4 py-3 text-body font-bold text-primary-foreground"
        onClick={() => {
          reset()
          void router.invalidate()
        }}
      >
        Tentar de novo
      </button>
    </section>
  )
}
