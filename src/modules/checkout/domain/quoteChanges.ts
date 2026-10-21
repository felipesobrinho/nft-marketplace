import type { Quote, QuoteIssue } from '@/shared/contracts/commerce'
import { compareEth } from '@/shared/domain/eth'
import { formatEth } from '@/shared/domain/format'

export type QuoteChange =
  | { kind: 'price'; name: string; editionLabel: string; from: string; to: string }
  | { kind: 'quantity'; name: string; editionLabel: string; from: number; to: number }
  | { kind: 'removed'; name: string; editionLabel: string }
  | { kind: 'added'; name: string; editionLabel: string }
  | { kind: 'coupon'; from: string | null; to: string | null }
  | { kind: 'fee'; from: string; to: string }
  | { kind: 'total'; from: string; to: string }

const blockingCodes: ReadonlySet<QuoteIssue['code']> = new Set(['out_of_stock', 'quantity_limit'])

export function compareQuotes(before: Quote, after: Quote): QuoteChange[] {
  const changes: QuoteChange[] = []
  const next = new Map(after.lines.map((line) => [line.editionId, line]))
  const previous = new Map(before.lines.map((line) => [line.editionId, line]))

  for (const line of before.lines) {
    const current = next.get(line.editionId)
    const label = { name: line.name, editionLabel: line.editionLabel }
    if (!current) {
      changes.push({ kind: 'removed', ...label })
      continue
    }
    if (compareEth(line.unitPrice, current.unitPrice) !== 0) {
      changes.push({ kind: 'price', ...label, from: line.unitPrice, to: current.unitPrice })
    }
    if (line.quantity !== current.quantity) {
      changes.push({ kind: 'quantity', ...label, from: line.quantity, to: current.quantity })
    }
  }
  for (const line of after.lines) {
    if (!previous.has(line.editionId)) {
      changes.push({ kind: 'added', name: line.name, editionLabel: line.editionLabel })
    }
  }

  const couponBefore = before.coupon?.code ?? null
  const couponAfter = after.coupon?.code ?? null
  if (couponBefore !== couponAfter) changes.push({ kind: 'coupon', from: couponBefore, to: couponAfter })
  if (compareEth(before.networkFee, after.networkFee) !== 0) {
    changes.push({ kind: 'fee', from: before.networkFee, to: after.networkFee })
  }
  if (compareEth(before.total, after.total) !== 0) {
    changes.push({ kind: 'total', from: before.total, to: after.total })
  }
  return changes
}

export function blockingIssues(quote: Quote): QuoteIssue[] {
  return quote.issues.filter((issue) => blockingCodes.has(issue.code))
}

export function canPurchase(quote: Quote): boolean {
  return quote.lines.length > 0 && blockingIssues(quote).length === 0
}

export function describeQuoteChange(change: QuoteChange): string {
  switch (change.kind) {
    case 'price':
      return `${change.name} (${change.editionLabel}): preço de ${formatEth(change.from)} para ${formatEth(change.to)}`
    case 'quantity':
      return `${change.name} (${change.editionLabel}): quantidade de ${change.from} para ${change.to}`
    case 'removed':
      return `${change.name} (${change.editionLabel}) saiu do pedido`
    case 'added':
      return `${change.name} (${change.editionLabel}) entrou no pedido`
    case 'coupon':
      if (change.from && !change.to) return `O cupom ${change.from} não vale mais`
      if (!change.from && change.to) return `Cupom ${change.to} aplicado`
      return `Cupom trocado de ${change.from ?? ''} para ${change.to ?? ''}`
    case 'fee':
      return `Taxa de rede de ${formatEth(change.from)} para ${formatEth(change.to)}`
    case 'total':
      return `Total de ${formatEth(change.from)} para ${formatEth(change.to)}`
  }
}
