import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { configureRequests } from './configureRequests'
import { createQueryClient } from './queryClient'
import { createAppRouter } from './router'

configureRequests()

const queryClient = createQueryClient()
const router = createAppRouter(queryClient)

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
