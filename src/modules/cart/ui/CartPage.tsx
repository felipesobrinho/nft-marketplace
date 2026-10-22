import { useId } from 'react'
import { Link } from '@tanstack/react-router'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/shared/ui/components/ui/button'
import { EmptyState } from '@/shared/ui/feedback/EmptyState'
import { ErrorState } from '@/shared/ui/feedback/ErrorState'
import { MobileTopBar } from '@/shared/ui/layout/MobileTopBar'
import { useCart } from '../application/queries'
import { useCartQuote } from '../application/mutations'
import { useCartChangeNotice } from '../application/realtime'
import { AlsoViewed } from './AlsoViewed'
import { CartLine, CartTableHeader } from './CartLine'
import { CartSkeleton } from './CartSkeleton'
import { CouponForm } from './CouponForm'
import { OrderSummary } from './OrderSummary'

function Breadcrumb() {
  return (
    <nav aria-label="Trilha de navegação" className="hidden pb-6 text-small text-muted-foreground md:block">
      <ol className="flex items-center gap-2">
        <li>
          <Link to="/" className="hover:text-highlight">
            Início
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link to="/" hash="catalogo" className="hover:text-highlight">
            Mercado
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="text-foreground">
          Carrinho
        </li>
      </ol>
    </nav>
  )
}

export function CartPage() {
  const cart = useCart()
  const data = cart.data
  const quote = useCartQuote('ethereum', data)
  const notice = useCartChangeNotice()
  const blockedId = useId()

  const items = data?.items ?? []
  const hasSoldOut = items.some((item) => item.status === 'sold_out')
  const hasIssues = (quote.data?.issues.length ?? 0) > 0
  const blocked = hasSoldOut || hasIssues

  return (
    <>
      <MobileTopBar title="Carrinho de NFTs" backTo={{ to: '/' }} />
      <div className="page flex flex-col gap-12 py-4 md:py-8">
        <div>
          <Breadcrumb />
          <h1 className="sr-only">Carrinho de NFTs</h1>
          {data === undefined && cart.isPending ? (
            <CartSkeleton />
          ) : data === undefined ? (
            <ErrorState
              title="Não foi possível carregar o carrinho"
              message="Verifique sua conexão e tente de novo."
              onRetry={() => void cart.refetch()}
              isRetrying={cart.isFetching}
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon={<ShoppingCart className="size-6" />}
              title="Seu carrinho está vazio"
              description="Explore o catálogo e escolha as edições que quer colecionar."
              action={
                <Button asChild>
                  <Link to="/" hash="catalogo">
                    Explorar o catálogo
                  </Link>
                </Button>
              }
            />
          ) : (
            <>
              {notice.message ? (
                <div
                  data-cart-notice
                  className="mb-6 flex flex-wrap items-center justify-between gap-3 border-l-4 border-primary bg-surface-raised p-4 text-small text-foreground"
                >
                  <p>{notice.message}</p>
                  <Button type="button" variant="link" size="sm" onClick={notice.dismiss}>
                    Entendi
                  </Button>
                </div>
              ) : null}
              <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_21rem] xl:gap-12">
                <div role="table" aria-label="Itens do carrinho" className="flex flex-col gap-3">
                  <CartTableHeader />
                  {items.map((item) => (
                    <CartLine key={item.id} item={item} />
                  ))}
                </div>
                <div className="xl:sticky xl:top-24">
                  <OrderSummary
                    quote={quote.data}
                    isLoading={quote.isPending}
                    isError={quote.isError}
                    onRetry={() => void quote.refetch()}
                    beforeRows={<CouponForm coupon={data.coupon} />}
                  >
                    <div className="flex flex-col gap-3">
                      {blocked ? (
                        <>
                          <Button type="button" disabled aria-describedby={blockedId} className="w-full">
                            Conectar e finalizar
                          </Button>
                          <p id={blockedId} className="text-small text-muted-foreground">
                            Remova os itens esgotados para continuar.
                          </p>
                        </>
                      ) : (
                        <Button asChild className="w-full">
                          <Link to="/pagamento">Conectar e finalizar</Link>
                        </Button>
                      )}
                      <Button asChild variant="link">
                        <Link to="/">Continuar explorando</Link>
                      </Button>
                    </div>
                  </OrderSummary>
                </div>
              </div>
            </>
          )}
        </div>
        <AlsoViewed excludeNftIds={items.map((item) => item.nftId)} />
      </div>
    </>
  )
}
