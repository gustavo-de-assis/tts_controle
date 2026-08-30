import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SkuTable, SkuTableRow } from './sku-table'
import { StatusEstoque } from '../../src/domain/stock'

vi.mock('../../src/lib/auth-guard', () => ({
  requireUser: vi.fn().mockResolvedValue({ id: 'user-1', role: 'ADMIN' }),
}))

const mockData: SkuTableRow[] = [
  { 
    id: "1", 
    sku: "TEST-01", 
    productName: "Produto Teste", 
    color: "Azul", 
    size: "M", 
    currentStock: 10, 
    minimumStock: 2, 
    status: StatusEstoque.NORMAL 
  },
  { 
    id: "2", 
    sku: "TEST-02", 
    productName: "Produto Crítico", 
    color: "Vermelho", 
    size: "P", 
    currentStock: 1, 
    minimumStock: 5, 
    status: StatusEstoque.ESTOQUE_CRITICO 
  }
]

describe('UI: SkuTable Component', () => {
  it('deve renderizar as linhas da tabela e os cards mobile com os dados fornecidos', () => {
    render(<SkuTable data={mockData} />)
    expect(screen.getAllByText('TEST-01')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Produto Teste')[0]).toBeInTheDocument()
    expect(screen.getAllByText('TEST-02')[0]).toBeInTheDocument()
  })

  it('deve exibir o badge Normal para estoque normal', () => {
    render(<SkuTable data={[mockData[0]]} />)
    expect(screen.getAllByText('Normal')[0]).toBeInTheDocument()
  })

  it('deve exibir o badge Estoque Crítico para estoque crítico', () => {
    render(<SkuTable data={[mockData[1]]} />)
    expect(screen.getAllByText('Estoque Crítico')[0]).toBeInTheDocument()
  })

  it('deve filtrar os resultados ao digitar no campo de busca', () => {
    render(<SkuTable data={mockData} />)
    
    // Ambas as linhas/cards inicialmente visíveis
    expect(screen.getAllByText('TEST-01')[0]).toBeInTheDocument()
    expect(screen.getAllByText('TEST-02')[0]).toBeInTheDocument()
    
    // Buscar por TEST-01
    const searchInput = screen.getByPlaceholderText('Buscar SKU ou Produto...')
    fireEvent.change(searchInput, { target: { value: 'TEST-01' } })
    
    // Apenas TEST-01 deve estar visível
    expect(screen.getAllByText('TEST-01')[0]).toBeInTheDocument()
    expect(screen.queryByText('TEST-02')).not.toBeInTheDocument()
  })

  it('deve renderizar a visão de cards mobile com a razão do estoque (atual / mínimo)', () => {
    render(<SkuTable data={mockData} />)
    // No mobile card render, deve renderizar os dados e razão de estoque
    const stockRatios = screen.getAllByTestId('sku-stock-ratio-mobile')
    expect(stockRatios).toHaveLength(2)
    expect(stockRatios[0].textContent).toContain('10 / 2')
    expect(stockRatios[1].textContent).toContain('1 / 5')
  })
})

