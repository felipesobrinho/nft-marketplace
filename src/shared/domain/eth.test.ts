import { describe, expect, it } from 'vitest'
import { addEth, compareEth, isEthString, multiplyEth, parseEth, percentOf, toEthString } from './eth'

describe('eth', () => {
  it('aceita só decimal com ponto e até 18 casas', () => {
    expect(isEthString('1.19')).toBe(true)
    expect(isEthString('0.000000000000000001')).toBe(true)
    expect(isEthString('0.0000000000000000001')).toBe(false)
    expect(isEthString('1,19')).toBe(false)
    expect(isEthString('01.2')).toBe(false)
    expect(isEthString('-1')).toBe(false)
    expect(() => parseEth('abc')).toThrow(RangeError)
  })

  it('converte ida e volta sem perder precisão', () => {
    expect(parseEth('1.19')).toBe(1_190_000_000_000_000_000n)
    expect(toEthString(parseEth('26.846'))).toBe('26.846')
    expect(toEthString(parseEth('2.000'))).toBe('2')
    expect(toEthString(1n)).toBe('0.000000000000000001')
  })

  it('soma e multiplica sem erro de ponto flutuante', () => {
    expect(addEth('0.1', '0.2')).toBe('0.3')
    expect(multiplyEth('1.19', 2)).toBe('2.38')
    expect(multiplyEth('1.79', 9)).toBe('16.11')
    expect(addEth('2.38', '8.34', '16.11', '0.016')).toBe('26.846')
  })

  it('calcula percentual em pontos-base com arredondamento para baixo', () => {
    expect(toEthString(percentOf(parseEth('26.83'), 1_000))).toBe('2.683')
    expect(toEthString(percentOf(parseEth('0.000000000000000009'), 1_000))).toBe('0')
    expect(() => percentOf(1n, 10_001)).toThrow(RangeError)
  })

  it('compara valores', () => {
    expect(compareEth('1.2', '1.19')).toBe(1)
    expect(compareEth('1.190', '1.19')).toBe(0)
    expect(compareEth('0.99', '1')).toBe(-1)
  })
})
