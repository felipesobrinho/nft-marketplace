import { Link, useRouter, useRouterState } from '@tanstack/react-router'
import { ChevronDown, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import type { SessionUser } from '@/shared/contracts/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/components/ui/avatar'
import { Button } from '@/shared/ui/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/components/ui/dropdown-menu'
import { Skeleton } from '@/shared/ui/components/ui/skeleton'
import { useLogout } from '../application/account'
import { useSession } from '../application/session'

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0] ?? ''
  const last = parts[parts.length - 1] ?? ''
  const letters = parts.length > 1 ? `${first.charAt(0)}${last.charAt(0)}` : first.slice(0, 2)
  return letters.toUpperCase()
}

function AccountMenu({ user }: { user: SessionUser }) {
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Conta de ${user.displayName}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-sm text-foreground hover:text-highlight"
        >
          <Avatar>
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
            <AvatarFallback>{initialsOf(user.displayName)}</AvatarFallback>
          </Avatar>
          <span className="hidden text-small font-medium lg:inline">{user.displayName}</span>
          <ChevronDown aria-hidden="true" className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to="/conta/perfil">Meu perfil</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/conta/carteiras">Carteiras</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/conta/favoritos">Lista de interesse</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}>Sair</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function LoginLink() {
  const href = useRouterState({ select: (state) => state.location.href })
  return (
    <Button size="sm" asChild>
      <Link to="/entrar" search={{ redirect: href }}>
        <LogIn aria-hidden="true" />
        Entrar
      </Link>
    </Button>
  )
}

export function UserMenu() {
  const session = useSession()
  if (session.status === 'checking') {
    return <Skeleton aria-hidden="true" className="size-9 rounded-full" />
  }
  if (session.status === 'authenticated') return <AccountMenu user={session.user} />
  return <LoginLink />
}
