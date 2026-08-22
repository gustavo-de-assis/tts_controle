/**
 * Domínio: Produto e SKU (Grade)
 *
 * RN-001: Modelagem por Grade (SKU Físico)
 * "O estoque NUNCA deve ser associado diretamente ao Produto Pai, mas sim
 *  à combinação de Cor + Tamanho (SKU). A quantidade disponível final é a
 *  soma das quantidades de todos os seus SKUs ativos."
 */

// ---------------------------------------------------------------------------
// Tipos / Interfaces
// ---------------------------------------------------------------------------

/** Representa uma variação física estocável de um produto (Cor + Tamanho). */
export interface Sku {
  id: string
  cor: string
  tamanho: string
  estoqueAtual: number
  estoqueMinimo: number
  ativo: boolean
}

/** Dados de entrada para criação de um novo SKU (sem id nem ativo — gerados internamente). */
export interface CriarSkuInput {
  cor: string
  tamanho: string
  estoqueAtual: number
  estoqueMinimo: number
}

// ---------------------------------------------------------------------------
// Funções de Domínio
// ---------------------------------------------------------------------------

/**
 * Calcula o estoque total de um produto somando os estoques de todos os
 * SKUs **ativos**. SKUs inativos são excluídos da contagem.
 *
 * @param skus - Lista de SKUs do produto pai.
 * @returns Quantidade total em estoque.
 */
export function calcularEstoqueTotal(skus: Sku[]): number {
  return skus
    .filter((sku) => sku.ativo)
    .reduce((total, sku) => total + sku.estoqueAtual, 0)
}

/**
 * Cria e valida um novo SKU com base nos dados de entrada.
 * Lança um `Error` descritivo se alguma regra de negócio for violada.
 *
 * @param input - Dados do SKU a ser criado.
 * @returns Um objeto `Sku` completo e válido.
 */
export function criarSku(input: CriarSkuInput): Sku {
  if (!input.cor || input.cor.trim() === '') {
    throw new Error('SKU inválido: a cor é obrigatória.')
  }

  if (!input.tamanho || input.tamanho.trim() === '') {
    throw new Error('SKU inválido: o tamanho é obrigatório.')
  }

  if (input.estoqueAtual < 0) {
    throw new Error('SKU inválido: o estoque atual não pode ser negativo.')
  }

  if (input.estoqueMinimo < 0) {
    throw new Error('SKU inválido: o estoque mínimo não pode ser negativo.')
  }

  return {
    id: crypto.randomUUID(),
    cor: input.cor.trim(),
    tamanho: input.tamanho.trim(),
    estoqueAtual: input.estoqueAtual,
    estoqueMinimo: input.estoqueMinimo,
    ativo: true,
  }
}
