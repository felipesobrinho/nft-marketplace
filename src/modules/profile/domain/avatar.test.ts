import { describe, expect, it } from 'vitest'
import { avatarProblem, initialsOf } from './avatar'

describe('avatarProblem', () => {
  it('aceita PNG, JPEG e WebP de até 1 MB', () => {
    expect(avatarProblem({ type: 'image/png', size: 1_000_000 })).toBeNull()
    expect(avatarProblem({ type: 'image/jpeg', size: 20_000 })).toBeNull()
    expect(avatarProblem({ type: 'image/webp', size: 1 })).toBeNull()
  })

  it('recusa outro formato, arquivo vazio e arquivo grande', () => {
    expect(avatarProblem({ type: 'image/gif', size: 100 })).toBe('Envie uma imagem PNG, JPEG ou WebP.')
    expect(avatarProblem({ type: 'image/svg+xml', size: 100 })).toBe('Envie uma imagem PNG, JPEG ou WebP.')
    expect(avatarProblem({ type: 'image/png', size: 0 })).toBe('O arquivo está vazio.')
    expect(avatarProblem({ type: 'image/png', size: 1_000_001 })).toBe('Envie uma imagem de até 1 MB.')
  })
})

describe('initialsOf', () => {
  it('usa a primeira e a última palavra, ou as duas primeiras letras', () => {
    expect(initialsOf('Ana Lima')).toBe('AL')
    expect(initialsOf('Bruno de Souza Costa')).toBe('BC')
    expect(initialsOf('carla')).toBe('CA')
    expect(initialsOf('  ')).toBe('')
  })
})
