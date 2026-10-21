import { Link } from '@tanstack/react-router'
import { PackageSearch } from 'lucide-react'
import { Button } from '@/shared/ui/components/ui/button'
import { MobileTopBar } from '@/shared/ui/layout/MobileTopBar'

export function OrderNotFound() {
  return (
    <>
      <MobileTopBar title="Pedido" backTo={{ to: '/' }} />
      <section className="page flex flex-col items-center gap-6 py-16 text-center">
        <PackageSearch className="size-10 text-highlight" aria-hidden="true" />
        <div className="flex flex-col gap-2">
          <h1 className="text-heading font-bold">Pedido não encontrado</h1>
          <p className="text-small text-muted-foreground">Ele não existe ou é de outra conta.</p>
        </div>
        <Button asChild>
          <Link to="/">Voltar ao início</Link>
        </Button>
      </section>
    </>
  )
}
