import { createFileRoute } from '@tanstack/react-router'
import { WalletsPage } from '@/modules/wallets'

export const Route = createFileRoute('/_authenticated/conta/carteiras')({
  head: () => ({ meta: [{ title: 'Carteiras | Kurio' }] }),
  component: WalletsPage,
})
