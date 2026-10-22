import { Link } from '@tanstack/react-router'
import { cn } from '@/shared/ui/lib/utils'

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <Link
      to="/"
      aria-label="Kurio, página inicial"
      className={cn('text-small font-bold tracking-wide text-foreground', className)}
    >
      KURIO
    </Link>
  )
}
