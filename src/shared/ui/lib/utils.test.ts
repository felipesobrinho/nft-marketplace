import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn com os tokens do projeto', () => {
  it('mantém cor e tamanho de texto juntos', () => {
    expect(cn('text-highlight', 'text-small')).toBe('text-highlight text-small')
    expect(cn('text-small text-foreground', 'text-muted-foreground')).toBe('text-small text-muted-foreground')
  })

  it('a última classe do mesmo grupo vence', () => {
    expect(cn('text-small', 'text-body')).toBe('text-body')
    expect(cn('bg-card', 'bg-surface-raised')).toBe('bg-surface-raised')
    expect(cn('rounded-sm', 'rounded-md')).toBe('rounded-md')
  })
})
