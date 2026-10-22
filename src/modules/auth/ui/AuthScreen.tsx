import { useSyncExternalStore, type ReactNode } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { HomePreview } from '@/modules/catalog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/components/ui/dialog'
import { cn } from '@/shared/ui/lib/utils'
import { safeRedirect } from '../domain/redirect'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { SocialButtons } from './SocialButtons'

export interface AuthScreenProps {
  mode: 'login' | 'register'
  redirect?: string | undefined
  reason?: 'expirada' | undefined
}

const desktopQuery = '(min-width: 768px)'

function subscribeDesktop(onChange: () => void): () => void {
  const media = window.matchMedia(desktopQuery)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(desktopQuery).matches,
    () => false,
  )
}

const copy = {
  login: {
    title: 'Entrar',
    description: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
    switchPrompt: 'Novo na Kurio?',
    switchAction: 'Crie uma conta',
  },
  register: {
    title: 'Criar conta',
    description: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
    switchPrompt: 'Já tem uma conta?',
    switchAction: 'Entre',
  },
} as const

function ExpiredNotice() {
  return (
    <div role="alert" className="border-l-4 border-primary bg-surface-raised p-3 text-small">
      Sua sessão expirou. Entre de novo para continuar de onde parou.
    </div>
  )
}

function Divider() {
  return (
    <div className="flex items-center gap-3 text-caption text-muted-foreground">
      <span aria-hidden="true" className="h-px flex-1 bg-border" />
      Ou continue com
      <span aria-hidden="true" className="h-px flex-1 bg-border" />
    </div>
  )
}

function AuthForm({ mode, redirect }: Pick<AuthScreenProps, 'mode' | 'redirect'>) {
  return mode === 'login' ? <LoginForm redirect={redirect} /> : <RegisterForm redirect={redirect} />
}

function Tab({
  active,
  children,
  to,
}: {
  active: boolean
  children: ReactNode
  to: '/entrar' | '/cadastro'
}) {
  return (
    <Link
      to={to}
      search={(previous: { redirect?: string | undefined }) => ({ redirect: previous.redirect })}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex min-h-11 items-center text-title font-bold',
        active ? 'text-highlight' : 'text-foreground hover:text-highlight',
      )}
    >
      {children}
    </Link>
  )
}

function DesktopDialog({ mode, redirect, reason }: AuthScreenProps) {
  const router = useRouter()
  const text = copy[mode]
  return (
    <>
      <HomePreview />
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) router.history.push(safeRedirect(redirect))
        }}
      >
        <DialogContent
          onInteractOutside={(event) => event.preventDefault()}
          className="max-h-dvh overflow-y-auto pt-6 pb-10"
        >
          <DialogHeader className="items-center gap-4 text-center">
            <DialogTitle className="sr-only">{text.title}</DialogTitle>
            <nav aria-label="Entrar ou criar conta" className="flex items-center gap-3">
              <Tab active={mode === 'login'} to="/entrar">
                Entrar
              </Tab>
              <span aria-hidden="true" className="h-5 w-px bg-primary" />
              <Tab active={mode === 'register'} to="/cadastro">
                Criar conta
              </Tab>
            </nav>
            <DialogDescription className="text-center">{text.description}</DialogDescription>
          </DialogHeader>
          {reason === 'expirada' ? <ExpiredNotice /> : null}
          <AuthForm mode={mode} redirect={redirect} />
          <Divider />
          <SocialButtons />
          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1.5 rounded-b-md bg-primary" />
        </DialogContent>
      </Dialog>
    </>
  )
}

function MobilePage({ mode, redirect, reason }: AuthScreenProps) {
  const text = copy[mode]
  const otherTo = mode === 'login' ? '/cadastro' : '/entrar'
  return (
    <main className="flex min-h-dvh flex-col items-center px-6 py-10">
      <div className="flex w-full max-w-dialog flex-col gap-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <Link to="/" aria-label="Kurio, página inicial" className="text-display-sm font-bold tracking-wide">
            KURIO
          </Link>
          <h1 className="text-heading font-bold">{text.title}</h1>
        </div>
        {reason === 'expirada' ? <ExpiredNotice /> : null}
        <AuthForm mode={mode} redirect={redirect} />
        <Divider />
        <SocialButtons />
        <p className="text-center text-small text-muted-foreground">
          {text.switchPrompt}{' '}
          <Link
            to={otherTo}
            search={{ redirect }}
            className="inline-flex min-h-11 items-center font-bold text-highlight underline-offset-4 hover:underline"
          >
            {text.switchAction}
          </Link>
        </p>
      </div>
    </main>
  )
}

export function AuthScreen(props: AuthScreenProps) {
  const isDesktop = useIsDesktop()
  return isDesktop ? <DesktopDialog {...props} /> : <MobilePage {...props} />
}
