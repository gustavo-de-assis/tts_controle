/**
 * Testes para RN-001: Modelagem por Grade (SKU Físico)
 *
 * "O estoque NUNCA deve ser associado diretamente ao Produto Pai, mas sim
 *  à combinação de Cor + Tamanho (SKU). A quantidade disponível final é a
 *  soma das quantidades de todos os seus SKUs ativos."
 */

import { describe, it, expect } from 'vitest'
import { calcularEstoqueTotal, criarSku, type Sku } from './product'

// ---------------------------------------------------------------------------
// RN-001.1 — Cálculo de estoque total a partir da lista de SKUs
// ---------------------------------------------------------------------------

describe('RN-001: calcularEstoqueTotal', () => {
  it('deve retornar 0 quando o produto não tem SKUs', () => {
    expect(calcularEstoqueTotal([])).toBe(0)
  })

  it('deve somar as quantidades de todos os SKUs ativos', () => {
    const skus: Sku[] = [
      { id: '1', cor: 'Preto', tamanho: 'P', estoqueAtual: 10, estoqueMinimo: 2, ativo: true },
      { id: '2', cor: 'Preto', tamanho: 'M', estoqueAtual: 5, estoqueMinimo: 2, ativo: true },
      { id: '3', cor: 'Branco', tamanho: 'G', estoqueAtual: 8, estoqueMinimo: 2, ativo: true },
    ]
    expect(calcularEstoqueTotal(skus)).toBe(23)
  })

  it('deve ignorar SKUs inativos no cálculo do estoque total', () => {
    const skus: Sku[] = [
      { id: '1', cor: 'Vermelho', tamanho: 'PP', estoqueAtual: 12, estoqueMinimo: 3, ativo: true },
      { id: '2', cor: 'Vermelho', tamanho: 'XGG', estoqueAtual: 7, estoqueMinimo: 3, ativo: false },
    ]
    // Apenas o SKU ativo (12) deve ser contabilizado
    expect(calcularEstoqueTotal(skus)).toBe(12)
  })

  it('deve retornar 0 quando todos os SKUs estão inativos', () => {
    const skus: Sku[] = [
      { id: '1', cor: 'Azul', tamanho: 'M', estoqueAtual: 5, estoqueMinimo: 1, ativo: false },
    ]
    expect(calcularEstoqueTotal(skus)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// RN-001.2 — Validação de SKUs inválidos (sem cor ou tamanho)
// ---------------------------------------------------------------------------

describe('RN-001: criarSku — validação de campos obrigatórios', () => {
  it('deve criar um SKU válido quando cor e tamanho são fornecidos', () => {
    const sku = criarSku({ cor: 'Preto', tamanho: 'M', estoqueAtual: 10, estoqueMinimo: 2 })
    expect(sku).toMatchObject({ cor: 'Preto', tamanho: 'M', estoqueAtual: 10, ativo: true })
  })

  it('deve lançar erro ao criar SKU sem cor', () => {
    expect(() =>
      criarSku({ cor: '', tamanho: 'G', estoqueAtual: 5, estoqueMinimo: 1 })
    ).toThrow('SKU inválido: a cor é obrigatória.')
  })

  it('deve lançar erro ao criar SKU sem tamanho', () => {
    expect(() =>
      criarSku({ cor: 'Verde', tamanho: '', estoqueAtual: 5, estoqueMinimo: 1 })
    ).toThrow('SKU inválido: o tamanho é obrigatório.')
  })

  it('deve lançar erro ao criar SKU com estoque inicial negativo', () => {
    expect(() =>
      criarSku({ cor: 'Azul', tamanho: 'P', estoqueAtual: -1, estoqueMinimo: 2 })
    ).toThrow('SKU inválido: o estoque atual não pode ser negativo.')
  })

  it('deve lançar erro ao criar SKU com estoque mínimo negativo', () => {
    expect(() =>
      criarSku({ cor: 'Rosa', tamanho: 'GG', estoqueAtual: 3, estoqueMinimo: -5 })
    ).toThrow('SKU inválido: o estoque mínimo não pode ser negativo.')
  })
})
