/**
 * Testes para RN-005 e RN-006
 *
 * RN-005: Histórico Imutável de Movimentações
 * "Nenhuma movimentação pode ser apagada. Qualquer correção deve gerar uma
 *  nova movimentação do tipo AJUSTE ou DEVOLUÇÃO."
 *
 * RN-006: Baixa Automática por Venda
 * "A confirmação de uma Venda gera automaticamente movimentações de saída
 *  do tipo SAIDA_VENDA para cada SKU do pedido."
 */

import { describe, it, expect } from 'vitest'
import {
  processarVenda,
  TipoMovimentacao,
  validarVenda,
  type ItemVenda,
  type ResultadoVenda,
  type StatusVenda,
} from './sale'
import type { Sku } from './product'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSku(overrides: Partial<Sku> = {}): Sku {
  return {
    id: 'sku-001',
    cor: 'Preto',
    tamanho: 'M',
    estoqueAtual: 20,
    estoqueMinimo: 3,
    ativo: true,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// RN-006: processarVenda — Baixa Automática por Venda
// ---------------------------------------------------------------------------

describe('RN-006: processarVenda — baixa automática de estoque', () => {
  it('deve retornar movimentações do tipo SAIDA_VENDA para cada item vendido', () => {
    const skuA = makeSku({ id: 'sku-A', estoqueAtual: 10 })
    const skuB = makeSku({ id: 'sku-B', estoqueAtual: 8, cor: 'Branco', tamanho: 'G' })

    const itens: ItemVenda[] = [
      { sku: skuA, quantidade: 3, valorUnitario: 99.9 },
      { sku: skuB, quantidade: 2, valorUnitario: 99.9 },
    ]

    const resultado: ResultadoVenda = processarVenda(itens)

    expect(resultado.movimentacoes).toHaveLength(2)
    expect(resultado.movimentacoes[0].tipo).toBe(TipoMovimentacao.SAIDA_VENDA)
    expect(resultado.movimentacoes[1].tipo).toBe(TipoMovimentacao.SAIDA_VENDA)
  })

  it('deve debitar o estoque correto em cada SKU retornado', () => {
    const skuA = makeSku({ id: 'sku-A', estoqueAtual: 10 })
    const itens: ItemVenda[] = [{ sku: skuA, quantidade: 4, valorUnitario: 50 }]

    const resultado = processarVenda(itens)

    const skuAtualizado = resultado.skusAtualizados.find((s) => s.id === 'sku-A')
    expect(skuAtualizado?.estoqueAtual).toBe(6)
  })

  it('deve calcular o valor total da venda somando (quantidade × valorUnitario) de cada item', () => {
    const itens: ItemVenda[] = [
      { sku: makeSku({ id: 'sku-A' }), quantidade: 2, valorUnitario: 50 },
      { sku: makeSku({ id: 'sku-B' }), quantidade: 3, valorUnitario: 30 },
    ]
    const resultado = processarVenda(itens)
    expect(resultado.valorTotal).toBeCloseTo(190) // (2*50) + (3*30)
  })

  it('deve registrar a quantidade correta na movimentação', () => {
    const sku = makeSku({ id: 'sku-X', estoqueAtual: 15 })
    const itens: ItemVenda[] = [{ sku, quantidade: 7, valorUnitario: 45 }]

    const resultado = processarVenda(itens)
    expect(resultado.movimentacoes[0].quantidade).toBe(7)
    expect(resultado.movimentacoes[0].skuId).toBe('sku-X')
  })

  it('deve lançar erro (RN-002) quando estoque de um SKU é insuficiente', () => {
    const skuSemEstoque = makeSku({ id: 'sku-sem-estoque', estoqueAtual: 2 })
    const itens: ItemVenda[] = [{ sku: skuSemEstoque, quantidade: 5, valorUnitario: 80 }]

    expect(() => processarVenda(itens)).toThrow()
  })

  it('deve lançar erro se a lista de itens estiver vazia', () => {
    expect(() => processarVenda([])).toThrow('Venda inválida: a lista de itens não pode ser vazia.')
  })

  it('deve processar venda com item único corretamente', () => {
    const sku = makeSku({ id: 'sku-unico', estoqueAtual: 5 })
    const resultado = processarVenda([{ sku, quantidade: 5, valorUnitario: 100 }])

    expect(resultado.movimentacoes).toHaveLength(1)
    expect(resultado.skusAtualizados[0].estoqueAtual).toBe(0)
    expect(resultado.valorTotal).toBe(500)
  })
})

describe('Status da venda e comprador', () => {
  it('deve aceitar venda concluída sem comprador', () => {
    expect(() => validarVenda({ status: 'CONCLUIDA' })).not.toThrow()
  })

  it('deve exigir comprador identificado para venda pendente', () => {
    expect(() => validarVenda({ status: 'PENDENTE' })).toThrow(
      'Vendas pendentes exigem um cliente identificado.'
    )
  })

  it('deve aceitar venda pendente com comprador', () => {
    const venda: { status: StatusVenda; customerId: string } = {
      status: 'PENDENTE',
      customerId: 'customer-001',
    }

    expect(() => validarVenda(venda)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// RN-005: Imutabilidade — as movimentações não podem ser alteradas
// ---------------------------------------------------------------------------

describe('RN-005: movimentações imutáveis', () => {
  it('deve retornar movimentações congeladas (Object.isFrozen)', () => {
    const sku = makeSku({ id: 'sku-freeze', estoqueAtual: 10 })
    const resultado = processarVenda([{ sku, quantidade: 1, valorUnitario: 60 }])

    for (const mov of resultado.movimentacoes) {
      expect(Object.isFrozen(mov)).toBe(true)
    }
  })

  it('deve retornar o array de movimentações congelado', () => {
    const sku = makeSku({ estoqueAtual: 10 })
    const resultado = processarVenda([{ sku, quantidade: 1, valorUnitario: 60 }])

    expect(Object.isFrozen(resultado.movimentacoes)).toBe(true)
  })

  it('não deve permitir mutação de uma movimentação já registrada', () => {
    const sku = makeSku({ estoqueAtual: 10 })
    const resultado = processarVenda([{ sku, quantidade: 2, valorUnitario: 80 }])

    const mov = resultado.movimentacoes[0]
    // Em strict mode, a tentativa de escrita em objeto congelado lança TypeError
    expect(() => {
      ;(mov as Record<string, unknown>)['quantidade'] = 999
    }).toThrow(TypeError)
  })
})
