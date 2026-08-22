import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SkuTable, SkuTableRow } from './sku-table'
import { StatusEstoque } from '../../src/domain/stock'

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
  it('deve renderizar as linhas da tabela com os dados fornecidos', () => {
    render(<SkuTable data={mockData} />)
    expect(screen.getByText('TEST-01')).toBeInTheDocument()
    expect(screen.getByText('Produto Teste')).toBeInTheDocument()
    expect(screen.getByText('TEST-02')).toBeInTheDocument()
  })

  it('deve exibir o badge Normal para estoque normal', () => {
    render(<SkuTable data={[mockData[0]]} />)
    expect(screen.getByText('Normal')).toBeInTheDocument()
  })

  it('deve exibir o badge Estoque Crítico para estoque crítico', () => {
    render(<SkuTable data={[mockData[1]]} />)
    expect(screen.getByText('Estoque Crítico')).toBeInTheDocument()
  })

  it('deve filtrar os resultados ao digitar no campo de busca', () => {
    render(<SkuTable data={mockData} />)
    
    // Ambas as linhas inicialmente visíveis
    expect(screen.getByText('TEST-01')).toBeInTheDocument()
    expect(screen.getByText('TEST-02')).toBeInTheDocument()
    
    // Buscar por TEST-01
    const searchInput = screen.getByPlaceholderText('Buscar SKU ou Produto...')
    fireEvent.change(searchInput, { target: { value: 'TEST-01' } })
    
    // Apenas TEST-01 deve estar visível
    expect(screen.getByText('TEST-01')).toBeInTheDocument()
    expect(screen.queryByText('TEST-02')).not.toBeInTheDocument()
  })
})
