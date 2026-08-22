/**
 * Testes para RN-002 e RN-003
 *
 * RN-002: Restrição de Estoque Negativo
 * "O sistema impede saídas de produtos caso a quantidade solicitada seja
 *  superior ao estoque atual do SKU correspondente. Transações não podem
 *  resultar em saldo negativo."
 *
 * RN-003: Alertas de Reposição de Estoque
 * "Quando o saldo de um SKU for igual ou menor a estoqueMinimo, o sistema
 *  deve sinalizar o produto com o status 'Estoque Crítico'."
 */

import { describe, it, expect } from 'vitest'
import { registrarSaida, verificarStatusEstoque, StatusEstoque } from './stock'
import type { Sku } from './product'

// ---------------------------------------------------------------------------
// Helpers de teste
// ---------------------------------------------------------------------------

function makeSku(overrides: Partial<Sku> = {}): Sku {
  return {
    id: 'sku-test-01',
    cor: 'Preto',
    tamanho: 'M',
    estoqueAtual: 10,
    estoqueMinimo: 3,
    ativo: true,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// RN-002: registrarSaida
// ---------------------------------------------------------------------------

describe('RN-002: registrarSaida — restrição de estoque negativo', () => {
  it('deve retornar o SKU atualizado quando a saída é válida', () => {
    const sku = makeSku({ estoqueAtual: 10 })
    const atualizado = registrarSaida(sku, 4)
    expect(atualizado.estoqueAtual).toBe(6)
  })

  it('deve aceitar saída exata igual ao estoque disponível (saldo zero)', () => {
    const sku = makeSku({ estoqueAtual: 5 })
    const atualizado = registrarSaida(sku, 5)
    expect(atualizado.estoqueAtual).toBe(0)
  })

  it('deve lançar erro quando quantidade de saída é maior que o estoque atual', () => {
    const sku = makeSku({ estoqueAtual: 3 })
    expect(() => registrarSaida(sku, 4)).toThrow(
      'Saída inválida: quantidade solicitada (4) é superior ao estoque disponível (3) para o SKU sku-test-01.'
    )
  })

  it('deve lançar erro quando quantidade de saída é zero', () => {
    const sku = makeSku({ estoqueAtual: 10 })
    expect(() => registrarSaida(sku, 0)).toThrow(
      'Saída inválida: a quantidade de saída deve ser maior que zero.'
    )
  })

  it('deve lançar erro quando quantidade de saída é negativa', () => {
    const sku = makeSku({ estoqueAtual: 10 })
    expect(() => registrarSaida(sku, -2)).toThrow(
      'Saída inválida: a quantidade de saída deve ser maior que zero.'
    )
  })

  it('deve lançar erro ao tentar registrar saída em SKU inativo', () => {
    const sku = makeSku({ estoqueAtual: 10, ativo: false })
    expect(() => registrarSaida(sku, 1)).toThrow(
      'Saída inválida: o SKU sku-test-01 está inativo e não pode sofrer movimentações.'
    )
  })

  it('deve retornar um novo objeto Sku sem mutar o original (imutabilidade)', () => {
    const sku = makeSku({ estoqueAtual: 10 })
    const atualizado = registrarSaida(sku, 3)
    expect(sku.estoqueAtual).toBe(10) // original intacto
    expect(atualizado.estoqueAtual).toBe(7)
    expect(atualizado).not.toBe(sku) // referências diferentes
  })
})

// ---------------------------------------------------------------------------
// RN-003: verificarStatusEstoque
// ---------------------------------------------------------------------------

describe('RN-003: verificarStatusEstoque — alertas de reposição', () => {
  it('deve retornar NORMAL quando estoqueAtual é maior que estoqueMinimo', () => {
    const sku = makeSku({ estoqueAtual: 10, estoqueMinimo: 3 })
    expect(verificarStatusEstoque(sku)).toBe(StatusEstoque.NORMAL)
  })

  it('deve retornar ESTOQUE_CRITICO quando estoqueAtual é igual a estoqueMinimo', () => {
    const sku = makeSku({ estoqueAtual: 3, estoqueMinimo: 3 })
    expect(verificarStatusEstoque(sku)).toBe(StatusEstoque.ESTOQUE_CRITICO)
  })

  it('deve retornar ESTOQUE_CRITICO quando estoqueAtual é menor que estoqueMinimo', () => {
    const sku = makeSku({ estoqueAtual: 1, estoqueMinimo: 5 })
    expect(verificarStatusEstoque(sku)).toBe(StatusEstoque.ESTOQUE_CRITICO)
  })

  it('deve retornar ESTOQUE_CRITICO quando estoqueAtual é zero', () => {
    const sku = makeSku({ estoqueAtual: 0, estoqueMinimo: 2 })
    expect(verificarStatusEstoque(sku)).toBe(StatusEstoque.ESTOQUE_CRITICO)
  })

  it('deve retornar NORMAL quando estoqueMinimo é zero e há estoque', () => {
    const sku = makeSku({ estoqueAtual: 1, estoqueMinimo: 0 })
    expect(verificarStatusEstoque(sku)).toBe(StatusEstoque.NORMAL)
  })

  it('deve retornar ESTOQUE_CRITICO quando ambos são zero', () => {
    const sku = makeSku({ estoqueAtual: 0, estoqueMinimo: 0 })
    expect(verificarStatusEstoque(sku)).toBe(StatusEstoque.ESTOQUE_CRITICO)
  })
})
