/**
 * Testes para RN-004: Precificação e Margem de Lucro
 *
 * "Ao cadastrar ou atualizar o Preço de Custo e Preço de Venda, o sistema
 *  deve calcular automaticamente a Margem Bruta de Lucro nominal (R$) e
 *  percentual (%). Permite-se sobrescrever os preços no nível da variação,
 *  caso um tamanho especial tenha preço diferenciado."
 */

import { describe, it, expect } from 'vitest'
import {
  calcularMargem,
  resolverPrecoVenda,
  type PrecoProduto,
  type PrecoSkuOverride,
  type ResultadoMargem,
} from './pricing'

// ---------------------------------------------------------------------------
// RN-004.1 — calcularMargem: nominal e percentual
// ---------------------------------------------------------------------------

describe('RN-004: calcularMargem — margem nominal e percentual', () => {
  it('deve calcular corretamente a margem nominal (R$)', () => {
    const resultado: ResultadoMargem = calcularMargem({ precoCusto: 50, precoVenda: 100 })
    expect(resultado.margemNominal).toBe(50)
  })

  it('deve calcular corretamente a margem percentual (%)', () => {
    const resultado = calcularMargem({ precoCusto: 50, precoVenda: 100 })
    expect(resultado.margemPercentual).toBe(100) // (50/50)*100 = 100%
  })

  it('deve calcular margem percentual com casas decimais corretas', () => {
    const resultado = calcularMargem({ precoCusto: 60, precoVenda: 100 })
    expect(resultado.margemPercentual).toBeCloseTo(66.67, 2) // (40/60)*100
  })

  it('deve retornar margem negativa quando o preço de venda é menor que o custo (prejuízo)', () => {
    const resultado = calcularMargem({ precoCusto: 80, precoVenda: 60 })
    expect(resultado.margemNominal).toBe(-20)
    expect(resultado.margemPercentual).toBeCloseTo(-25, 2) // (-20/80)*100
  })

  it('deve retornar margem zero quando custo e venda são iguais', () => {
    const resultado = calcularMargem({ precoCusto: 100, precoVenda: 100 })
    expect(resultado.margemNominal).toBe(0)
    expect(resultado.margemPercentual).toBe(0)
  })

  it('deve retornar margemPercentual como Infinity quando o preço de custo é zero', () => {
    const resultado = calcularMargem({ precoCusto: 0, precoVenda: 50 })
    expect(resultado.margemNominal).toBe(50)
    expect(resultado.margemPercentual).toBe(Infinity)
  })

  it('deve retornar margemPercentual 0 quando custo e venda são ambos zero', () => {
    const resultado = calcularMargem({ precoCusto: 0, precoVenda: 0 })
    expect(resultado.margemNominal).toBe(0)
    expect(resultado.margemPercentual).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// RN-004.2 — resolverPrecoVenda: preço base vs. override no SKU
// ---------------------------------------------------------------------------

describe('RN-004: resolverPrecoVenda — sobrescrita de preço no nível do SKU', () => {
  const precoProduto: PrecoProduto = { precoCusto: 40, precoVenda: 80 }

  it('deve usar o preço de venda base do produto quando não há override no SKU', () => {
    expect(resolverPrecoVenda(precoProduto, null)).toBe(80)
  })

  it('deve usar o preço de venda do override quando definido no SKU', () => {
    const override: PrecoSkuOverride = { precoVenda: 95 }
    expect(resolverPrecoVenda(precoProduto, override)).toBe(95)
  })

  it('deve usar o preço de venda base quando override está presente mas sem precoVenda', () => {
    const override: PrecoSkuOverride = {}
    expect(resolverPrecoVenda(precoProduto, override)).toBe(80)
  })

  it('deve calcular a margem corretamente usando o preço override do SKU', () => {
    const override: PrecoSkuOverride = { precoVenda: 120 }
    const precoFinal = resolverPrecoVenda(precoProduto, override)
    const margem = calcularMargem({ precoCusto: precoProduto.precoCusto, precoVenda: precoFinal })
    expect(margem.margemNominal).toBe(80)
    expect(margem.margemPercentual).toBe(200) // (80/40)*100
  })
})
