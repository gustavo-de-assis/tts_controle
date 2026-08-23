import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createProductWithSkus } from './product'

// Mock do Prisma
const mockProductCreate = vi.hoisted(() => vi.fn())
const mockSkuCreate = vi.hoisted(() => vi.fn())
const mockStockMovementCreate = vi.hoisted(() => vi.fn())
const mockTransaction = vi.hoisted(() => vi.fn())

vi.mock('../lib/prisma', () => ({
  prisma: {
    $transaction: mockTransaction,
    product: { create: mockProductCreate },
    sku: { create: mockSkuCreate },
    stockMovement: { create: mockStockMovementCreate },
  },
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('createProductWithSkus', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockTransaction.mockImplementation(async (cb) => {
      return cb({
        product: { create: mockProductCreate },
        sku: { create: mockSkuCreate },
        stockMovement: { create: mockStockMovementCreate },
      })
    })

    mockProductCreate.mockResolvedValue({
      id: 'prod-1',
      name: 'Camiseta Básica',
      categoryId: 'cat-1',
      baseCostPrice: 10,
      baseSalePrice: 50,
    })

    mockSkuCreate.mockImplementation(async (args: any) => ({
      id: `sku-${args.data.sku}`,
      ...args.data,
    }))

    mockStockMovementCreate.mockResolvedValue({ id: 'mov-1' })
  })

  it('deve criar produto com SKUs e revalidar a rota', async () => {
    const result = await createProductWithSkus({
      name: 'Camiseta Básica',
      categoryId: 'cat-1',
      baseCostPrice: 10,
      baseSalePrice: 50,
      skus: [
        {
          sku: 'CAM-PRETA-M',
          color: 'Preta',
          size: 'M',
          currentStock: 10,
          minimumStock: 2,
        },
        {
          sku: 'CAM-PRETA-G',
          color: 'Preta',
          size: 'G',
          currentStock: 5,
          minimumStock: 1,
        },
      ],
    })

    expect(mockTransaction).toHaveBeenCalledTimes(1)
    expect(result.product.name).toBe('Camiseta Básica')
    expect(result.skus.length).toBe(2)

    // Deve ter criado 2 SKUs
    expect(mockSkuCreate).toHaveBeenCalledTimes(2)

    // Deve ter criado 2 movimentos de estoque (uma vez que ambos têm estoque > 0)
    expect(mockStockMovementCreate).toHaveBeenCalledTimes(2)

    // Deve revalidar a rota
    const { revalidatePath } = await import('next/cache')
    expect(revalidatePath).toHaveBeenCalledWith('/')
  })

  it('deve criar produto com SKU sem movimento de estoque quando estoque inicial é 0', async () => {
    await createProductWithSkus({
      name: 'Camiseta Básica',
      categoryId: 'cat-1',
      baseCostPrice: 10,
      baseSalePrice: 50,
      skus: [
        {
          sku: 'CAM-PRETA-M',
          color: 'Preta',
          size: 'M',
          currentStock: 0,
          minimumStock: 1,
        },
      ],
    })

    // 1 SKU criado, mas nenhum movimento de estoque (since currentStock === 0)
    expect(mockSkuCreate).toHaveBeenCalledTimes(1)
    expect(mockStockMovementCreate).toHaveBeenCalledTimes(0)
  })

  it('deve rejeitar criação sem nome', async () => {
    await expect(
      createProductWithSkus({
        // @ts-expect-error - name é obrigatória
        categoryId: 'cat-1',
        baseCostPrice: 10,
        baseSalePrice: 50,
        skus: [
          {
            sku: 'CAM-PRETA-M',
            color: 'Preta',
            size: 'M',
            currentStock: 10,
            minimumStock: 1,
          },
        ],
      })
    ).rejects.toThrow('Dados inválidos: Nome, Categoria e ao menos um SKU são obrigatórios.')
  })

  it('deve rejeitar criação sem categoria', async () => {
    await expect(
      createProductWithSkus({
        // @ts-expect-error - categoryId é obrigatória
        name: 'Camiseta',
        baseCostPrice: 10,
        baseSalePrice: 50,
        skus: [
          {
            sku: 'CAM-PRETA-M',
            color: 'Preta',
            size: 'M',
            currentStock: 10,
            minimumStock: 1,
          },
        ],
      })
    ).rejects.toThrow('Dados inválidos: Nome, Categoria e ao menos um SKU são obrigatórios.')
  })

  it('deve rejeitar criação sem SKUs', async () => {
    await expect(
      createProductWithSkus({
        name: 'Camiseta',
        categoryId: 'cat-1',
        baseCostPrice: 10,
        baseSalePrice: 50,
        skus: [],
      })
    ).rejects.toThrow('Dados inválidos: Nome, Categoria e ao menos um SKU são obrigatórios.')
  })

  it('deve propagar erros do banco de dados', async () => {
    mockProductCreate.mockRejectedValue(new Error('Falha ao conectar ao banco'))

    await expect(
      createProductWithSkus({
        name: 'Camiseta',
        categoryId: 'cat-1',
        baseCostPrice: 10,
        baseSalePrice: 50,
        skus: [
          {
            sku: 'CAM-PRETA-M',
            color: 'Preta',
            size: 'M',
            currentStock: 10,
            minimumStock: 1,
          },
        ],
      })
    ).rejects.toThrow('Falha ao conectar ao banco')
  })
})