import { AVATAR_MAX_BYTES, avatarMimeTypes } from '@/shared/contracts/account'

export interface AvatarCandidate {
  type: string
  size: number
}

const allowed: ReadonlySet<string> = new Set(avatarMimeTypes)

export function avatarProblem(file: AvatarCandidate): string | null {
  if (!allowed.has(file.type)) return 'Envie uma imagem PNG, JPEG ou WebP.'
  if (file.size === 0) return 'O arquivo está vazio.'
  if (file.size > AVATAR_MAX_BYTES) return 'Envie uma imagem de até 1 MB.'
  return null
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0] ?? ''
  const last = parts[parts.length - 1] ?? ''
  const letters = parts.length > 1 ? `${first.charAt(0)}${last.charAt(0)}` : first.slice(0, 2)
  return letters.toUpperCase()
}
