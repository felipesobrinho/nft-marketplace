import type { ReactNode } from 'react'
import { cn } from '@/shared/ui/lib/utils'

interface IconBoxProps {
  children: ReactNode
  size?: 'md' | 'lg'
  className?: string
}

export function IconBox({ children, size = 'md', className }: IconBoxProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground',
        size === 'lg' ? 'size-16 [&_svg]:size-8' : 'size-12 [&_svg]:size-6',
        className,
      )}
    >
      {children}
    </span>
  )
}
