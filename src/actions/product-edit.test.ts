import { beforeEach, describe, expect, it, vi } from 'vitest'
import { updateProductWithSku } from './product'

const mockProductUpdate = vi.hoisted(() => vi.fn())
const mockSkuUpdate = vi.hoisted(() => vi.fn())
const mockTransaction = vi.hoisted(() => vi.fn())

vi.mock('../lib/prisma', () => ({
  prisma: { $transaction: mockTransaction },
}))

vi.mock('../lib/auth-guard', () => ({
  requireUser: vi.fn().mockResolvedValue({ id: 'user-1', role: 'ADMIN' }),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('updateProductWithSku', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTransaction.mockImplementation(async (callback) => callback({
      product: { update: mockProductUpdate },
      sku: { update: mockSkuUpdate },
    }))
    mockProductUpdate.mockResolvedValue({ id: 'product-1', name: 'Camiseta Nova' })
    mockSkuUpdate.mockResolvedValue({ id: 'sku-1', sku: 'CAM-NOVA-M' })
  })

  it('deve atualizar os dados do produto e do SKU atomicamente', async () => {
    await updateProductWithSku({
      productId: 'product-1',
      skuId: 'sku-1',
      name: 'Camiseta Nova',
      baseCostPrice: 22,
      baseSalePrice: 59.9,
      sku: 'CAM-NOVA-M',
      color: 'Azul',
      size: 'M',
      minimumStock: 4,
    })

    expect(mockProductUpdate).toHaveBeenCalledWith({
      where: { id: 'product-1' },
      data: { name: 'Camiseta Nova', baseCostPrice: 2200, baseSalePrice: 5990 },
    })
    expect(mockSkuUpdate).toHaveBeenCalledWith({
      where: { id: 'sku-1' },
      data: { sku: 'CAM-NOVA-M', color: 'Azul', size: 'M', minimumStock: 4 },
    })
  })

  it('deve rejeitar nome ou identificadores ausentes', async () => {
    await expect(updateProductWithSku({
      productId: '', skuId: 'sku-1', name: '', baseCostPrice: 1, baseSalePrice: 2,
      sku: 'SKU', color: 'Azul', size: 'M', minimumStock: 1,
    })).rejects.toThrow('Produto, SKU e nome são obrigatórios.')
    expect(mockTransaction).not.toHaveBeenCalled()
  })
})