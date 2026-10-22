import { ETH_DECIMALS, parseEth, type Wei } from './eth'

const MIN_FRACTION = 2
const MAX_FRACTION = 4

function roundToFraction(wei: Wei, digits: number): Wei {
  const step = 10n ** BigInt(ETH_DECIMALS - digits)
  const remainder = wei % step
  const floor = wei - remainder
  return remainder * 2n >= step ? floor + step : floor
}

function toWei(value: string | Wei): Wei {
  return typeof value === 'bigint' ? value : parseEth(value)
}

export function ethFractionDigits(value: string | Wei): number {
  const wei = toWei(value)
  const rounded = roundToFraction(wei < 0n ? -wei : wei, MAX_FRACTION)
  const fraction = (rounded % 10n ** BigInt(ETH_DECIMALS))
    .toString()
    .padStart(ETH_DECIMALS, '0')
    .slice(0, MAX_FRACTION)
    .replace(/0+$/, '')
  return Math.max(MIN_FRACTION, fraction.length)
}

export function commonEthDigits(...values: readonly (string | Wei)[]): number {
  return values.reduce<number>((digits, value) => Math.max(digits, ethFractionDigits(value)), MIN_FRACTION)
}

export function formatEthNumber(value: string | Wei, digits?: number): string {
  const wei = toWei(value)
  const negative = wei < 0n
  const places = digits === undefined ? MAX_FRACTION : Math.min(Math.max(digits, 0), MAX_FRACTION)
  const rounded = roundToFraction(negative ? -wei : wei, places)
  const unit = 10n ** BigInt(ETH_DECIMALS)
  const whole = (rounded / unit).toString()
  const raw = (rounded % unit).toString().padStart(ETH_DECIMALS, '0').slice(0, places)
  const fraction = digits === undefined ? raw.replace(/0+$/, '').padEnd(MIN_FRACTION, '0') : raw
  const sign = negative && rounded > 0n ? '-' : ''
  return fraction ? `${sign}${whole}.${fraction}` : `${sign}${whole}`
}

export function formatEth(value: string | Wei, digits?: number): string {
  return `${formatEthNumber(value, digits)} ETH`
}

export function formatEthDiscount(value: string | Wei, digits?: number): string {
  const wei = toWei(value)
  return wei === 0n ? formatEth(0n, digits) : `-${formatEth(wei < 0n ? -wei : wei, digits)}`
}

export function formatEthSpoken(value: string | Wei): string {
  return `${formatEthNumber(value).replace('.', ',')} ether`
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
})
const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
})
const integerFormatter = new Intl.NumberFormat('pt-BR')
const ratingFormatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso))
}

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso))
}

export function formatCount(value: number): string {
  return integerFormatter.format(value)
}

export function formatRating(average: number, count: number): string {
  return `${ratingFormatter.format(average)} (${formatCount(count)})`
}

export function formatTokenId(tokenId: number): string {
  return `#${tokenId.toString().padStart(4, '0')}`
}

export function shortenAddress(address: string): string {
  if (address.length <= 12) return address
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export function formatEnsName(name: string): string {
  return name.endsWith('.eth') ? name : `${name}.eth`
}
