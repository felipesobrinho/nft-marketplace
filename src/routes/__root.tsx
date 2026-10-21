import type { QueryClient } from '@tanstack/react-query'
import { RealtimeConnection } from '@/app/RealtimeConnection'
import { CartHeaderLink } from '@/modules/cart'
import { CatalogSearchForm } from '@/modules/catalog'
import { NftUpdateAnnouncer } from '@/modules/nft'
import { createRootRouteWithContext, HeadContent, Outlet } from '@tanstack/react-router'
import { NotFoundPage } from '@/shared/ui/feedback/NotFoundPage'
import { RouteError } from '@/shared/ui/feedback/RouteError'
import { Toaster } from '@/shared/ui/components/ui/sonner'
import { TooltipProvider } from '@/shared/ui/components/ui/tooltip'
import { LiveAnnouncerProvider } from '@/shared/ui/feedback/LiveAnnouncer'
import { Footer, Header, HeaderLoginLink, HeaderSearchButton, MobileNav } from '@/shared/ui/layout'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { title: 'Kurio | Marketplace de NFTs' },
      {
        name: 'description',
        content:
          'Kurio: marketplace de NFTs com arte digital selecionada de criadores emergentes e consagrados.',
      },
    ],
  }),
  component: RootLayout,
  notFoundComponent: NotFoundPage,
  errorComponent: RouteError,
})

function RootLayout() {
  return (
    <>
      <HeadContent />
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-sm focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>
      <LiveAnnouncerProvider>
        <TooltipProvider>
          <div className="flex min-h-dvh flex-col pb-24 md:pb-0">
            <Header
              searchSlot={
                <HeaderSearchButton
                  form={(close) => <CatalogSearchForm variant="header" onSubmitted={close} />}
                />
              }
              cartSlot={<CartHeaderLink />}
              accountSlot={<HeaderLoginLink />}
            />
            <main id="conteudo" tabIndex={-1} className="min-h-dvh flex-1 outline-none">
              <Outlet />
            </main>
            <div className="mt-16">
              <Footer />
            </div>
          </div>
          <MobileNav />
          <Toaster position="bottom-center" />
          <RealtimeConnection />
          <NftUpdateAnnouncer />
        </TooltipProvider>
      </LiveAnnouncerProvider>
    </>
  )
}
