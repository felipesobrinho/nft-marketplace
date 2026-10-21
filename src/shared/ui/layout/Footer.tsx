import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { BellRing, Palette, ShieldCheck } from 'lucide-react'
import { Button } from '@/shared/ui/components/ui/button'
import { Input } from '@/shared/ui/components/ui/input'
import { Label } from '@/shared/ui/components/ui/label'
import { IconBox } from '@/shared/ui/IconBox'
import { UnavailableButton, UnavailableDialog } from '@/shared/ui/feedback/UnavailableNotice'
import { cn } from '@/shared/ui/lib/utils'
import { Logo } from './Logo'

const linkClass = 'text-left text-small text-foreground transition-colors hover:text-highlight'

interface FeatureColumnProps {
  icon: ReactNode
  title: string
  text: string
  divided: boolean
}

function FeatureColumn({ icon, title, text, divided }: FeatureColumnProps) {
  return (
    <div className={cn('flex flex-col gap-3', divided && 'lg:border-l lg:border-primary/30 lg:pl-6')}>
      <IconBox size="lg">{icon}</IconBox>
      <h3 className="text-title font-bold">{title}</h3>
      <p className="text-small text-muted-foreground">{text}</p>
    </div>
  )
}

function Newsletter() {
  const [open, setOpen] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setOpen(true)
  }

  return (
    <div className="flex flex-col gap-3 lg:border-l lg:border-primary/30 lg:pl-6">
      <h3 className="text-title font-bold">Antecipe-se ao próximo lançamento</h3>
      <form onSubmit={handleSubmit} className="flex items-center">
        <Label htmlFor="footer-newsletter" className="sr-only">
          E-mail para novidades
        </Label>
        <Input
          id="footer-newsletter"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Digite seu e-mail…"
          className="min-w-0 flex-1 rounded-r-none"
        />
        <Button type="submit" className="rounded-l-none text-body">
          Enviar
        </Button>
      </form>
      <p className="text-small text-muted-foreground">
        Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
      </p>
      <UnavailableDialog feature="A newsletter" open={open} onOpenChange={setOpen} />
    </div>
  )
}

interface LinkColumnProps {
  title: string
  children: ReactNode
}

function LinkColumn({ title, children }: LinkColumnProps) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-body-lg font-bold">{title}</h3>
      {children}
    </div>
  )
}

function Unavailable({ feature, label }: { feature: string; label: string }) {
  return (
    <li>
      <UnavailableButton feature={feature} unstyled className={linkClass}>
        {label}
      </UnavailableButton>
    </li>
  )
}

const helpLinks = [
  'Central de ajuda',
  'Como comprar NFTs',
  'Carteira e segurança',
  'Política do mercado',
  'Denunciar item',
]
const collections = ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade']
const socials = ['Facebook', 'Instagram', 'X', 'LinkedIn', 'YouTube']

export function Footer() {
  return (
    <footer className="page flex flex-col gap-6">
      <h2 className="sr-only">Rodapé</h2>

      <div className="grid gap-8 rounded-md bg-card p-6 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.4fr] lg:p-8">
        <FeatureColumn
          divided={false}
          icon={<ShieldCheck />}
          title="Segurança da carteira"
          text="Proteja sua carteira e colecione arte digital verificada com confiança."
        />
        <FeatureColumn
          divided
          icon={<Palette />}
          title="Criadores em destaque"
          text="Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede."
        />
        <FeatureColumn
          divided
          icon={<BellRing />}
          title="Alertas de lançamentos"
          text="Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado."
        />
        <Newsletter />
      </div>

      <div className="grid gap-3 rounded-md bg-surface-dark px-6 py-6 text-small lg:grid-cols-[1fr_1fr_1fr_1.4fr] lg:items-center lg:gap-8 lg:px-8">
        <Logo />
        <p>Feito para colecionadores, criadores e cultura</p>
        <p>contato@email.com</p>
        <p>+55 11 4002 8922</p>
      </div>

      <div className="grid gap-8 rounded-md bg-card p-6 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.4fr] lg:p-8">
        <LinkColumn title="Meu perfil">
          <ul className="flex flex-col gap-3">
            <li>
              <Link to="/conta/perfil" className={linkClass}>
                Meu perfil
              </Link>
            </li>
            <Unavailable feature="A coleção pessoal" label="Minha coleção" />
            <Unavailable feature="O histórico de atividade" label="Atividade" />
            <Unavailable feature="O estúdio do criador" label="Estúdio do criador" />
            <li>
              <Link to="/conta/favoritos" className={linkClass}>
                Lista de interesse
              </Link>
            </li>
          </ul>
        </LinkColumn>

        <LinkColumn title="Central de ajuda">
          <ul className="flex flex-col gap-3">
            {helpLinks.map((label) => (
              <Unavailable key={label} feature="A central de ajuda" label={label} />
            ))}
          </ul>
        </LinkColumn>

        <LinkColumn title="Coleções">
          <ul className="flex flex-col gap-3">
            {collections.map((label) => (
              <li key={label}>
                <Link to="/" hash="catalogo" className={linkClass}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </LinkColumn>

        <div className="flex flex-col gap-6">
          <LinkColumn title="Redes sociais">
            <ul className="flex flex-wrap gap-3">
              {socials.map((label) => (
                <li key={label}>
                  <UnavailableButton
                    feature="Os perfis sociais"
                    unstyled
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm border border-primary/60 px-3 text-caption text-foreground transition-colors hover:text-highlight"
                  >
                    {label}
                  </UnavailableButton>
                </li>
              ))}
            </ul>
          </LinkColumn>
          <LinkColumn title="Carteiras compatíveis">
            <span className="w-fit whitespace-nowrap rounded-full border border-primary/60 px-3 py-1 text-caption font-bold text-highlight">
              MetaMask · WalletConnect · Coinbase
            </span>
          </LinkColumn>
        </div>
      </div>

      <p className="py-6 text-center text-caption text-muted-foreground">
        &copy; 2026 Kurio. Propriedade digital para todos.
      </p>
    </footer>
  )
}
