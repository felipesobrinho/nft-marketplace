import { lazyRouteComponent } from '@tanstack/react-router'

export {
  type SaveWalletInput,
  useConnectWallet,
  useDisconnectWallet,
  useSaveWallet,
  useWallets,
  walletKeys,
  walletsQuery,
} from './application/wallets'

export const WalletsPage = lazyRouteComponent(() => import('./ui/WalletsPage'), 'WalletsPage')
