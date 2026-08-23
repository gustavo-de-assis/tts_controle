/** Converte um valor digitado em reais para centavos inteiros. */
export function toCents(valueInReais: number): number {
  return Math.round(valueInReais * 100)
}

/** Converte centavos persistidos para reais para uso na aplicação e na UI. */
export function fromCents(valueInCents: number): number {
  return valueInCents / 100
}