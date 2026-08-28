import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getProductsWithSkus } from './product'
import { StatusEstoque } from '../domain/stock'

// ── Mocks (padrão vi.hoisted do projeto) ────────────────────────────────────

const mockProductFindMany = vi.hoisted(() => vi.fn())

vi.mock('../lib/prisma', () => ({
  prisma: {
    product: { findMany: mockProductFindMany },
  },
}))

vi.mock('../lib/auth-guard', () => ({
  requireUser: vi.fn().mockResolvedValue({ id: 'user-1', role: 'ADMIN' }),
}))

// ── Dados de Fixture ─────────────────────────────────────────────────────────

const makeDbProduct = (overrides?: object) => ({
  id: 'prod-1',
  name: 'Camiseta Básica',
  baseCostPrice: 2000,   // R$ 20,00 em centavos
  baseSalePrice: 5000,   // R$ 50,00 em centavos
  category: { id: 'cat-1', name: 'Camisetas' },
  skus: [
    {
      id: 'sku-1',
      sku: 'CAM-PRETA-M',
      color: 'Preta',
      size: 'M',
      currentStock: 10,
      minimumStock: 2,
    },
  ],
  ...overrides,
})

// ── Testes ──────────────────────────────────────────────────────────────────

describe('getProductsWithSkus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProductFindMany.mockResolvedValue([makeDbProduct()])
  })

  it('1. retorna lista mapeada com preços em reais e status NORMAL', async () => {
    const result = await getProductsWithSkus()

    expect(result).toHaveLength(1)
    const product = result[0]

    expect(product.id).toBe('prod-1')
    expect(product.name).toBe('Camiseta Básica')
    expect(product.categoryName).toBe('Camisetas')
    expect(product.baseCostPrice).toBe(20)   // fromCents(2000)
    expect(product.baseSalePrice).toBe(50)   // fromCents(5000)
    expect(product.totalStock).toBe(10)
    expect(product.skus).toHaveLength(1)
    expect(product.skus[0].status).toBe(StatusEstoque.NORMAL)
  })

  it('2. passa o filtro de search corretamente ao Prisma', async () => {
    await getProductsWithSkus({ search: 'Camiseta' })

    expect(mockProductFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          name: expect.objectContaining({ contains: 'Camiseta' }),
        }),
      })
    )
  })

  it('3. passa o filtro de categoryId corretamente ao Prisma', async () => {
    await getProductsWithSkus({ categoryId: 'cat-1' })

    expect(mockProductFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          categoryId: 'cat-1',
        }),
      })
    )
  })

  it('4. combina search e categoryId no mesmo where', async () => {
    await getProductsWithSkus({ search: 'Camiseta', categoryId: 'cat-1' })

    expect(mockProductFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          name: expect.objectContaining({ contains: 'Camiseta' }),
          categoryId: 'cat-1',
        }),
      })
    )
  })

  it('5. retorna status ESTOQUE_CRITICO quando currentStock <= minimumStock (RN-003)', async () => {
    mockProductFindMany.mockResolvedValue([
      makeDbProduct({
        skus: [
          {
            id: 'sku-crit',
            sku: 'CAM-PRETA-P',
            color: 'Preta',
            size: 'P',
            currentStock: 2,
            minimumStock: 2,   // igual → crítico
          },
        ],
      }),
    ])

    const result = await getProductsWithSkus()

    expect(result[0].skus[0].status).toBe(StatusEstoque.ESTOQUE_CRITICO)
  })

  it('6. propaga erro quando a sessão não está autenticada', async () => {
    const { requireUser } = await import('../lib/auth-guard')
    vi.mocked(requireUser).mockRejectedValueOnce(new Error('Unauthorized'))

    await expect(getProductsWithSkus()).rejects.toThrow('Unauthorized')
  })
})
