import type { ComponentProps } from 'react'
import { Link } from '@tanstack/react-router'
import { Heart, House, ShoppingCart, User, type LucideIcon } from 'lucide-react'

interface NavEntry {
  to: ComponentProps<typeof Link>['to']
  label: string
  Icon: LucideIcon
  exact: boolean
}

const entries: NavEntry[] = [
  { to: '/', label: 'Início', Icon: House, exact: true },
  { to: '/conta/favoritos', label: 'Favoritos', Icon: Heart, exact: false },
  { to: '/carrinho', label: 'Carrinho', Icon: ShoppingCart, exact: false },
  { to: '/conta/perfil', label: 'Perfil', Icon: User, exact: false },
]

export function MobileNav() {
  return (
    <nav
      aria-label="Navegação principal no celular"
      className="fixed inset-x-0 bottom-0 z-40 rounded-t-lg bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid h-16 grid-cols-4">
        {entries.map(({ to, label, Icon, exact }) => (
          <li key={label} className="flex">
            <Link
              to={to}
              activeOptions={{ exact, includeHash: false }}
              activeProps={{ className: 'text-highlight' }}
              inactiveProps={{ className: 'text-subtle' }}
              className="flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-1 text-caption font-medium"
            >
              <Icon className="size-6" aria-hidden="true" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
