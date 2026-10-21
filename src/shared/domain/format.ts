import { ETH_DECIMALS, parseEth, type Wei } from './eth'

const MIN_FRACTION = 2
const MAX_FRACTION = 4

function roundToFraction(wei: Wei, digits: number): Wei {
  const step = 10n ** BigInt(ETH_DECIMALS - digits)
  const remainder = wei % step
  const floor = wei - remainder
  return remainder * 2n >= step ? floor + step : floor
}

export function formatEthNumber(value: string | Wei): string {
  const wei = typeof value === 'bigint' ? value : parseEth(value)
  const negative = wei < 0n
  const rounded = roundToFraction(negative ? -wei : wei, MAX_FRACTION)
  const unit = 10n ** BigInt(ETH_DECIMALS)
  const whole = (rounded / unit).toString()
  const fraction = (rounded % unit)
    .toString()
    .padStart(ETH_DECIMALS, '0')
    .slice(0, MAX_FRACTION)
    .replace(/0+$/, '')
    .padEnd(MIN_FRACTION, '0')
  return `${negative && rounded > 0n ? '-' : ''}${whole}.${fraction}`
}

export function formatEth(value: string | Wei): string {
  return `${formatEthNumber(value)} ETH`
}

export function formatEthDiscount(value: string | Wei): string {
  const wei = typeof value === 'bigint' ? value : parseEth(value)
  return wei === 0n ? formatEth(0n) : `-${formatEth(wei < 0n ? -wei : wei)}`
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
