import type { ReactNode, Ref } from 'react'
import { walletTypeNames } from '@/shared/contracts/account'
import { networkNames } from '@/shared/contracts/common'
import { Button } from '@/shared/ui/components/ui/button'
import type { DraftChange } from '../application/draft'
import { useSelectedWallet } from '../application/purchase'
import { type CheckoutDraft, type CheckoutStep, withStep } from '../domain/draft'
import { walletAddressLabel, walletTitle } from './WalletStep'
import { StepHeading } from './StepHeading'

interface ReviewStepProps {
  draft: CheckoutDraft
  onChange: (change: DraftChange) => void
  headingRef: Ref<HTMLHeadingElement>
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] sm:grid-cols-[9rem_minmax(0,1fr)] gap-3">
      <dt className="text-small text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-body text-foreground">{children}</dd>
    </div>
  )
}

export function ReviewStep({ draft, onChange, headingRef }: ReviewStepProps) {
  const { wallet } = useSelectedWallet()
  const { buyer, provider } = draft

  const edit = (step: CheckoutStep) => onChange((current) => withStep(current, step))

  return (
    <div className="flex flex-col gap-6">
      <StepHeading
        headingRef={headingRef}
        title="Revisão"
        description="Confira os dados antes de confirmar a compra."
      />

      <section aria-labelledby="review-buyer" className="flex flex-col gap-3 rounded-md bg-card p-5">
        <div className="flex items-center justify-between gap-4">
          <h3 id="review-buyer" className="text-body-lg font-bold text-foreground">
            Dados do colecionador
          </h3>
          <Button type="button" variant="link" size="sm" onClick={() => edit('dados')}>
            Editar<span className="sr-only"> dados do colecionador</span>
          </Button>
        </div>
        {buyer ? (
          <dl className="flex flex-col gap-2">
            <Row label="Nome de exibição">{buyer.displayName}</Row>
            <Row label="Nome de usuário">{buyer.username}</Row>
            <Row label="E-mail">{buyer.email}</Row>
            <Row label="Indicação">{buyer.referralCode || 'Não informado'}</Row>
            <Row label="Observação">{buyer.note || 'Não informada'}</Row>
          </dl>
        ) : null}
      </section>

      <section aria-labelledby="review-wallet" className="flex flex-col gap-3 rounded-md bg-card p-5">
        <div className="flex items-center justify-between gap-4">
          <h3 id="review-wallet" className="text-body-lg font-bold text-foreground">
            Carteira e rede
          </h3>
          <Button type="button" variant="link" size="sm" onClick={() => edit('carteira')}>
            Editar<span className="sr-only"> carteira e rede</span>
          </Button>
        </div>
        {wallet && provider ? (
          <dl className="flex flex-col gap-2">
            <Row label="Carteira">{walletTitle(wallet)}</Row>
            <Row label="Endereço">{walletAddressLabel(wallet)}</Row>
            <Row label="Rede">{networkNames[wallet.network]}</Row>
            <Row label="Provedor">{walletTypeNames[provider]}</Row>
          </dl>
        ) : null}
      </section>
    </div>
  )
}
