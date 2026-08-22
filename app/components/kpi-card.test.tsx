import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KpiCard } from './kpi-card'

describe('UI: KpiCard Component', () => {
  it('deve renderizar o título e o valor corretamente', () => {
    render(<KpiCard title="Total Vendas" value="R$ 1.000" />)
    expect(screen.getByText('Total Vendas')).toBeInTheDocument()
    expect(screen.getByText('R$ 1.000')).toBeInTheDocument()
  })

  it('deve renderizar a tendência quando provida', () => {
    render(<KpiCard title="Conversão" value="5%" trend="up" trendValue="+1%" />)
    expect(screen.getByText('+1%')).toBeInTheDocument()
  })

  it('não deve quebrar se a tendência for omitida', () => {
    const { container } = render(<KpiCard title="Sem Trend" value="10" />)
    expect(screen.getByText('Sem Trend')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    // Como a renderização condicional oculta o bloco trend, não deve estar lá
    expect(container.textContent).not.toContain('%')
  })
})
