import { useState, type ReactNode } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { Search, ShoppingCart } from 'lucide-react'
import { UnavailableButton } from '@/shared/ui/feedback/UnavailableNotice'
import { cn } from '@/shared/ui/lib/utils'
import { Logo } from './Logo'

const marketPrefixes = ['/nft', '/carrinho', '/pagamento', '/pedidos']

const navItemClass = 'border-b-3 pb-1 text-body-lg transition-colors hover:text-highlight'
const navItemActive = 'border-primary font-bold text-highlight'
const navItemIdle = 'border-transparent text-foreground'

interface HeaderProps {
  searchSlot: ReactNode
  cartSlot: ReactNode
  accountSlot: ReactNode
}

export function Header({ searchSlot, cartSlot, accountSlot }: HeaderProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const homeActive = pathname === '/'
  const marketActive = marketPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )

  return (
    <header className="hidden md:block">
      <div className="page flex h-18 items-center justify-between gap-6">
        <Logo />
        <nav aria-label="Principal" className="flex items-center gap-6 lg:gap-10">
          <Link
            to="/"
            activeOptions={{ exact: true, includeHash: false }}
            aria-current={homeActive ? 'page' : undefined}
            className={cn(navItemClass, homeActive ? navItemActive : navItemIdle)}
          >
            Início
          </Link>
          <Link
            to="/"
            hash="catalogo"
            aria-current={marketActive ? 'page' : undefined}
            className={cn(navItemClass, marketActive ? navItemActive : navItemIdle)}
          >
            Mercado
          </Link>
          <UnavailableButton
            feature="A página de criadores"
            unstyled
            className={cn(navItemClass, navItemIdle)}
          >
            Criadores
          </UnavailableButton>
          <UnavailableButton
            feature="O conteúdo editorial"
            unstyled
            className={cn(navItemClass, navItemIdle)}
          >
            Aprenda
          </UnavailableButton>
        </nav>
        <div className="flex items-center gap-7">
          {searchSlot}
          {cartSlot}
          {accountSlot}
        </div>
      </div>
    </header>
  )
}

export interface HeaderSearchButtonProps {
  form: (close: () => void) => ReactNode
}

export function HeaderSearchButton({ form }: HeaderSearchButtonProps) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <div className="flex items-center gap-3">
      {open ? <div className="w-56">{form(close)}</div> : null}
      <button
        type="button"
        aria-label="Buscar NFTs"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex size-11 items-center justify-center rounded-full text-foreground hover:text-highlight"
      >
        <Search className="size-5" aria-hidden="true" />
      </button>
    </div>
  )
}

interface HeaderCartLinkProps {
  count?: number
}

export function HeaderCartLink({ count = 0 }: HeaderCartLinkProps) {
  const label = count === 0 ? 'Carrinho' : `Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`
  return (
    <Link
      to="/carrinho"
      aria-label={label}
      className="relative inline-flex size-11 items-center justify-center text-foreground hover:text-highlight"
    >
      <ShoppingCart className="size-6" aria-hidden="true" />
      {count > 0 ? (
        <span
          aria-hidden="true"
          className="absolute top-1 right-0 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-caption font-bold text-primary-foreground"
        >
          {count}
        </span>
      ) : null}
    </Link>
  )
}
