import { describe, expect, it } from 'vitest'
import { dataUrlByteSize, findIdentityConflicts, normalizeIdentity, sortWallets } from './accounts'

const users = [
  { id: 'u1', email: 'ana@jungle.test', username: 'ana' },
  { id: 'u2', email: 'bruno@jungle.test', username: 'bruno' },
]

describe('normalizeIdentity', () => {
  it('trims and lowercases', () => {
    expect(normalizeIdentity('  Ana@Jungle.TEST ')).toBe('ana@jungle.test')
  })
})

describe('dataUrlByteSize', () => {
  it('counts decoded bytes without padding', () => {
    expect(dataUrlByteSize('data:image/png;base64,QUJD')).toBe(3)
  })

  it('discounts one padding character', () => {
    expect(dataUrlByteSize('data:image/png;base64,QUI=')).toBe(2)
  })

  it('discounts two padding characters', () => {
    expect(dataUrlByteSize('data:image/png;base64,QQ==')).toBe(1)
  })

  it('returns zero for an empty payload', () => {
    expect(dataUrlByteSize('data:image/png;base64,')).toBe(0)
  })

  it('scales to large payloads', () => {
    const payload = 'A'.repeat(1_400_000)
    expect(dataUrlByteSize(`data:image/jpeg;base64,${payload}`)).toBe(1_050_000)
  })
})

describe('findIdentityConflicts', () => {
  it('detects email ignoring case', () => {
    expect(findIdentityConflicts(users, { email: 'ANA@jungle.test', username: 'novo' })).toEqual(['email'])
  })

  it('detects username ignoring case', () => {
    expect(findIdentityConflicts(users, { email: 'novo@jungle.test', username: 'Bruno' })).toEqual([
      'username',
    ])
  })

  it('detects both fields', () => {
    expect(findIdentityConflicts(users, { email: 'ana@jungle.test', username: 'bruno' })).toEqual([
      'email',
      'username',
    ])
  })

  it('ignores the excluded user', () => {
    expect(findIdentityConflicts(users, { email: 'ana@jungle.test', username: 'ana' }, 'u1')).toEqual([])
  })

  it('returns nothing when free', () => {
    expect(findIdentityConflicts(users, { email: 'x@jungle.test', username: 'x' })).toEqual([])
  })
})

describe('sortWallets', () => {
  it('puts primary first then sorts by nickname', () => {
    const sorted = sortWallets([
      { role: 'secondary', nickname: 'Zeta' },
      { role: 'secondary', nickname: 'Alfa' },
      { role: 'primary', nickname: 'Principal' },
    ])
    expect(sorted.map((wallet) => wallet.nickname)).toEqual(['Principal', 'Alfa', 'Zeta'])
  })

  it('does not mutate the input', () => {
    const input = [
      { role: 'secondary' as const, nickname: 'B' },
      { role: 'primary' as const, nickname: 'A' },
    ]
    sortWallets(input)
    expect(input[0]?.nickname).toBe('B')
  })
})
