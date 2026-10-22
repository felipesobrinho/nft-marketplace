import { MessageSquare } from 'lucide-react'
import type { NftDetail } from '@/shared/contracts/catalog'
import { networkNames } from '@/shared/contracts/common'
import { formatDate, shortenAddress } from '@/shared/domain/format'
import { EmptyState, Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui'

function Details({ nft }: { nft: NftDetail }) {
  const royalties = nft.royaltiesBps / 100
  const rows = [
    {
      label: 'Rede',
      text: `Cunhado na ${networkNames[nft.network]} com procedência imutável e metadados armazenados no IPFS.`,
    },
    {
      label: 'Contrato',
      text: `${shortenAddress(nft.contractAddress)} · Contrato inteligente ERC-721 verificado.`,
    },
    {
      label: 'Direitos autorais',
      text: `Direitos autorais do criador: ${royalties.toLocaleString('pt-BR')}% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.`,
    },
    { label: 'Criador', text: nft.creator },
  ]
  return (
    <div className="flex flex-col gap-6 text-small text-muted-foreground">
      <div className="flex flex-col gap-4">
        {nft.story.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <dl className="flex flex-col gap-4">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-1">
            <dt className="font-bold text-foreground">{row.label}:</dt>
            <dd>{row.text}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function Reviews({ nft }: { nft: NftDetail }) {
  if (nft.reviews.length === 0) {
    return (
      <EmptyState
        title="Ainda não há avaliações"
        description="As avaliações dos colecionadores aparecem aqui."
        icon={<MessageSquare className="size-6" />}
      />
    )
  }
  return (
    <ul className="flex flex-col gap-4">
      {nft.reviews.map((review) => (
        <li key={review.id} className="flex flex-col gap-1 rounded-md bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-body font-bold text-foreground">{review.author}</p>
            <time dateTime={review.createdAt} className="text-caption text-subtle">
              {formatDate(review.createdAt)}
            </time>
          </div>
          <p className="text-small text-highlight">Nota {review.rating} de 5</p>
          <p className="text-small text-muted-foreground">{review.comment}</p>
        </li>
      ))}
    </ul>
  )
}

export function NftTabs({ nft }: { nft: NftDetail }) {
  return (
    <section aria-label="Informações do NFT" className="page py-8 md:py-12">
      <Tabs defaultValue="details" className="gap-6">
        <TabsList className="justify-center gap-4 md:gap-6">
          <TabsTrigger value="details" className="min-h-11 whitespace-normal text-center">
            Detalhes do NFT
          </TabsTrigger>
          <TabsTrigger value="reviews" className="min-h-11 whitespace-normal text-center">
            Avaliações de colecionadores ({nft.rating.count})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <Details nft={nft} />
        </TabsContent>
        <TabsContent value="reviews">
          <Reviews nft={nft} />
        </TabsContent>
      </Tabs>
    </section>
  )
}
