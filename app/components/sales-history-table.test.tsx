import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SalesHistoryTable } from './sales-history-table';
import type { SaleHistoryItem } from '../../src/actions/sale';
import type { SkuTableRow } from './sku-table';
import { StatusEstoque } from '../../src/domain/stock';

vi.mock('../../src/lib/auth-guard', () => ({
  requireUser: vi.fn().mockResolvedValue({ id: 'user-1', role: 'ADMIN' }),
}));

const mockSales: SaleHistoryItem[] = [
  {
    id: 'sale-12345678',
    createdAt: '2026-03-10T14:30:00.000Z',
    customerName: 'Maria Silva',
    paymentMethod: 'PIX',
    totalAmount: 189.9,
    discount: 0,
    dueDate: null,
    status: 'CONCLUIDA',
    items: [],
  },
  {
    id: 'sale-87654321',
    createdAt: '2026-03-11T10:15:00.000Z',
    customerName: 'João Santos',
    paymentMethod: 'FIADO',
    totalAmount: 320.0,
    discount: 0,
    dueDate: null,
    status: 'PENDENTE',
    items: [],
  },
];

const mockSkus: SkuTableRow[] = [
  {
    id: 'sku-1',
    sku: 'SKU-01',
    productName: 'Camisa Teste',
    color: 'Branco',
    size: 'M',
    currentStock: 10,
    minimumStock: 2,
    status: StatusEstoque.NORMAL,
  },
];

describe('UI Mobile: SalesHistoryTable Component', () => {
  it('deve manter a ação inline de Nova Venda exclusiva para desktop', () => {
    render(<SalesHistoryTable sales={mockSales} availableSkus={mockSkus} />);

    const newSaleButton = document.getElementById('btn-nova-venda');
    expect(newSaleButton).not.toBeNull();
    if (!newSaleButton) throw new Error('Botão Nova Venda não encontrado');
    expect(newSaleButton.id).toBe('btn-nova-venda');
    expect(newSaleButton.className).toContain('hidden');
    expect(newSaleButton.className).toContain('md:inline-flex');
  });

  it('deve renderizar o botão de filtros mobile', () => {
    render(<SalesHistoryTable sales={mockSales} availableSkus={mockSkus} />);

    expect(screen.getByTestId('btn-filtros-mobile')).toBeInTheDocument();
  });

  it('deve renderizar os cards mobile com ID, Data, Cliente, Tag de Status e Valor Total', () => {
    render(<SalesHistoryTable sales={mockSales} availableSkus={mockSkus} />);

    const mobileCards = screen.getAllByTestId('sale-card-mobile');
    expect(mobileCards).toHaveLength(2);

    expect(screen.getAllByText('Maria Silva')[0]).toBeInTheDocument();
    expect(screen.getAllByText('João Santos')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Concluída')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Pendente')[0]).toBeInTheDocument();
  });

  it('deve renderizar o Floating Action Button (FAB) circular laranja para Nova Venda', () => {
    render(<SalesHistoryTable sales={mockSales} availableSkus={mockSkus} />);

    const fab = screen.getByTestId('fab-nova-venda');
    expect(fab).toBeInTheDocument();
    expect(fab.className).toContain('fixed');
    expect(fab.className).toContain('bottom-20');
    expect(fab.className).toContain('right-4');
    expect(fab.className).toContain('z-40');
    expect(fab.className).toContain('rounded-full');
    expect(fab.className).toContain('w-14');
    expect(fab.className).toContain('h-14');
    expect(fab.className).toContain('bg-orange-500');
    expect(fab.className).toContain('shadow-lg');
    expect(fab.className).toContain('md:hidden');

    // Ao clicar no FAB, deve abrir o modal de Nova Venda (Ponto de Venda)
    fireEvent.click(fab);
    expect(screen.getByRole('heading', { name: /Ponto de Venda/i })).toBeInTheDocument();
  });
});
