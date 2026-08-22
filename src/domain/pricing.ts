/**
 * Domínio: Precificação e Margem de Lucro
 *
 * RN-004: Precificação e Margem de Lucro
 * "Ao cadastrar ou atualizar o Preço de Custo e Preço de Venda, o sistema
 *  deve calcular automaticamente a Margem Bruta de Lucro nominal (R$) e
 *  percentual (%). Permite-se sobrescrever os preços no nível da variação,
 *  caso um tamanho especial tenha preço diferenciado."
 */

// ---------------------------------------------------------------------------
// Tipos / Interfaces
// ---------------------------------------------------------------------------

/** Preços definidos no nível do Produto Pai. */
export interface PrecoProduto {
  precoCusto: number
  precoVenda: number
}

/**
 * Override opcional de preço no nível do SKU.
 * Quando `precoVenda` está presente, substitui o preço base do produto.
 */
export interface PrecoSkuOverride {
  precoVenda?: number
}

/** Resultado do cálculo de margem bruta. */
export interface ResultadoMargem {
  /** Diferença absoluta entre preço de venda e preço de custo (R$). */
  margemNominal: number
  /**
   * Percentual de margem sobre o custo: (margemNominal / precoCusto) × 100.
   * Retorna `Infinity` quando `precoCusto` é 0 e há lucro,
   * ou `0` quando ambos os preços são 0.
   */
  margemPercentual: number
}

// ---------------------------------------------------------------------------
// RN-004: Funções de Domínio
// ---------------------------------------------------------------------------

/**
 * Calcula a margem bruta de lucro nominal (R$) e percentual (%)
 * a partir do preço de custo e do preço de venda.
 *
 * @param precos - Objeto com `precoCusto` e `precoVenda`.
 * @returns `ResultadoMargem` com os dois valores calculados.
 */
export function calcularMargem(precos: PrecoProduto): ResultadoMargem {
  const margemNominal = precos.precoVenda - precos.precoCusto

  // Caso especial: custo e venda ambos zero → margem 0%
  if (precos.precoCusto === 0 && margemNominal === 0) {
    return { margemNominal: 0, margemPercentual: 0 }
  }

  // Custo zero com venda positiva → margem infinita (sem custo, lucro total)
  if (precos.precoCusto === 0) {
    return { margemNominal, margemPercentual: Infinity }
  }

  const margemPercentual = (margemNominal / precos.precoCusto) * 100

  return { margemNominal, margemPercentual }
}

/**
 * Resolve o preço de venda efetivo para um SKU, aplicando o override
 * caso ele exista e contenha um `precoVenda` definido.
 *
 * @param precoProduto - Preços base do produto pai.
 * @param override - Override opcional no nível do SKU (pode ser `null`).
 * @returns O preço de venda a ser utilizado.
 */
export function resolverPrecoVenda(
  precoProduto: PrecoProduto,
  override: PrecoSkuOverride | null
): number {
  if (override != null && override.precoVenda != null) {
    return override.precoVenda
  }
  return precoProduto.precoVenda
}
