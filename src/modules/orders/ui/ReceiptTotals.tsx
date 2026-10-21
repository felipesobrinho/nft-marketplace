import type { Receipt } from '@/shared/contracts/commerce'
import { formatEth, formatEthDiscount } from '@/shared/domain/format'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-body text-foreground">{label}</dt>
      <dd className="text-body text-foreground">{value}</dd>
    </div>
  )
}

export function ReceiptTotals({ receipt }: { receipt: Receipt }) {
  return (
    <dl className="flex flex-col gap-2">
      <Row label="Subtotal" value={formatEth(receipt.subtotal)} />
      {receipt.coupon ? (
        <Row label={`Desconto (${receipt.coupon.code})`} value={formatEthDiscount(receipt.discount)} />
      ) : null}
      <Row label="Taxa de rede" value={formatEth(receipt.networkFee)} />
      <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
        <dt className="text-body font-bold text-foreground">Total</dt>
        <dd className="text-title font-bold text-highlight">{formatEth(receipt.total)}</dd>
      </div>
    </dl>
  )
}
