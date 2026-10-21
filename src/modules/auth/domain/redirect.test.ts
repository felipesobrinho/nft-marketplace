import { describe, expect, it } from 'vitest'
import { safeRedirect } from './redirect'

describe('retorno depois do login', () => {
  it('aceita caminho interno com busca e âncora', () => {
    expect(safeRedirect('/pagamento')).toBe('/pagamento')
    expect(safeRedirect('/?network=polygon&page=2#catalogo')).toBe('/?network=polygon&page=2#catalogo')
  })

  it('recusa endereço externo, protocolo relativo e barra invertida', () => {
    expect(safeRedirect('https://malicioso.example')).toBe('/')
    expect(safeRedirect('//malicioso.example')).toBe('/')
    expect(safeRedirect('/\\malicioso.example')).toBe('/')
    expect(safeRedirect('javascript:alert(1)')).toBe('/')
  })

  it('não volta para as próprias telas de login e cadastro', () => {
    expect(safeRedirect('/entrar')).toBe('/')
    expect(safeRedirect('/cadastro?redirect=/x')).toBe('/')
  })

  it('usa o início quando não há destino', () => {
    expect(safeRedirect(undefined)).toBe('/')
    expect(safeRedirect('')).toBe('/')
  })
})
