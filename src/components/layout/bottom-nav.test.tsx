import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BottomNav } from './bottom-nav'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/produtos'),
}))

describe('UI: BottomNav Component', () => {
  it('deve renderizar os 5 links de navegação mobile', () => {
    render(<BottomNav />)
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /produtos/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /vendas/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /relatórios/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /configurações/i })).toBeInTheDocument()
  })

  it('deve destacar a aba ativa com estilo contendo a cor primária laranja (#f97316)', () => {
    render(<BottomNav />)
    const activeLink = screen.getByRole('link', { name: /produtos/i })
    expect(activeLink.className).toContain('text-[#f97316]')
  })
})
