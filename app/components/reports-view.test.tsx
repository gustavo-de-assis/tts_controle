import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportsView } from './reports-view';
import type { FinancialReportData, InventoryPerformanceData } from '../../src/actions/reports';

vi.mock('../../src/actions/reports', () => ({
  getFinancialReportData: vi.fn(),
}));

vi.mock('../../src/lib/auth-guard', () => ({
  requireUser: vi.fn().mockResolvedValue({ id: 'user-1', role: 'ADMIN' }),
}));

const mockFinancialData: FinancialReportData = {
  custoTotal: 10000,
  valorTotalVenda: 25000,
  lucroProjetado: 15000,
  margemProjetada: 60,
  faturamentoTotal: 5000,
  totalVendasCount: 15,
  paymentMethods: [
    { method: 'PIX', label: 'PIX', totalAmount: 3000, count: 10, percentage: 60 },
    { method: 'CARTAO_CREDITO', label: 'Cartão de Crédito', totalAmount: 2000, count: 5, percentage: 40 },
  ],
};

const mockPerformanceData: InventoryPerformanceData = {
  stagnantSkus: [
    {
      id: 'stagnant-1',
      sku: 'PARADO-01',
      productName: 'Vestido Longo Florido',
      color: 'Estampado',
      size: 'G',
      currentStock: 4,
      costPrice: 50,
      salePrice: 120,
      capitalTravadoCusto: 200,
      capitalTravadoVenda: 480,
      diasSemVenda: 45,
      lastSaleDate: null,
    },
  ],
  stagnantSummary: {
    totalSkusParados: 1,
    capitalTravadoTotalCusto: 200,
    capitalTravadoTotalVenda: 480,
    parados30Count: 1,
    parados60Count: 0,
    parados90Count: 0,
  },
  productRanking: [
    {
      id: 'rank-1',
      sku: 'TOP-01',
      productName: 'Camisa Linho',
      color: 'Branca',
      size: 'M',
      quantitySold: 20,
      totalRevenue: 3000,
      averagePrice: 150,
      currentStock: 8,
      abcClass: 'A',
    },
  ],
  breakdownBySize: [],
  breakdownByColor: [],
};

describe('UI Mobile: ReportsView Component', () => {
  it('deve possuir container de abas rolável horizontalmente no mobile (overflow-x-auto whitespace-nowrap)', () => {
    render(
      <ReportsView
        initialFinancialData={mockFinancialData}
        initialPerformanceData={mockPerformanceData}
      />
    );

    const tabsContainer = screen.getByTestId('reports-tabs-container');
    expect(tabsContainer).toBeInTheDocument();
    expect(tabsContainer.className).toContain('overflow-x-auto');
    expect(tabsContainer.className).toContain('whitespace-nowrap');
  });

  it('deve renderizar cards mobile para a Curva ABC na aba de Desempenho de Produtos', () => {
    render(
      <ReportsView
        initialFinancialData={mockFinancialData}
        initialPerformanceData={mockPerformanceData}
      />
    );

    // Clica na aba Desempenho de Produtos
    const performanceTab = screen.getByRole('button', { name: /Desempenho de Produtos/i });
    fireEvent.click(performanceTab);

    // Verifica se os cards mobile de ranking foram renderizados
    const rankingCardsMobile = screen.getAllByTestId('ranking-card-mobile');
    expect(rankingCardsMobile).toHaveLength(1);
    expect(screen.getAllByText('Camisa Linho')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Classe A')[0]).toBeInTheDocument();
  });

  it('deve renderizar cards mobile com botão Liquidar na aba de Estoque Parado', () => {
    render(
      <ReportsView
        initialFinancialData={mockFinancialData}
        initialPerformanceData={mockPerformanceData}
      />
    );

    // Clica na aba Estoque Parado
    const stagnantTab = screen.getByRole('button', { name: /Estoque Parado/i });
    fireEvent.click(stagnantTab);

    // Verifica se os cards mobile de estoque parado foram renderizados
    const stagnantCardsMobile = screen.getAllByTestId('stagnant-card-mobile');
    expect(stagnantCardsMobile).toHaveLength(1);
    expect(screen.getAllByText('Vestido Longo Florido')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Liquidar')[0]).toBeInTheDocument();
  });
});
