import { beforeEach, describe, expect, it, vi } from 'vitest'
import { registerStockEntry } from './stock'

const mockSkuFindUnique = vi.hoisted(() => vi.fn())
const mockSkuUpdate = vi.hoisted(() => vi.fn())
const mockStockMovementCreate = vi.hoisted(() => vi.fn())
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

describe('registerStockEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTransaction.mockImplementation(async (callback) => callback({
      sku: { findUnique: mockSkuFindUnique, update: mockSkuUpdate },
      stockMovement: { create: mockStockMovementCreate },
    }))
    mockSkuFindUnique.mockResolvedValue({ id: 'sku-1', currentStock: 4, active: true })
    mockSkuUpdate.mockResolvedValue({ id: 'sku-1', currentStock: 9 })
    mockStockMovementCreate.mockResolvedValue({ id: 'movement-1' })
  })

  it('deve somar o estoque e registrar uma entrada', async () => {
    await registerStockEntry({ skuId: 'sku-1', quantity: 5, unitValue: 25 })

    expect(mockSkuUpdate).toHaveBeenCalledWith({
      where: { id: 'sku-1' },
      data: { currentStock: 9 },
    })
    expect(mockStockMovementCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        skuId: 'sku-1',
        type: 'ENTRADA',
        quantity: 5,
        unitValue: 2500,
      }),
    })
  })

  it('deve rejeitar quantidade ou custo inválidos', async () => {
    await expect(registerStockEntry({ skuId: 'sku-1', quantity: 0, unitValue: 25 }))
      .rejects.toThrow('Quantidade e custo unitário devem ser maiores que zero.')
    await expect(registerStockEntry({ skuId: 'sku-1', quantity: 2, unitValue: -1 }))
      .rejects.toThrow('Quantidade e custo unitário devem ser maiores que zero.')
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('deve rejeitar SKU inexistente ou inativo', async () => {
    mockSkuFindUnique.mockResolvedValueOnce(null)
    await expect(registerStockEntry({ skuId: 'missing', quantity: 1, unitValue: 10 }))
      .rejects.toThrow('SKU não encontrado.')

    mockSkuFindUnique.mockResolvedValueOnce({ id: 'sku-2', currentStock: 1, active: false })
    await expect(registerStockEntry({ skuId: 'sku-2', quantity: 1, unitValue: 10 }))
      .rejects.toThrow('Não é possível dar entrada em um SKU inativo.')
  })
})
