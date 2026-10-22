import { Button } from '@/shared/ui/components/ui/button'

export interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
  isRetrying?: boolean
}

export function ErrorState({
  title = 'Não foi possível carregar',
  message,
  onRetry,
  retryLabel = 'Tentar de novo',
  isRetrying = false,
}: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex flex-col gap-2">
        <p className="text-title font-bold text-foreground">{title}</p>
        <p className="text-small text-muted-foreground">{message}</p>
      </div>
      {onRetry ? (
        <Button type="button" variant="outline" disabled={isRetrying} onClick={onRetry}>
          {isRetrying ? 'Tentando…' : retryLabel}
        </Button>
      ) : null}
    </div>
  )
}
