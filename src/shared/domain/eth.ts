export const ETH_DECIMALS = 18
const WEI_PER_ETH = 10n ** BigInt(ETH_DECIMALS)
const decimalPattern = /^(0|[1-9]\d*)(\.\d{1,18})?$/

export type Wei = bigint

export function isEthString(value: string): boolean {
  return decimalPattern.test(value)
}

export function parseEth(value: string): Wei {
  if (!isEthString(value)) throw new RangeError(`Valor em ETH inválido: "${value}"`)
  const [whole = '0', fraction = ''] = value.split('.')
  return BigInt(whole) * WEI_PER_ETH + BigInt(fraction.padEnd(ETH_DECIMALS, '0'))
}

export function toEthString(wei: Wei): string {
  if (wei < 0n) return `-${toEthString(-wei)}`
  const whole = wei / WEI_PER_ETH
  const fraction = (wei % WEI_PER_ETH).toString().padStart(ETH_DECIMALS, '0').replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : whole.toString()
}

export function multiplyWei(wei: Wei, quantity: number): Wei {
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw new RangeError(`Quantidade inválida: ${quantity}`)
  }
  return wei * BigInt(quantity)
}

export function sumWei(values: readonly Wei[]): Wei {
  return values.reduce((total, value) => total + value, 0n)
}

export function percentOf(wei: Wei, basisPoints: number): Wei {
  if (!Number.isSafeInteger(basisPoints) || basisPoints < 0 || basisPoints > 10_000) {
    throw new RangeError(`Percentual inválido: ${basisPoints}`)
  }
  return (wei * BigInt(basisPoints)) / 10_000n
}

export function addEth(...values: readonly string[]): string {
  return toEthString(sumWei(values.map(parseEth)))
}

export function multiplyEth(value: string, quantity: number): string {
  return toEthString(multiplyWei(parseEth(value), quantity))
}

export function compareEth(a: string, b: string): -1 | 0 | 1 {
  const left = parseEth(a)
  const right = parseEth(b)
  if (left === right) return 0
  return left < right ? -1 : 1
}
