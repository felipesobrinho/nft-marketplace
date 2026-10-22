import { useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { type FormEvent, useId, useState } from 'react'
import { Input } from '@/shared/ui/components/ui/input'
import { Label } from '@/shared/ui/components/ui/label'
import { cn } from '@/shared/ui/lib/utils'

interface CatalogSearchFormProps {
  variant: 'header' | 'mobile'
  defaultValue?: string
  onSubmitted?: () => void
}

export function CatalogSearchForm({ variant, defaultValue = '', onSubmitted }: CatalogSearchFormProps) {
  const navigate = useNavigate()
  const inputId = useId()
  const [value, setValue] = useState(defaultValue)
  const isMobile = variant === 'mobile'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = value.trim()
    void navigate({
      to: '/',
      search: (previous) => ({ ...previous, q: query || undefined, page: 1 }),
      hash: 'catalogo',
    })
    onSubmitted?.()
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="relative w-full">
      <Label htmlFor={inputId} className="sr-only">
        Buscar NFTs
      </Label>
      {isMobile ? (
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-highlight"
        />
      ) : null}
      <Input
        id={inputId}
        type="search"
        name="q"
        value={value}
        maxLength={80}
        placeholder={isMobile ? 'Explorar coleções' : 'Buscar NFTs'}
        onChange={(event) => setValue(event.target.value)}
        className={cn(isMobile ? 'h-11 bg-card pl-12' : 'h-9 text-small')}
      />
    </form>
  )
}
