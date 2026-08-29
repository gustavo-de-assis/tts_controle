import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSalesHistory } from './sale'

// ── Mocks (padrão vi.hoisted do projeto) ────────────────────────────────────

const mockSaleFindMany = vi.hoisted(() => vi.fn())

vi.mock('../lib/prisma', () => ({
  prisma: {
    sale: { findMany: mockSaleFindMany },
  },
}))

vi.mock('../lib/auth-guard', () => ({
  requireUser: vi.fn().mockResolvedValue({ id: 'user-1', role: 'ADMIN' }),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('../domain/sale', () => ({
  processarVenda: vi.fn(),
  validarVenda: vi.fn(),
}))

// ── Fixtures ─────────────────────────────────────────────────────────────────

const makeDbSale = (overrides?: object) => ({
  id: 'sale-001',
  totalAmount: 15000,  // R$ 150,00 em centavos
  discount: 1000,      // R$ 10,00
  paymentMethod: 'PIX',
  status: 'CONCLUIDA',
  dueDate: null,
  createdAt: new Date('2026-08-28T20:00:00.000Z'),
  customer: { id: 'cust-1', name: 'João Silva' },
  items: [
    {
      id: 'si-1',
      quantity: 2,
      unitValue: 5000,  // R$ 50,00
      sku: {
        sku: 'CAM-PRETA-M',
        color: 'Preta',
        size: 'M',
        product: { name: 'Camiseta Básica' },
      },
    },
    {
      id: 'si-2',
      quantity: 1,
      unitValue: 5000,
      sku: {
        sku: 'CAM-PRETA-G',
        color: 'Preta',
        size: 'G',
        product: { name: 'Camiseta Básica' },
      },
    },
  ],
  ...overrides,
})

// ── Testes ──────────────────────────────────────────────────────────────────

describe('getSalesHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSaleFindMany.mockResolvedValue([makeDbSale()])
  })

  it('1. retorna lista mapeada com valores em reais e dados do cliente', async () => {
    const result = await getSalesHistory()

    expect(result).toHaveLength(1)
    const sale = result[0]

    expect(sale.id).toBe('sale-001')
    expect(sale.customerName).toBe('João Silva')
    expect(sale.paymentMethod).toBe('PIX')
    expect(sale.status).toBe('CONCLUIDA')
    expect(sale.totalAmount).toBe(150)   // fromCents(15000)
    expect(sale.discount).toBe(10)       // fromCents(1000)
    expect(sale.items).toHaveLength(2)
  })

  it('2. mapeia itens com dados de SKU e produto', async () => {
    const result = await getSalesHistory()
    const firstItem = result[0].items[0]

    expect(firstItem.skuCode).toBe('CAM-PRETA-M')
    expect(firstItem.productName).toBe('Camiseta Básica')
    expect(firstItem.color).toBe('Preta')
    expect(firstItem.size).toBe('M')
    expect(firstItem.quantity).toBe(2)
    expect(firstItem.unitValue).toBe(50)   // fromCents(5000)
  })

  it('3. retorna "Cliente não informado" quando customer é null', async () => {
    mockSaleFindMany.mockResolvedValue([makeDbSale({ customer: null })])

    const result = await getSalesHistory()

    expect(result[0].customerName).toBe('Cliente não informado')
  })

  it('4. passa o filtro de status corretamente ao Prisma', async () => {
    await getSalesHistory({ status: 'PENDENTE' })

    expect(mockSaleFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'PENDENTE' }),
      })
    )
  })

  it('5. passa o filtro de paymentMethod corretamente ao Prisma', async () => {
    await getSalesHistory({ paymentMethod: 'FIADO' })

    expect(mockSaleFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ paymentMethod: 'FIADO' }),
      })
    )
  })

  it('6. passa o filtro de datas (startDate/endDate) ao Prisma', async () => {
    await getSalesHistory({ startDate: '2026-08-01', endDate: '2026-08-31' })

    expect(mockSaleFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({
            gte: new Date('2026-08-01'),
            lte: new Date('2026-08-31'),
          }),
        }),
      })
    )
  })

  it('7. propaga erro quando a sessão não está autenticada', async () => {
    const { requireUser } = await import('../lib/auth-guard')
    vi.mocked(requireUser).mockRejectedValueOnce(new Error('Unauthorized'))

    await expect(getSalesHistory()).rejects.toThrow('Unauthorized')
  })
})
