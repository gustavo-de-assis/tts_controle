import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createProductWithSkus, updateProduct } from './product'

// Mock do Prisma
const mockProductCreate = vi.hoisted(() => vi.fn())
const mockProductUpdate = vi.hoisted(() => vi.fn())
const mockSkuCreate = vi.hoisted(() => vi.fn())
const mockStockMovementCreate = vi.hoisted(() => vi.fn())
const mockTransaction = vi.hoisted(() => vi.fn())

vi.mock('../lib/prisma', () => ({
  prisma: {
    $transaction: mockTransaction,
    product: {
      create: mockProductCreate,
      update: mockProductUpdate,
    },
    sku: { create: mockSkuCreate },
    stockMovement: { create: mockStockMovementCreate },
  },
}))

vi.mock('../lib/auth-guard', () => ({
  requireUser: vi.fn().mockResolvedValue({ id: 'user-1', role: 'ADMIN' }),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('createProductWithSkus', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockTransaction.mockImplementation(async (cb) => {
      return cb({
        product: { create: mockProductCreate, update: mockProductUpdate },
        sku: { create: mockSkuCreate },
        stockMovement: { create: mockStockMovementCreate },
      })
    })

    mockProductCreate.mockResolvedValue({
      id: 'prod-1',
      name: 'Camiseta Básica',
      categoryId: 'cat-1',
      baseCostPrice: 1000,
      baseSalePrice: 5000,
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

    expect(mockProductCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ baseCostPrice: 1000, baseSalePrice: 5000 }),
    })
    expect(mockStockMovementCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ unitValue: 1000 }),
    })

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
      // @ts-expect-error - name é obrigatória
      createProductWithSkus({
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
      // @ts-expect-error - categoryId é obrigatória
      createProductWithSkus({
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

describe('updateProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProductUpdate.mockResolvedValue({
      id: 'prod-1',
      name: 'Camiseta Atualizada',
      categoryId: 'cat-2',
      baseCostPrice: 2000,
      baseSalePrice: 6000,
    })
  })

  it('deve atualizar o produto com valores convertidos em centavos', async () => {
    const result = await updateProduct({
      productId: 'prod-1',
      name: 'Camiseta Atualizada',
      categoryId: 'cat-2',
      baseCostPrice: 20,
      baseSalePrice: 60,
    })

    expect(mockProductUpdate).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
      data: {
        name: 'Camiseta Atualizada',
        categoryId: 'cat-2',
        baseCostPrice: 2000,
        baseSalePrice: 6000,
      },
    })
    expect(result.name).toBe('Camiseta Atualizada')
  })

  it('deve lançar erro se productId ou name forem inválidos', async () => {
    await expect(
      updateProduct({
        productId: '',
        name: 'Teste',
        baseCostPrice: 10,
        baseSalePrice: 20,
      })
    ).rejects.toThrow('ID do produto e nome são obrigatórios.')
  })
})