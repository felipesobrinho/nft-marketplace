import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { configureRequests } from './configureRequests'
import { configureSession } from './configureSession'
import { createQueryClient } from './queryClient'
import { createAppRouter } from './router'

configureRequests()

const queryClient = createQueryClient()
const router = createAppRouter(queryClient)
configureSession(router, queryClient)

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
