const FALLBACK = '/'
const blocked = ['/entrar', '/cadastro']

export function safeRedirect(target: string | null | undefined): string {
  if (!target || !target.startsWith('/') || target.startsWith('//') || target.includes('\\')) return FALLBACK
  try {
    const url = new URL(target, 'https://kurio.local')
    if (url.origin !== 'https://kurio.local') return FALLBACK
    if (blocked.some((path) => url.pathname === path)) return FALLBACK
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return FALLBACK
  }
}
