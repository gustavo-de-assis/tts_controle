/**
 * Domínio: Venda e Baixa Automática de Estoque
 *
 * RN-005: Histórico Imutável de Movimentações
 * "Nenhuma movimentação pode ser apagada. Qualquer correção deve gerar uma
 *  nova movimentação do tipo AJUSTE ou DEVOLUÇÃO."
 *
 * RN-006: Baixa Automática por Venda
 * "A confirmação de uma Venda gera automaticamente movimentações de saída
 *  do tipo SAIDA_VENDA para cada SKU do pedido e atualiza a quantidade
 *  total do produto instantaneamente."
 */

import type { Sku } from './product'
import { registrarSaida } from './stock'

// ---------------------------------------------------------------------------
// Enums / Tipos
// ---------------------------------------------------------------------------

/** Tipos de movimentação de estoque suportados pelo sistema. */
export enum TipoMovimentacao {
  ENTRADA = 'ENTRADA',
  SAIDA_VENDA = 'SAIDA_VENDA',
  AJUSTE_PERDA = 'AJUSTE_PERDA',
  DEVOLUCAO = 'DEVOLUCAO',
}

/**
 * Registro auditável de uma movimentação de estoque.
 * Objetos deste tipo são **congelados** ao ser criados (RN-005).
 */
export interface Movimentacao {
  readonly skuId: string
  readonly tipo: TipoMovimentacao
  readonly quantidade: number
  readonly valorUnitario: number
  readonly dataHora: string // ISO 8601
}

/** Um item de uma venda: qual SKU, quantas unidades e a que preço. */
export interface ItemVenda {
  sku: Sku
  quantidade: number
  valorUnitario: number
}

/** Resultado do processamento de uma venda. */
export interface ResultadoVenda {
  /** Movimentações SAIDA_VENDA geradas — array e objetos congelados (RN-005). */
  readonly movimentacoes: ReadonlyArray<Readonly<Movimentacao>>
  /** SKUs com `estoqueAtual` atualizado após a baixa. */
  readonly skusAtualizados: ReadonlyArray<Sku>
  /** Soma de (quantidade × valorUnitario) de todos os itens. */
  readonly valorTotal: number
}

// ---------------------------------------------------------------------------
// RN-006: Processar Venda
// ---------------------------------------------------------------------------

/**
 * Processa uma venda com múltiplos itens, gerando as movimentações de saída
 * do tipo `SAIDA_VENDA` e retornando os SKUs com estoques atualizados.
 *
 * - Delega a validação de saldo à função `registrarSaida` (RN-002), que
 *   lança `Error` em caso de estoque insuficiente ou SKU inativo.
 * - Cada `Movimentacao` é congelada via `Object.freeze` (RN-005).
 * - O array de movimentações também é congelado.
 *
 * @param itens - Lista de itens a vender (não pode ser vazia).
 * @returns `ResultadoVenda` com movimentações, SKUs atualizados e valor total.
 */
export function processarVenda(itens: ItemVenda[]): ResultadoVenda {
  if (itens.length === 0) {
    throw new Error('Venda inválida: a lista de itens não pode ser vazia.')
  }

  const movimentacoes: Readonly<Movimentacao>[] = []
  const skusAtualizados: Sku[] = []
  let valorTotal = 0

  for (const item of itens) {
    // RN-002 é aplicada aqui; lança Error se inválido
    const skuAtualizado = registrarSaida(item.sku, item.quantidade)

    // RN-005: congela a movimentação para torná-la imutável
    const movimentacao: Readonly<Movimentacao> = Object.freeze({
      skuId: item.sku.id,
      tipo: TipoMovimentacao.SAIDA_VENDA,
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitario,
      dataHora: new Date().toISOString(),
    })

    movimentacoes.push(movimentacao)
    skusAtualizados.push(skuAtualizado)
    valorTotal += item.quantidade * item.valorUnitario
  }

  return {
    movimentacoes: Object.freeze(movimentacoes),
    skusAtualizados,
    valorTotal,
  }
}
