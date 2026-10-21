import { lazyRouteComponent } from '@tanstack/react-router'

export {
  profileKeys,
  profileQuery,
  useChangePassword,
  useProfile,
  useUpdateAvatar,
  useUpdateProfile,
} from './application/profile'
export { AccountShell } from './ui/AccountShell'

export const ProfilePage = lazyRouteComponent(() => import('./ui/ProfilePage'), 'ProfilePage')
