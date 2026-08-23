import { describe, it, expect, vi, beforeEach } from 'vitest'
import { registerSale } from './sale'

// Mock do Prisma
const mockSkuFindMany = vi.hoisted(() => vi.fn())
const mockSaleCreate = vi.hoisted(() => vi.fn())
const mockSaleItemCreate = vi.hoisted(() => vi.fn())
const mockStockMovementCreate = vi.hoisted(() => vi.fn())
const mockSkuUpdate = vi.hoisted(() => vi.fn())
const mockCustomerFindUnique = vi.hoisted(() => vi.fn())
const mockCustomerCreate = vi.hoisted(() => vi.fn())
const mockValidarVenda = vi.hoisted(() => vi.fn())
const mockTransaction = vi.hoisted(() => vi.fn())

vi.mock('../lib/prisma', () => ({
  prisma: {
    $transaction: mockTransaction,
    sku: { findMany: mockSkuFindMany, update: mockSkuUpdate },
    sale: { create: mockSaleCreate },
    saleItem: { create: mockSaleItemCreate },
    stockMovement: { create: mockStockMovementCreate },
    customer: { findUnique: mockCustomerFindUnique, create: mockCustomerCreate },
  },
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('../domain/sale', () => ({
  processarVenda: vi.fn(),
  validarVenda: mockValidarVenda,
}))

import { processarVenda, type TipoMovimentacao } from '../domain/sale'

describe('registerSale', () => {
  const mockDbSkus = [
    {
      id: 'sku-1',
      color: 'Preta',
      size: 'M',
      currentStock: 10,
      minimumStock: 2,
      active: true,
      salePriceOverride: null,
      product: {
        id: 'prod-1',
        baseSalePrice: 5000,
      },
    },
    {
      id: 'sku-2',
      color: 'Preta',
      size: 'G',
      currentStock: 5,
      minimumStock: 1,
      active: true,
      salePriceOverride: 6000,
      product: {
        id: 'prod-1',
        baseSalePrice: 5000,
      },
    },
  ]

  const mockResultadoVenda = {
    movimentacoes: [
      { skuId: 'sku-1', tipo: 'SAIDA_VENDA' as TipoMovimentacao, quantidade: 2, valorUnitario: 50, dataHora: '2026-08-23T00:00:00.000Z' },
      { skuId: 'sku-2', tipo: 'SAIDA_VENDA' as TipoMovimentacao, quantidade: 1, valorUnitario: 60, dataHora: '2026-08-23T00:00:00.000Z' },
    ],
    skusAtualizados: [
      { id: 'sku-1', estoqueAtual: 8 },
      { id: 'sku-2', estoqueAtual: 4 },
    ],
    valorTotal: 160, // 2*50 + 1*60
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockTransaction.mockImplementation(async (cb) => {
      return cb({
        sku: { findMany: mockSkuFindMany, update: mockSkuUpdate },
        sale: { create: mockSaleCreate },
        saleItem: { create: mockSaleItemCreate },
        stockMovement: { create: mockStockMovementCreate },
        customer: { findUnique: mockCustomerFindUnique, create: mockCustomerCreate },
      })
    })

    mockSkuFindMany.mockResolvedValue(mockDbSkus)
    mockValidarVenda.mockImplementation((venda) => {
      if (venda.status === 'PENDENTE' && !venda.customerId) {
        throw new Error('Vendas pendentes exigem um cliente identificado.')
      }
    })
    mockSaleCreate.mockResolvedValue({ id: 'sale-1', totalAmount: 150, discount: 10 })
    mockSaleItemCreate.mockResolvedValue({ id: 'si-1' })
    mockStockMovementCreate.mockResolvedValue({ id: 'mov-1' })
    mockCustomerFindUnique.mockResolvedValue({ id: 'customer-1', name: 'Maria' })
    mockCustomerCreate.mockResolvedValue({ id: 'customer-1', name: 'Maria' })
    mockSkuUpdate.mockResolvedValue({ id: 'sku-1' })

    vi.mocked(processarVenda).mockReturnValue(mockResultadoVenda as never)
  })

  it('deve registrar uma venda e atualizar estoques', async () => {
    const saleId = await registerSale({
      paymentMethod: 'PIX',
      discount: 10,
      items: [
        { skuId: 'sku-1', quantity: 2 },
        { skuId: 'sku-2', quantity: 1 },
      ],
    })

    expect(saleId).toBe('sale-1')
    expect(mockTransaction).toHaveBeenCalledTimes(1)

    // Deve ter chamado processarVenda com os itens formatados
    expect(processarVenda).toHaveBeenCalledTimes(1)
    const itensChamados = vi.mocked(processarVenda).mock.calls[0][0]
    expect(itensChamados).toHaveLength(2)
    expect(itensChamados[0].sku.id).toBe('sku-1')
    expect(itensChamados[0].quantidade).toBe(2)
    expect(itensChamados[0].valorUnitario).toBe(50) // baseSalePrice do produto

    // SKU com override deve usar o override
    expect(itensChamados[1].valorUnitario).toBe(60) // salePriceOverride

    // Deve ter criado o registro de venda
    expect(mockSaleCreate).toHaveBeenCalledTimes(1)
    expect(mockSaleCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalAmount: 15000, // 160 - 10 em centavos
          discount: 1000,
          paymentMethod: 'PIX',
          status: 'CONCLUIDA',
        }),
      })
    )

    // Deve ter criado 2 sale items e 2 stock movements
    expect(mockSaleItemCreate).toHaveBeenCalledTimes(2)
    expect(mockStockMovementCreate).toHaveBeenCalledTimes(2)

    // Deve ter revalidado a rota
    const { revalidatePath } = await import('next/cache')
    expect(revalidatePath).toHaveBeenCalledWith('/')
  })

  it('deve rejeitar venda sem itens', async () => {
    await expect(
      registerSale({
        paymentMethod: 'PIX',
        discount: 0,
        items: [],
      })
    ).rejects.toThrow('A venda precisa ter ao menos um item.')
  })

  it('deve rejeitar venda com SKU inexistente', async () => {
    mockSkuFindMany.mockResolvedValue([])

    await expect(
      registerSale({
        paymentMethod: 'PIX',
        discount: 0,
        items: [
          { skuId: 'sku-inexistente', quantity: 1 },
        ],
      })
    ).rejects.toThrow('Um ou mais SKUs não foram encontrados no banco de dados.')
  })

  it('deve registrar venda pendente com cliente e vencimento', async () => {
    mockSkuFindMany.mockResolvedValue([mockDbSkus[0]])

    await registerSale({
      paymentMethod: 'FIADO',
      discount: 0,
      status: 'PENDENTE',
      customerName: 'Maria',
      dueDate: '2026-09-01',
      items: [{ skuId: 'sku-1', quantity: 1 }],
    })

    expect(mockCustomerCreate).toHaveBeenCalledWith({ data: { name: 'Maria' } })
    expect(mockSaleCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'PENDENTE',
          customerId: 'customer-1',
          dueDate: new Date('2026-09-01'),
        }),
      })
    )
  })

  it('deve rejeitar venda pendente sem cliente', async () => {
    await expect(registerSale({
      paymentMethod: 'FIADO',
      discount: 0,
      status: 'PENDENTE',
      items: [{ skuId: 'sku-1', quantity: 1 }],
    })).rejects.toThrow('Vendas pendentes exigem um cliente identificado.')
  })

  it('deve rejeitar venda com estoque insuficiente (domínio)', async () => {
    // Garante que o banco encontre exatamente o SKU solicitado
    mockSkuFindMany.mockResolvedValue([mockDbSkus[0]])

    // Simula a falha de estoque lançada pela regra de negócio
    vi.mocked(processarVenda).mockImplementation(() => {
      throw new Error('Estoque insuficiente para SKU sku-1')
    })

    await expect(
      registerSale({
        paymentMethod: 'PIX',
        discount: 0,
        items: [
          { skuId: 'sku-1', quantity: 100 },
        ],
      })
    ).rejects.toThrow('Estoque insuficiente para SKU sku-1')

    // Nenhuma operação de gravação deve ter sido chamada
    expect(mockSaleCreate).not.toHaveBeenCalled()
  })

  it('deve rejeitar venda com SKU inativo', async () => {
    const mockDbSkusInativo = [
      {
        id: 'sku-3',
        color: 'Azul',
        size: 'P',
        currentStock: 10,
        minimumStock: 1,
        active: false, // SKU inativo
        salePriceOverride: null,
        product: {
          id: 'prod-2',
          baseSalePrice: 40,
        },
      },
    ]
    mockSkuFindMany.mockResolvedValue(mockDbSkusInativo)

    vi.mocked(processarVenda).mockImplementation(() => {
      throw new Error('SKU inativo')
    })

    await expect(
      registerSale({
        paymentMethod: 'PIX',
        discount: 0,
        items: [
          { skuId: 'sku-3', quantity: 1 },
        ],
      })
    ).rejects.toThrow('SKU inativo')

    expect(mockSaleCreate).not.toHaveBeenCalled()
  })

  it('deve propagar erro desconhecido do banco', async () => {
    mockTransaction.mockRejectedValue(new Error('Database connection failed'))

    await expect(
      registerSale({
        paymentMethod: 'PIX',
        discount: 0,
        items: [
          { skuId: 'sku-1', quantity: 1 },
        ],
      })
    ).rejects.toThrow('Database connection failed')
  })
})