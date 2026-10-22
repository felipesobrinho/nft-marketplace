import { Button } from '@/shared/ui/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/components/ui/dialog'

export interface ExplorerDialogProps {
  reference: string
  networkName: string
}

export function ExplorerDialog({ reference, networkName }: ExplorerDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button">Ver no explorador (simulado)</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Explorador simulado</DialogTitle>
          <DialogDescription>Referência simulada. Nenhum site externo é aberto.</DialogDescription>
        </DialogHeader>
        <dl className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <dt className="text-caption text-muted-foreground">Rede</dt>
            <dd className="text-body text-foreground">{networkName}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-caption text-muted-foreground">Referência da transação</dt>
            <dd className="text-body break-all text-foreground">{reference}</dd>
          </div>
        </dl>
      </DialogContent>
    </Dialog>
  )
}
