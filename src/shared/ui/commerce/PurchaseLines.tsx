import type { QuoteLine } from '@/shared/contracts/commerce'
import { formatEth, formatTokenId } from '@/shared/domain/format'
import { cn } from '@/shared/ui/lib/utils'
import { NftImage } from './NftImage'

export interface PurchaseLinesProps {
  lines: readonly QuoteLine[]
  caption: string
  className?: string
}

export function PurchaseLines({ lines, caption, className }: PurchaseLinesProps) {
  return (
    <table className={cn('w-full table-fixed border-collapse text-left', className)}>
      <caption className="sr-only">{caption}</caption>
      <colgroup>
        <col />
        <col className="w-12" />
        <col className="w-28" />
      </colgroup>
      <thead>
        <tr className="border-b border-border">
          <th scope="col" className="pb-3 text-small font-medium text-foreground">
            NFT
          </th>
          <th scope="col" className="pb-3 text-center text-small font-medium text-foreground">
            Qtd.
          </th>
          <th scope="col" className="pb-3 text-right text-small font-medium text-foreground">
            Subtotal
          </th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => (
          <tr key={line.editionId} data-purchase-line className="border-b border-border-soft last:border-b-0">
            <td className="py-3 pr-2 align-middle sm:pr-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="size-12 shrink-0 sm:size-14">
                  <NftImage src={line.image.src} alt="" sizes="56px" className="size-full rounded-sm" />
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="line-clamp-2 text-body font-bold break-words text-foreground">
                    {line.name}
                  </span>
                  <span className="text-caption text-subtle">
                    Edição {line.editionLabel} · {formatTokenId(line.tokenId)}
                  </span>
                </div>
              </div>
            </td>
            <td className="py-3 text-center align-middle text-body text-muted-foreground">
              <span aria-hidden="true">x </span>
              {line.quantity}
            </td>
            <td className="py-3 text-right align-middle text-body font-bold text-highlight">
              {formatEth(line.lineTotal)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
