/**
 * Domínio: Movimentações de Estoque e Alertas
 *
 * RN-002: Restrição de Estoque Negativo
 * "O sistema impede saídas de produtos caso a quantidade solicitada seja
 *  superior ao estoque atual do SKU. Transações não podem resultar em saldo
 *  negativo."
 *
 * RN-003: Alertas de Reposição de Estoque
 * "Quando o saldo de um SKU for igual ou menor a estoqueMinimo, o sistema
 *  deve sinalizar o produto com o status 'Estoque Crítico'."
 */

import type { Sku } from './product'

// ---------------------------------------------------------------------------
// Enums / Tipos
// ---------------------------------------------------------------------------

/** Status de estoque possíveis para um SKU. */
export enum StatusEstoque {
  NORMAL = 'NORMAL',
  ESTOQUE_CRITICO = 'ESTOQUE_CRITICO',
}

// ---------------------------------------------------------------------------
// RN-002: Registrar Saída
// ---------------------------------------------------------------------------

/**
 * Registra uma saída de estoque para um SKU, retornando um **novo** objeto
 * SKU com o estoque atualizado (imutabilidade garantida).
 *
 * Lança `Error` descritivo se qualquer regra de negócio for violada:
 * - SKU inativo não aceita movimentações.
 * - Quantidade de saída deve ser positiva.
 * - Quantidade de saída não pode superar o estoque atual (RN-002).
 *
 * @param sku - SKU atual com saldo disponível.
 * @param quantidade - Quantidade a ser retirada do estoque.
 * @returns Novo objeto `Sku` com `estoqueAtual` atualizado.
 */
export function registrarSaida(sku: Sku, quantidade: number): Sku {
  if (!sku.ativo) {
    throw new Error(
      `Saída inválida: o SKU ${sku.id} está inativo e não pode sofrer movimentações.`
    )
  }

  if (quantidade <= 0) {
    throw new Error('Saída inválida: a quantidade de saída deve ser maior que zero.')
  }

  if (quantidade > sku.estoqueAtual) {
    throw new Error(
      `Saída inválida: quantidade solicitada (${quantidade}) é superior ao estoque disponível (${sku.estoqueAtual}) para o SKU ${sku.id}.`
    )
  }

  return { ...sku, estoqueAtual: sku.estoqueAtual - quantidade }
}

// ---------------------------------------------------------------------------
// RN-003: Verificar Status de Estoque
// ---------------------------------------------------------------------------

/**
 * Verifica o status de estoque de um SKU com base no seu `estoqueMinimo`.
 *
 * Retorna `ESTOQUE_CRITICO` quando `estoqueAtual <= estoqueMinimo`,
 * garantindo que o limite mínimo seja um sinal de alerta inclusivo.
 *
 * @param sku - SKU a ser avaliado.
 * @returns `StatusEstoque.ESTOQUE_CRITICO` ou `StatusEstoque.NORMAL`.
 */
export function verificarStatusEstoque(sku: Sku): StatusEstoque {
  if (sku.estoqueAtual <= sku.estoqueMinimo) {
    return StatusEstoque.ESTOQUE_CRITICO
  }
  return StatusEstoque.NORMAL
}
