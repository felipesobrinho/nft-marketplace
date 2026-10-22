import bcrypt from 'bcryptjs'
import { describe, expect, it } from 'vitest'
import { walletInputSchema } from '@/shared/contracts/account'
import { compareEth } from '@/shared/domain/eth'
import { nftRecordSchema } from '../schema'
import { buildCouponSeed, buildFavoriteSeed, buildUserSeed, buildWalletSeed } from './accounts'
import { buildNftSeed } from './nfts'

const nfts = buildNftSeed()

describe('seed de NFTs', () => {
  it('tem 54 NFTs válidos pelo schema, com ids e tokens únicos', () => {
    expect(nfts).toHaveLength(54)
    for (const nft of nfts) expect(() => nftRecordSchema.parse(nft)).not.toThrow()
    expect(new Set(nfts.map((nft) => nft.id)).size).toBe(54)
    expect(new Set(nfts.map((nft) => nft.tokenId)).size).toBe(54)
    expect(new Set(nfts.map((nft) => nft.name)).size).toBe(54)
  })

  it('é determinístico', () => {
    expect(buildNftSeed()).toEqual(nfts)
  })

  it('o ID do token bate com o número do nome', () => {
    for (const nft of nfts) {
      const number = Number(/#(\d+)$/.exec(nft.name)?.[1])
      expect(nft.tokenId).toBe(number)
      expect(nft.id).toBe(`nft-${String(nft.tokenId).padStart(4, '0')}`)
    }
  })

  it('usa só as 4 artes do Figma', () => {
    const arts = new Set(nfts.map((nft) => nft.image.src))
    expect([...arts].sort()).toEqual([
      '/nfts/emerald-ape',
      '/nfts/golden-beat',
      '/nfts/ivory-baron',
      '/nfts/violet-nomad',
    ])
  })

  it('cobre todas as categorias e redes do filtro', () => {
    const byCollection = new Map<string, number>()
    for (const nft of nfts)
      byCollection.set(nft.collection.id, (byCollection.get(nft.collection.id) ?? 0) + 1)
    expect(byCollection.size).toBe(9)
    for (const count of byCollection.values()) expect(count).toBeGreaterThanOrEqual(4)
    const networks = new Set(nfts.map((nft) => nft.network))
    expect([...networks].sort()).toEqual(['ethereum', 'polygon', 'solana'])
  })

  it('preço do NFT é o menor entre as edições disponíveis', () => {
    for (const nft of nfts) {
      const open = nft.editions.filter((edition) => edition.status === 'available')
      const pool = open.length > 0 ? open : nft.editions
      const lowest = pool.reduce(
        (best, edition) => (compareEth(edition.price, best) < 0 ? edition.price : best),
        pool[0]!.price,
      )
      expect(nft.price).toBe(lowest)
      expect(nft.availability).toBe(open.length > 0 ? 'available' : 'sold_out')
    }
  })

  it('edição esgotada sempre tem disponível zero e preço anterior é maior que o atual', () => {
    for (const nft of nfts) {
      for (const edition of nft.editions) {
        if (edition.status === 'sold_out') expect(edition.available).toBe(0)
        else expect(edition.available === null || edition.available > 0).toBe(true)
      }
      if (nft.previousPrice !== null) expect(compareEth(nft.previousPrice, nft.price)).toBe(1)
    }
  })

  it('tem os casos de edição que os testes precisam', () => {
    expect(nfts.filter((nft) => nft.editions.length >= 2).length).toBeGreaterThanOrEqual(15)
    expect(nfts.filter((nft) => nft.availability === 'sold_out')).toHaveLength(2)
    const partly = nfts.filter(
      (nft) =>
        nft.availability === 'available' && nft.editions.some((edition) => edition.status === 'sold_out'),
    )
    expect(partly.length).toBeGreaterThanOrEqual(3)
    const singleOne = nfts.filter(
      (nft) =>
        nft.editions.length === 1 && nft.editions[0]?.label === '1/1' && nft.availability === 'available',
    )
    expect(singleOne.length).toBeGreaterThanOrEqual(3)
  })

  it('tem destaques, abas e faixa de preço do Figma', () => {
    expect(nfts.filter((nft) => nft.featured === 'hero')).toHaveLength(3)
    expect(nfts.filter((nft) => nft.featured === 'spotlight').map((nft) => nft.name)).toEqual([
      'Sage Nomad #009',
    ])
    expect(nfts.filter((nft) => nft.isNew)).toHaveLength(12)
    expect(nfts.filter((nft) => nft.isTrending)).toHaveLength(12)
    const prices = nfts.map((nft) => nft.price).sort(compareEth)
    expect(prices[0]).toBe('0.02')
    expect(prices.at(-1)).toBe('12.30')
  })

  it('o Emerald Ape #042 segue o render do detalhe', () => {
    const ape = nfts.find((nft) => nft.id === 'nft-0042')
    expect(ape?.price).toBe('1.19')
    expect(ape?.editions.map((edition) => edition.label)).toEqual(['1/1', '1/10', '1/50', 'Aberta'])
    expect(ape?.rating).toEqual({ average: 4.8, count: 19 })
    expect(ape?.attributes).toEqual(['Óculos', 'Esmeralda', 'Raro'])
  })
})

describe('seed de contas', () => {
  it('guarda a senha só como hash bcrypt de Senha@123', () => {
    for (const user of buildUserSeed()) {
      expect(user.passwordHash).not.toContain('Senha')
      expect(bcrypt.compareSync('Senha@123', user.passwordHash)).toBe(true)
    }
  })

  it('Ana tem carteira principal e secundária válidas; Bruno não tem carteira', () => {
    const wallets = buildWalletSeed()
    expect(wallets.filter((wallet) => wallet.userId === 'user-ana').map((wallet) => wallet.role)).toEqual([
      'primary',
      'secondary',
    ])
    expect(wallets.some((wallet) => wallet.userId === 'user-bruno')).toBe(false)
    for (const wallet of wallets) expect(() => walletInputSchema.parse(wallet)).not.toThrow()
  })

  it('favoritos apontam para NFTs que existem', () => {
    const ids = new Set(nfts.map((nft) => nft.id))
    for (const favorite of buildFavoriteSeed()) expect(ids.has(favorite.nftId)).toBe(true)
  })

  it('tem JUNGLE10 válido e VELHO20 expirado', () => {
    const now = Date.parse('2026-10-21T12:00:00.000Z')
    const coupons = new Map(
      buildCouponSeed().map((coupon) => [coupon.code, Date.parse(coupon.expiresAt) > now]),
    )
    expect(coupons.get('JUNGLE10')).toBe(true)
    expect(coupons.get('VELHO20')).toBe(false)
  })
})
