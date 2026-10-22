import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/nft/$nftId')({
  head: () => ({ meta: [{ title: 'NFT | Kurio' }] }),
  component: NftRoutePage,
})

function NftRoutePage() {
  return (
    <section className="page py-12">
      <h1 className="text-heading font-bold">Detalhes do NFT</h1>
    </section>
  )
}
