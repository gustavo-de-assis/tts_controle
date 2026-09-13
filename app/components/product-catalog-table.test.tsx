import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCatalogTable } from './product-catalog-table';
import { StatusEstoque } from '../../src/domain/stock';
import type { ProductCatalogItem } from '../../src/actions/product';

vi.mock('../../src/lib/auth-guard', () => ({
  requireUser: vi.fn().mockResolvedValue({ id: 'user-1', role: 'ADMIN' }),
}));

const mockCategories = [
  { id: 'cat-1', name: 'Vestuário' },
  { id: 'cat-2', name: 'Acessórios' },
];

const mockProducts: ProductCatalogItem[] = [
  {
    id: 'prod-1',
    name: 'Camisa Polo Classic',
    categoryId: 'cat-1',
    categoryName: 'Vestuário',
    baseCostPrice: 35.0,
    baseSalePrice: 89.9,
    totalStock: 15,
    skus: [
      {
        id: 'sku-1',
        sku: 'POLO-AZUL-M',
        color: 'Azul',
        size: 'M',
        currentStock: 10,
        minimumStock: 5,
        status: StatusEstoque.NORMAL,
      },
      {
        id: 'sku-2',
        sku: 'POLO-AZUL-G',
        color: 'Azul',
        size: 'G',
        currentStock: 5,
        minimumStock: 2,
        status: StatusEstoque.NORMAL,
      },
    ],
  },
  {
    id: 'prod-2',
    name: 'Calça Jeans Slim',
    categoryId: 'cat-1',
    categoryName: 'Vestuário',
    baseCostPrice: 60.0,
    baseSalePrice: 159.9,
    totalStock: 2,
    skus: [
      {
        id: 'sku-3',
        sku: 'JEANS-40',
        color: 'Azul Escuro',
        size: '40',
        currentStock: 2,
        minimumStock: 10,
        status: StatusEstoque.ESTOQUE_CRITICO,
      },
    ],
  },
];

describe('UI Mobile: ProductCatalogTable Component', () => {
  it('deve manter a ação inline de Novo Produto exclusiva para desktop', () => {
    render(<ProductCatalogTable products={mockProducts} categories={mockCategories} />);

    const newProductButton = document.getElementById('btn-novo-produto');
    expect(newProductButton).not.toBeNull();
    if (!newProductButton) throw new Error('Botão Novo Produto não encontrado');
    expect(newProductButton.id).toBe('btn-novo-produto');
    expect(newProductButton.className).toContain('hidden');
    expect(newProductButton.className).toContain('md:inline-flex');
  });

  it('deve renderizar o botão de filtros mobile', () => {
    render(<ProductCatalogTable products={mockProducts} categories={mockCategories} />);

    expect(screen.getByTestId('btn-filtros-mobile')).toBeInTheDocument();
  });

  it('deve renderizar os cards mobile de produtos com nome, categoria, preço e total em estoque', () => {
    render(<ProductCatalogTable products={mockProducts} categories={mockCategories} />);

    const mobileCards = screen.getAllByTestId('product-card-mobile');
    expect(mobileCards).toHaveLength(2);

    expect(screen.getAllByText('Camisa Polo Classic')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Calça Jeans Slim')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Vestuário').length).toBeGreaterThanOrEqual(2);
  });

  it('deve expandir e recolher sub-cards de SKUs no modo sanfona ao clicar no card', () => {
    render(<ProductCatalogTable products={mockProducts} categories={mockCategories} />);

    // Inicialmente os sub-cards do accordion não devem estar visíveis
    expect(screen.queryByText('POLO-AZUL-M')).not.toBeInTheDocument();

    // Clica para expandir o primeiro card sanfona
    const expandButtons = screen.getAllByTestId('product-card-toggle-mobile');
    fireEvent.click(expandButtons[0]);

    // Agora os sub-cards de SKU devem estar visíveis
    expect(screen.getAllByText('POLO-AZUL-M').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('POLO-AZUL-G').length).toBeGreaterThanOrEqual(1);

    // Clica novamente para recolher
    fireEvent.click(expandButtons[0]);
    expect(screen.queryByText('POLO-AZUL-M')).not.toBeInTheDocument();
  });

  it('deve renderizar o Floating Action Button (FAB) circular laranja com ícone + para novo produto', () => {
    render(<ProductCatalogTable products={mockProducts} categories={mockCategories} />);

    const fab = screen.getByTestId('fab-novo-produto');
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

    // Ao clicar no FAB, deve abrir o modal de Novo Produto
    fireEvent.click(fab);
    expect(screen.getByRole('heading', { name: 'Novo Produto' })).toBeInTheDocument();
  });
});
