import { describe, expect, it } from 'vitest'
import { parseEth } from './eth'
import {
  formatDate,
  formatEth,
  formatEthDiscount,
  formatEthSpoken,
  formatRating,
  formatTokenId,
  shortenAddress,
} from './format'

describe('formatEth', () => {
  it('usa ponto, no mínimo 2 e no máximo 4 casas', () => {
    expect(formatEth('1.19')).toBe('1.19 ETH')
    expect(formatEth('2')).toBe('2.00 ETH')
    expect(formatEth('0.016')).toBe('0.016 ETH')
    expect(formatEth('26.846')).toBe('26.846 ETH')
    expect(formatEth('0.00004')).toBe('0.00 ETH')
    expect(formatEth('0.00005')).toBe('0.0001 ETH')
    expect(formatEth(parseEth('12.3'))).toBe('12.30 ETH')
  })

  it('mostra desconto com sinal e zero sem sinal', () => {
    expect(formatEthDiscount('2.683')).toBe('-2.683 ETH')
    expect(formatEthDiscount('0')).toBe('0.00 ETH')
  })

  it('tem versão falada para leitor de tela', () => {
    expect(formatEthSpoken('1.19')).toBe('1,19 ether')
  })
})

describe('outros formatadores', () => {
  it('formata data em pt-BR no fuso de Brasília', () => {
    expect(formatDate('2026-07-29T15:00:00.000Z')).toBe('29 de jul. de 2026')
  })

  it('formata avaliação, ID do token e endereço', () => {
    expect(formatRating(4.8, 19)).toBe('4.8 (19)')
    expect(formatTokenId(42)).toBe('#0042')
    expect(formatTokenId(314)).toBe('#0314')
    expect(shortenAddress('0xA91F00000000000000000000000000000000E82C')).toBe('0xA91F…E82C')
  })
})
