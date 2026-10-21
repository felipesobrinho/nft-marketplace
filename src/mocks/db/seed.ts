import type { NftRecord } from './schema'

type Art = 'emerald-ape' | 'violet-nomad' | 'ivory-baron' | 'golden-beat'

const artAlt: Record<Art, string> = {
  'emerald-ape': 'Macaco de óculos redondos e jaqueta verde de colégio, com colar de esmeralda',
  'violet-nomad': 'Gorila de chapéu verde-claro e moletom roxo com capuz',
  'ivory-baron': 'Gorila de pelo escuro com gola alta verde e blazer marfim',
  'golden-beat': 'Orangotango de pelo dourado com fones de ouvido verdes e jaqueta clara',
}

function nft(index: number, name: string, tokenId: number, art: Art, price: string): NftRecord {
  const id = `nft-${String(tokenId).padStart(4, '0')}`
  return {
    id,
    name,
    tokenId,
    collection: { id: 'kurio-apes', name: 'Kurio Apes' },
    network: 'ethereum',
    image: { src: `/nfts/${art}`, alt: artAlt[art] },
    price,
    previousPrice: null,
    badge: null,
    availability: 'available',
    listedAt: new Date(Date.UTC(2026, 8, 30 - index, 12)).toISOString(),
    version: 1,
    description: `Um colecionável digital finalizado à mão da coleção Kurio Apes, verificado na Ethereum.`,
    story: [`${name} é uma obra digital da coleção Kurio Apes.`],
    creator: 'Nova Sato',
    contractAddress: `0x7a42${'0'.repeat(32)}19e8`,
    royaltiesBps: 500,
    attributes: ['Raro'],
    rating: { average: 4.8, count: 19 },
    editions: [
      {
        id: `${id}-e1`,
        label: '1/10',
        supply: 10,
        available: 6,
        price,
        maxPerOrder: 3,
        status: 'available',
      },
    ],
    reviews: [],
    isNew: index < 2,
    isTrending: index % 2 === 0,
    featured: index === 0 ? 'hero' : null,
  }
}

export function buildSeed(): NftRecord[] {
  return [
    nft(0, 'Emerald Ape #042', 42, 'emerald-ape', '1.19'),
    nft(1, 'Violet Nomad #314', 314, 'violet-nomad', '1.39'),
    nft(2, 'Ivory Baron #088', 88, 'ivory-baron', '1.79'),
    nft(3, 'Golden Beat #207', 207, 'golden-beat', '0.99'),
  ]
}
