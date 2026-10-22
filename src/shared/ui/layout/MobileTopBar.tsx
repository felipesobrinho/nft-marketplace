import type { ComponentProps, ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Logo } from './Logo'

type LinkTarget = Pick<ComponentProps<typeof Link>, 'to' | 'params' | 'search' | 'hash'>

interface MobileTopBarProps {
  title?: string
  backTo?: LinkTarget
  onBack?: () => void
  action?: ReactNode
}

const backClass =
  'inline-flex size-11 items-center justify-center rounded-full bg-surface-raised text-foreground'

export function MobileTopBar({ title, backTo, onBack, action }: MobileTopBarProps) {
  const hasBack = backTo !== undefined || onBack !== undefined

  if (!hasBack) {
    return (
      <div className="page flex h-16 items-center justify-between md:hidden">
        <Logo />
        {action}
      </div>
    )
  }

  return (
    <div className="page grid h-16 grid-cols-[2.75rem_1fr_2.75rem] items-center gap-3 md:hidden">
      {backTo ? (
        <Link {...backTo} aria-label="Voltar" className={backClass}>
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
      ) : (
        <button type="button" aria-label="Voltar" onClick={onBack} className={backClass}>
          <ArrowLeft className="size-5" aria-hidden="true" />
        </button>
      )}
      <p className="truncate text-center text-title font-bold">{title}</p>
      <div className="flex items-center justify-end">{action}</div>
    </div>
  )
}
