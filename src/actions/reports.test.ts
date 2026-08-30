import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getFinancialReportData, getInventoryPerformanceData } from './reports'

// ── Mocks (padrão vi.hoisted do projeto) ────────────────────────────────────

const mockSkuFindMany = vi.hoisted(() => vi.fn())
const mockSaleFindMany = vi.hoisted(() => vi.fn())
const mockSaleItemFindMany = vi.hoisted(() => vi.fn())

vi.mock('../lib/prisma', () => ({
  prisma: {
    sku: { findMany: mockSkuFindMany },
    sale: { findMany: mockSaleFindMany },
    saleItem: { findMany: mockSaleItemFindMany },
  },
}))

vi.mock('../lib/auth-guard', () => ({
  requireUser: vi.fn().mockResolvedValue({ id: 'user-1', role: 'ADMIN' }),
}))

// ── Fixtures ─────────────────────────────────────────────────────────────────

const makeDbSku = (overrides?: object) => ({
  id: 'sku-001',
  sku: 'CAM-PRETA-M',
  color: 'Preta',
  size: 'M',
  currentStock: 10,
  minimumStock: 2,
  salePriceOverride: 6000, // R$ 60,00 em centavos
  active: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  productId: 'prod-001',
  product: {
    id: 'prod-001',
    name: 'Camiseta Básica',
    baseCostPrice: 2000, // R$ 20,00 em centavos
    baseSalePrice: 5000, // R$ 50,00 em centavos
  },
  saleItems: [],
  ...overrides,
})

const makeDbSale = (overrides?: object) => ({
  id: 'sale-001',
  totalAmount: 12000, // R$ 120,00 em centavos
  discount: 0,
  paymentMethod: 'PIX',
  status: 'CONCLUIDA',
  createdAt: new Date('2026-08-15T12:00:00.000Z'),
  items: [
    {
      id: 'item-001',
      quantity: 2,
      unitValue: 6000,
      skuId: 'sku-001',
      sku: {
        id: 'sku-001',
        sku: 'CAM-PRETA-M',
        color: 'Preta',
        size: 'M',
        product: { id: 'prod-001', name: 'Camiseta Básica' },
      },
    },
  ],
  ...overrides,
})

describe('Server Actions de Relatórios Gerenciais (src/actions/reports.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-30T12:00:00.000Z'))
  })

  // ---------------------------------------------------------------------------
  // 1. getFinancialReportData
  // ---------------------------------------------------------------------------
  describe('getFinancialReportData', () => {
    it('1.1. verifica se requireUser é chamado', async () => {
      mockSkuFindMany.mockResolvedValue([])
      mockSaleFindMany.mockResolvedValue([])

      await getFinancialReportData()

      const { requireUser } = await import('../lib/auth-guard')
      expect(requireUser).toHaveBeenCalled()
    })

    it('1.2. calcula corretamente a valoração do estoque (Custo Total vs Valor em Venda e Margem)', async () => {
      const skus = [
        makeDbSku({
          id: 'sku-001',
          currentStock: 10,
          salePriceOverride: 6000, // R$ 60,00
          product: { name: 'Camiseta', baseCostPrice: 2000, baseSalePrice: 5000 },
        }),
        makeDbSku({
          id: 'sku-002',
          currentStock: 5,
          salePriceOverride: null, // usa baseSalePrice R$ 100,00
          product: { name: 'Calça', baseCostPrice: 4000, baseSalePrice: 10000 },
        }),
      ]
      mockSkuFindMany.mockResolvedValue(skus)
      mockSaleFindMany.mockResolvedValue([])

      const result = await getFinancialReportData()

      // Stock 1: 10 * 20 = 200 custo, 10 * 60 = 600 venda
      // Stock 2: 5 * 40 = 200 custo, 5 * 100 = 500 venda
      // Total Custo = R$ 400,00
      // Total Venda = R$ 1100,00
      // Lucro Projetado = R$ 700,00
      // Margem Projetada = ((1100 - 400) / 1100) * 100 = 63.64%
      expect(result.custoTotal).toBe(400)
      expect(result.valorTotalVenda).toBe(1100)
      expect(result.lucroProjetado).toBe(700)
      expect(result.margemProjetada).toBeCloseTo(63.64, 1)
    })

    it('1.3. calcula o faturamento e distribuição por forma de pagamento com filtros de data', async () => {
      mockSkuFindMany.mockResolvedValue([])
      const sales = [
        makeDbSale({ id: 's1', paymentMethod: 'PIX', totalAmount: 10000 }), // R$ 100,00
        makeDbSale({ id: 's2', paymentMethod: 'PIX', totalAmount: 5000 }),  // R$ 50,00
        makeDbSale({ id: 's3', paymentMethod: 'CARTAO_CREDITO', totalAmount: 5000 }), // R$ 50,00
      ]
      mockSaleFindMany.mockResolvedValue(sales)

      const result = await getFinancialReportData({
        startDate: '2026-08-01',
        endDate: '2026-08-31',
      })

      expect(mockSaleFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'CONCLUIDA',
            createdAt: expect.objectContaining({
              gte: new Date('2026-08-01'),
              lte: new Date('2026-08-31'),
            }),
          }),
        })
      )

      expect(result.faturamentoTotal).toBe(200)
      expect(result.totalVendasCount).toBe(3)

      const pixMethod = result.paymentMethods.find((pm) => pm.method === 'PIX')
      expect(pixMethod).toBeDefined()
      expect(pixMethod?.totalAmount).toBe(150)
      expect(pixMethod?.count).toBe(2)
      expect(pixMethod?.percentage).toBe(75)

      const ccMethod = result.paymentMethods.find((pm) => pm.method === 'CARTAO_CREDITO')
      expect(ccMethod).toBeDefined()
      expect(ccMethod?.totalAmount).toBe(50)
      expect(ccMethod?.count).toBe(1)
      expect(ccMethod?.percentage).toBe(25)
    })
  })

  // ---------------------------------------------------------------------------
  // 2. getInventoryPerformanceData
  // ---------------------------------------------------------------------------
  describe('getInventoryPerformanceData', () => {
    it('2.1. identifica SKUs sem giro (estoque sem vendas há 30/60/90 dias) e calcula capital travado', async () => {
      // Data atual simulada: 2026-08-30
      // 40 dias atrás: 2026-07-21
      // 70 dias atrás: 2026-06-21
      // 100 dias atrás: 2026-05-22
      const skus = [
        makeDbSku({
          id: 'sku-parado-30',
          sku: 'VEST-AMARELO-P',
          currentStock: 4,
          salePriceOverride: null,
          product: { baseCostPrice: 3000, baseSalePrice: 8000 }, // R$ 30 custo, R$ 80 venda
          saleItems: [
            {
              sale: {
                createdAt: new Date('2026-07-20T10:00:00.000Z'), // ~41 dias atrás
                status: 'CONCLUIDA',
              },
            },
          ],
        }),
        makeDbSku({
          id: 'sku-parado-70',
          sku: 'CAS-AZUL-G',
          currentStock: 2,
          product: { baseCostPrice: 5000, baseSalePrice: 12000 },
          saleItems: [
            {
              sale: {
                createdAt: new Date('2026-06-20T10:00:00.000Z'), // ~71 dias atrás
                status: 'CONCLUIDA',
              },
            },
          ],
        }),
        makeDbSku({
          id: 'sku-ativo-10',
          sku: 'CAM-PRETA-M',
          currentStock: 10,
          saleItems: [
            {
              sale: {
                createdAt: new Date('2026-08-25T10:00:00.000Z'), // 5 dias atrás
                status: 'CONCLUIDA',
              },
            },
          ],
        }),
      ]

      mockSkuFindMany.mockResolvedValue(skus)
      mockSaleItemFindMany.mockResolvedValue([])

      const result = await getInventoryPerformanceData()

      expect(result.stagnantSkus).toHaveLength(2)

      const sku30 = result.stagnantSkus.find((s) => s.id === 'sku-parado-30')
      expect(sku30).toBeDefined()
      expect(sku30?.diasSemVenda).toBeGreaterThanOrEqual(40)
      expect(sku30?.capitalTravadoCusto).toBe(120) // 4 * 30
      expect(sku30?.capitalTravadoVenda).toBe(320) // 4 * 80

      expect(result.stagnantSummary.totalSkusParados).toBe(2)
      expect(result.stagnantSummary.parados30Count).toBe(1) // 30-59 dias
      expect(result.stagnantSummary.parados60Count).toBe(1) // 60-89 dias
      expect(result.stagnantSummary.parados90Count).toBe(0)
    })

    it('2.2. calcula o ranking de produtos com curva ABC (Classes A, B e C)', async () => {
      mockSkuFindMany.mockResolvedValue([
        makeDbSku({ id: 'sku-1', sku: 'ITEM-A', color: 'Preta', size: 'M', currentStock: 20 }),
        makeDbSku({ id: 'sku-2', sku: 'ITEM-B', color: 'Branca', size: 'G', currentStock: 15 }),
        makeDbSku({ id: 'sku-3', sku: 'ITEM-C', color: 'Verde', size: 'P', currentStock: 5 }),
      ])

      // Vendas: Item A faturou R$ 800, Item B faturou R$ 150, Item C faturou R$ 50 (Total = R$ 1000)
      // Item A = 80% (Class A)
      // Item B = 15% (Class B)
      // Item C = 5% (Class C)
      mockSaleItemFindMany.mockResolvedValue([
        {
          id: 'si-1',
          quantity: 10,
          unitValue: 8000, // R$ 80
          skuId: 'sku-1',
          sale: { status: 'CONCLUIDA' },
          sku: { id: 'sku-1', sku: 'ITEM-A', color: 'Preta', size: 'M', product: { name: 'Prod A' } },
        },
        {
          id: 'si-2',
          quantity: 3,
          unitValue: 5000, // R$ 50
          skuId: 'sku-2',
          sale: { status: 'CONCLUIDA' },
          sku: { id: 'sku-2', sku: 'ITEM-B', color: 'Branca', size: 'G', product: { name: 'Prod B' } },
        },
        {
          id: 'si-3',
          quantity: 1,
          unitValue: 5000, // R$ 50
          skuId: 'sku-3',
          sale: { status: 'CONCLUIDA' },
          sku: { id: 'sku-3', sku: 'ITEM-C', color: 'Verde', size: 'P', product: { name: 'Prod C' } },
        },
      ])

      const result = await getInventoryPerformanceData()

      const itemA = result.productRanking.find((r) => r.sku === 'ITEM-A')
      const itemB = result.productRanking.find((r) => r.sku === 'ITEM-B')
      const itemC = result.productRanking.find((r) => r.sku === 'ITEM-C')

      expect(itemA?.abcClass).toBe('A')
      expect(itemB?.abcClass).toBe('B')
      expect(itemC?.abcClass).toBe('C')
    })

    it('2.3. gera agregação visual por tamanho e cor (breakdown)', async () => {
      mockSkuFindMany.mockResolvedValue([
        makeDbSku({ id: 'sku-1', color: 'Preta', size: 'M', currentStock: 10 }),
        makeDbSku({ id: 'sku-2', color: 'Preta', size: 'G', currentStock: 5 }),
      ])

      mockSaleItemFindMany.mockResolvedValue([
        {
          quantity: 4,
          skuId: 'sku-1',
          sale: { status: 'CONCLUIDA' },
          sku: { color: 'Preta', size: 'M' },
        },
        {
          quantity: 2,
          skuId: 'sku-2',
          sale: { status: 'CONCLUIDA' },
          sku: { color: 'Preta', size: 'G' },
        },
      ])

      const result = await getInventoryPerformanceData()

      const sizeM = result.breakdownBySize.find((b) => b.size === 'M')
      expect(sizeM?.quantitySold).toBe(4)
      expect(sizeM?.currentStock).toBe(10)

      const colorPreta = result.breakdownByColor.find((b) => b.color === 'Preta')
      expect(colorPreta?.quantitySold).toBe(6) // 4 + 2
      expect(colorPreta?.currentStock).toBe(15) // 10 + 5
    })
  })
})
