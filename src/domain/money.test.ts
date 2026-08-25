import { describe, expect, it } from 'vitest'
import { fromCents, toCents } from './money'

describe('Valores monetários em centavos', () => {
  it('converte reais para centavos sem erro de ponto flutuante', () => {
    expect(toCents(49.9)).toBe(4990)
    expect(toCents(120)).toBe(12000)
  })

  it('converte centavos para reais para exibição', () => {
    expect(fromCents(4990)).toBe(49.9)
    expect(fromCents(12000)).toBe(120)
  })
})
