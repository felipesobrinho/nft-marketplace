import { Link } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import type { CartItem } from '@/shared/contracts/commerce'
import { formatEth, formatTokenId } from '@/shared/domain/format'
import { Badge } from '@/shared/ui/components/ui/badge'
import { Button } from '@/shared/ui/components/ui/button'
import { NftImage } from '@/shared/ui/commerce/NftImage'
import { QuantityStepper } from '@/shared/ui/commerce/QuantityStepper'
import { useAnnounce } from '@/shared/ui/feedback/LiveAnnouncer'
import { useRemoveCartItem, useUpdateCartItem } from '../application/mutations'

const rowGrid =
  'grid grid-cols-2 items-center gap-x-4 gap-y-3 md:grid-cols-[minmax(0,1fr)_6.5rem_8.5rem_7rem_2.75rem]'

export function CartTableHeader() {
  return (
    <div role="row" className={`${rowGrid} hidden px-4 pb-3 text-small font-medium text-foreground md:grid`}>
      <div role="columnheader">NFT</div>
      <div role="columnheader">Preço</div>
      <div role="columnheader">Quantidade</div>
      <div role="columnheader">Total</div>
      <div role="columnheader">
        <span className="sr-only">Remover</span>
      </div>
    </div>
  )
}

export function CartLine({ item }: { item: CartItem }) {
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  const announce = useAnnounce()
  const soldOut = item.status === 'sold_out'
  const limited = item.status === 'limited'

  function changeQuantity(quantity: number) {
    update.mutate({ itemId: item.id, quantity })
  }

  function removeItem() {
    remove.mutate(item.id)
    announce(`${item.name} saiu do carrinho.`)
  }

  return (
    <div role="row" data-cart-line className={`${rowGrid} rounded-md bg-card p-4`}>
      <div
        role="cell"
        className="order-1 col-span-2 flex min-w-0 items-center gap-4 md:order-none md:col-span-1"
      >
        <div className="size-20 shrink-0 md:size-16">
          <NftImage src={item.image.src} alt={item.image.alt} sizes="80px" className="size-full rounded-md" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            to="/nft/$nftId"
            params={{ nftId: item.nftId }}
            className="text-body-lg font-bold text-foreground hover:text-highlight"
          >
            {item.name}
          </Link>
          <p className="text-caption text-subtle">
            Edição {item.editionLabel} · ID do token {formatTokenId(item.tokenId)}
          </p>
        </div>
      </div>
      <div role="cell" className="order-2 flex flex-col md:order-none">
        <span className="text-caption text-muted-foreground md:sr-only">Preço</span>
        <span className="text-body text-foreground">{formatEth(item.unitPrice)}</span>
      </div>
      <div role="cell" className="order-4 md:order-none">
        <QuantityStepper
          size="sm"
          value={item.quantity}
          max={item.maxQuantity}
          label={`Quantidade de ${item.name}`}
          disabled={soldOut}
          {...(soldOut ? { limitReason: 'Edição esgotada' } : {})}
          onChange={changeQuantity}
        />
      </div>
      <div role="cell" className="order-3 flex flex-col items-end md:order-none md:items-start">
        <span className="text-caption text-muted-foreground md:sr-only">Total</span>
        <span className="text-body font-bold text-highlight">{formatEth(item.lineTotal)}</span>
      </div>
      <div role="cell" className="order-5 flex justify-end md:order-none">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Remover ${item.name} do carrinho`}
          onClick={removeItem}
          className="text-highlight"
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
      {limited ? (
        <div role="cell" className="order-6 col-span-full md:order-none">
          <div role="status" className="flex flex-wrap items-center gap-x-3 text-small text-highlight">
            <p>Só é possível comprar {item.maxQuantity} desta edição agora.</p>
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => changeQuantity(item.maxQuantity)}
              className="px-0"
            >
              Ajustar
            </Button>
          </div>
        </div>
      ) : null}
      {soldOut ? (
        <div role="cell" className="order-6 col-span-full flex flex-wrap items-center gap-3 md:order-none">
          <Badge variant="secondary">Esgotada</Badge>
          <p className="text-small text-muted-foreground">Esta edição esgotou e não entra no total.</p>
        </div>
      ) : null}
    </div>
  )
}
