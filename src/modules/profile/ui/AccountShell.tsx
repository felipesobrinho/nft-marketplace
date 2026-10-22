import type { ComponentProps, ReactNode } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import {
  Download,
  Heart,
  LifeBuoy,
  LogOut,
  MapPin,
  ShoppingBag,
  TrendingUp,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { useLogout } from '@/modules/auth'
import { Button } from '@/shared/ui/components/ui/button'
import { Separator } from '@/shared/ui/components/ui/separator'
import { UnavailableButton } from '@/shared/ui/feedback/UnavailableNotice'
import { MobileTopBar } from '@/shared/ui/layout/MobileTopBar'

type AccountPath = '/conta/perfil' | '/conta/carteiras' | '/conta/favoritos'

interface AccountLink {
  to: AccountPath
  label: string
  icon: LucideIcon
}

const accountLinks: readonly AccountLink[] = [
  { to: '/conta/perfil', label: 'Dados do perfil', icon: UserRound },
  { to: '/conta/carteiras', label: 'Carteiras', icon: MapPin },
  { to: '/conta/favoritos', label: 'Lista de interesse', icon: Heart },
]

interface UnavailableLink {
  label: string
  icon: LucideIcon
}

const unavailableLinks: readonly UnavailableLink[] = [
  { label: 'Atividade', icon: ShoppingBag },
  { label: 'Ofertas', icon: TrendingUp },
  { label: 'Arquivos baixados', icon: Download },
  { label: 'Suporte', icon: LifeBuoy },
]

const sideItemClass =
  'flex min-h-11 w-full items-center gap-3 border-l-4 border-transparent px-4 text-small font-medium text-highlight transition-colors hover:bg-accent'

const sideActiveClass = 'border-primary bg-accent font-bold'

const tabClass =
  'flex h-full min-h-11 items-center justify-center border-b-2 border-transparent px-2 py-2 text-center text-small font-medium text-muted-foreground transition-colors hover:text-foreground'

const tabActiveClass = 'border-primary font-bold text-foreground'

type LinkProps = ComponentProps<typeof Link>

function useSignOut() {
  const router = useRouter()
  const logout = useLogout()
  const signOut = () => {
    logout.mutate(undefined, {
      onSettled: () => {
        router.history.push('/')
        toast.success('Você saiu da sua conta.')
      },
    })
  }
  return { signOut, isPending: logout.isPending }
}

function SideLink({ to, label, icon: Icon }: AccountLink) {
  const linkProps: LinkProps = {
    to,
    className: sideItemClass,
    activeProps: { className: sideActiveClass, 'aria-current': 'page' },
  }
  return (
    <Link {...linkProps}>
      <Icon aria-hidden="true" className="size-5" />
      {label}
    </Link>
  )
}

function TabLink({ to, label }: AccountLink) {
  const linkProps: LinkProps = {
    to,
    className: tabClass,
    activeProps: { className: tabActiveClass, 'aria-current': 'page' },
  }
  return <Link {...linkProps}>{label}</Link>
}

function SideMenu() {
  const { signOut, isPending } = useSignOut()
  return (
    <aside className="hidden w-72 shrink-0 self-start bg-card py-4 md:block">
      <h2 className="px-4 pb-2 text-title font-bold text-foreground">Meu perfil</h2>
      <nav aria-label="Conta">
        <ul className="flex flex-col">
          {accountLinks.map((link) => (
            <li key={link.to}>
              <SideLink {...link} />
            </li>
          ))}
          {unavailableLinks.map(({ label, icon: Icon }) => (
            <li key={label}>
              <UnavailableButton feature={label} unstyled className={sideItemClass}>
                <Icon aria-hidden="true" className="size-5" />
                {label}
              </UnavailableButton>
            </li>
          ))}
        </ul>
        <Separator className="my-2" />
        <button type="button" disabled={isPending} onClick={signOut} className={sideItemClass}>
          <LogOut aria-hidden="true" className="size-5" />
          Sair
        </button>
      </nav>
    </aside>
  )
}

function MobileTabs() {
  return (
    <nav aria-label="Conta" className="md:hidden">
      <ul className="grid grid-cols-3 border-b border-border">
        {accountLinks.map((link) => (
          <li key={link.to}>
            <TabLink {...link} />
          </li>
        ))}
      </ul>
    </nav>
  )
}

function MobileSignOut() {
  const { signOut, isPending } = useSignOut()
  return (
    <Button
      type="button"
      variant="outline"
      className="mt-8 w-full md:hidden"
      disabled={isPending}
      onClick={signOut}
    >
      <LogOut aria-hidden="true" />
      Sair da conta
    </Button>
  )
}

export function AccountShell({ children }: { children: ReactNode }) {
  return (
    <>
      <MobileTopBar title="Minha conta" backTo={{ to: '/' }} />
      <div className="page flex flex-col gap-6 pt-2 pb-12 md:flex-row md:gap-8 md:pt-8 md:pb-16">
        <SideMenu />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileTabs />
          <div className="pt-6 md:pt-0">{children}</div>
          <MobileSignOut />
        </div>
      </div>
    </>
  )
}
