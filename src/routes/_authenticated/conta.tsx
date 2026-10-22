import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AccountShell } from '@/modules/profile'

export const Route = createFileRoute('/_authenticated/conta')({
  component: AccountLayout,
})

function AccountLayout() {
  return (
    <AccountShell>
      <Outlet />
    </AccountShell>
  )
}
