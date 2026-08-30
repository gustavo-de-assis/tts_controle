"use server";

import { prisma } from "../lib/prisma";
import { requireUser } from "../lib/auth-guard";
import { fromCents } from "../domain/money";

// ── Interfaces ───────────────────────────────────────────────────────────────

export interface PaymentMethodSummary {
  method: string;
  label: string;
  totalAmount: number; // em Reais
  count: number;
  percentage: number;  // % (0 - 100)
}

export interface FinancialReportData {
  custoTotal: number;          // R$ (Total custo do estoque ativo)
  valorTotalVenda: number;     // R$ (Projeção total de venda do estoque)
  lucroProjetado: number;      // R$ (valorTotalVenda - custoTotal)
  margemProjetada: number;     // %
  faturamentoTotal: number;    // R$ (Faturamento total de vendas concluídas no período)
  totalVendasCount: number;    // Qtd de vendas concluídas
  paymentMethods: PaymentMethodSummary[];
}

export interface StagnantSkuItem {
  id: string;
  sku: string;
  productName: string;
  color: string;
  size: string;
  currentStock: number;
  costPrice: number;            // em Reais
  salePrice: number;            // em Reais
  capitalTravadoCusto: number;  // em Reais
  capitalTravadoVenda: number;  // em Reais
  diasSemVenda: number;
  lastSaleDate: string | null;
}

export interface StagnantSummary {
  totalSkusParados: number;
  capitalTravadoTotalCusto: number; // em Reais
  capitalTravadoTotalVenda: number; // em Reais
  parados30Count: number;           // 30 - 59 dias
  parados60Count: number;           // 60 - 89 dias
  parados90Count: number;           // >= 90 dias
}

export interface ProductRankingItem {
  id: string;
  sku: string;
  productName: string;
  color: string;
  size: string;
  quantitySold: number;
  totalRevenue: number; // em Reais
  averagePrice: number; // em Reais
  currentStock: number;
  abcClass: "A" | "B" | "C";
}

export interface DistributionBreakdownItem {
  name: string; // Tamanho ou Cor
  size?: string;
  color?: string;
  quantitySold: number;
  currentStock: number;
}

export interface InventoryPerformanceData {
  stagnantSkus: StagnantSkuItem[];
  stagnantSummary: StagnantSummary;
  productRanking: ProductRankingItem[];
  breakdownBySize: DistributionBreakdownItem[];
  breakdownByColor: DistributionBreakdownItem[];
}

// ── Server Actions ───────────────────────────────────────────────────────────

/**
 * Retorna dados financeiros para relatórios gerenciais:
 * - Valoração do Estoque (Custo Total vs. Valor Total em Venda)
 * - Margem Projetada
 * - Faturamento por forma de pagamento
 */
export async function getFinancialReportData(filters?: {
  startDate?: string;
  endDate?: string;
}): Promise<FinancialReportData> {
  await requireUser();

  // 1. Valoração do Estoque Atual (SKUs ativos)
  const activeSkus = await prisma.sku.findMany({
    where: { active: true },
    include: { product: true },
  });

  let custoTotalCents = 0;
  let valorTotalVendaCents = 0;

  for (const sku of activeSkus) {
    const stock = sku.currentStock;
    const costUnit = sku.product.baseCostPrice;
    const saleUnit = sku.salePriceOverride ?? sku.product.baseSalePrice;

    custoTotalCents += stock * costUnit;
    valorTotalVendaCents += stock * saleUnit;
  }

  const custoTotal = fromCents(custoTotalCents);
  const valorTotalVenda = fromCents(valorTotalVendaCents);
  const lucroProjetado = valorTotalVenda - custoTotal;
  const margemProjetada =
    valorTotalVenda > 0 ? (lucroProjetado / valorTotalVenda) * 100 : 0;

  // 2. Faturamento por Forma de Pagamento no Período
  const whereSale: Record<string, unknown> = {
    status: "CONCLUIDA",
  };

  if (filters?.startDate || filters?.endDate) {
    const createdAtFilter: Record<string, Date> = {};
    if (filters.startDate) createdAtFilter.gte = new Date(filters.startDate);
    if (filters.endDate) createdAtFilter.lte = new Date(filters.endDate);
    whereSale.createdAt = createdAtFilter;
  }

  const sales = await prisma.sale.findMany({
    where: whereSale,
  });

  let faturamentoTotalCents = 0;
  const methodMap = new Map<string, { totalCents: number; count: number }>();

  for (const sale of sales) {
    faturamentoTotalCents += sale.totalAmount;

    const current = methodMap.get(sale.paymentMethod) ?? {
      totalCents: 0,
      count: 0,
    };
    methodMap.set(sale.paymentMethod, {
      totalCents: current.totalCents + sale.totalAmount,
      count: current.count + 1,
    });
  }

  const faturamentoTotal = fromCents(faturamentoTotalCents);
  const totalVendasCount = sales.length;

  const paymentMethodLabels: Record<string, string> = {
    PIX: "Pix",
    CARTAO_CREDITO: "Cartão de Crédito",
    CARTAO_DEBITO: "Cartão de Débito",
    DINHEIRO: "Dinheiro",
  };

  const paymentMethods: PaymentMethodSummary[] = Array.from(
    methodMap.entries()
  ).map(([method, data]) => {
    const totalAmount = fromCents(data.totalCents);
    const percentage =
      faturamentoTotal > 0 ? (totalAmount / faturamentoTotal) * 100 : 0;

    return {
      method,
      label: paymentMethodLabels[method] ?? method,
      totalAmount,
      count: data.count,
      percentage: Number(percentage.toFixed(2)),
    };
  });

  // Ordena por maior faturamento
  paymentMethods.sort((a, b) => b.totalAmount - a.totalAmount);

  return {
    custoTotal,
    valorTotalVenda,
    lucroProjetado,
    margemProjetada,
    faturamentoTotal,
    totalVendasCount,
    paymentMethods,
  };
}

/**
 * Retorna dados de desempenho de estoque:
 * - SKUs sem giro (estoque sem vendas há 30/60/90 dias)
 * - Capital travado nessas peças
 * - Ranking de itens mais/menos vendidos com Classificação ABC
 * - Análise visual de giro por tamanho e cor
 */
export async function getInventoryPerformanceData(): Promise<InventoryPerformanceData> {
  await requireUser();

  const now = new Date();

  // 1. Busca SKUs ativos com histórico de vendas
  const skus = await prisma.sku.findMany({
    where: { active: true },
    include: {
      product: true,
      saleItems: {
        where: {
          sale: { status: "CONCLUIDA" },
        },
        include: {
          sale: true,
        },
        orderBy: {
          sale: { createdAt: "desc" },
        },
      },
    },
  });

  // 2. Busca todos os itens de vendas concluídas para ranking e giro
  const allSaleItems = await prisma.saleItem.findMany({
    where: {
      sale: { status: "CONCLUIDA" },
    },
    include: {
      sku: {
        include: { product: true },
      },
    },
  });

  // ── 2.1 Análise de Estoque Parado (SKUs sem giro há >= 30 dias) ───────────

  const stagnantSkus: StagnantSkuItem[] = [];
  let capitalTravadoTotalCusto = 0;
  let capitalTravadoTotalVenda = 0;
  let parados30Count = 0;
  let parados60Count = 0;
  let parados90Count = 0;

  for (const sku of skus) {
    if (sku.currentStock <= 0) continue;

    // Encontra a data da última venda concluída ou usa a data de criação
    const lastSaleItem = sku.saleItems[0];
    const lastSaleDate = lastSaleItem ? lastSaleItem.sale.createdAt : null;
    const referenceDate = lastSaleDate ?? sku.createdAt;

    const diffTime = Math.max(0, now.getTime() - referenceDate.getTime());
    const diasSemVenda = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diasSemVenda >= 30) {
      const costPrice = fromCents(sku.product.baseCostPrice);
      const salePrice = fromCents(sku.salePriceOverride ?? sku.product.baseSalePrice);
      const capitalTravadoCusto = sku.currentStock * costPrice;
      const capitalTravadoVenda = sku.currentStock * salePrice;

      capitalTravadoTotalCusto += capitalTravadoCusto;
      capitalTravadoTotalVenda += capitalTravadoVenda;

      if (diasSemVenda >= 90) {
        parados90Count++;
      } else if (diasSemVenda >= 60) {
        parados60Count++;
      } else {
        parados30Count++;
      }

      stagnantSkus.push({
        id: sku.id,
        sku: sku.sku,
        productName: sku.product.name,
        color: sku.color,
        size: sku.size,
        currentStock: sku.currentStock,
        costPrice,
        salePrice,
        capitalTravadoCusto,
        capitalTravadoVenda,
        diasSemVenda,
        lastSaleDate: lastSaleDate ? lastSaleDate.toISOString() : null,
      });
    }
  }

  // Ordena SKUs parados por maior tempo sem vendas
  stagnantSkus.sort((a, b) => b.diasSemVenda - a.diasSemVenda);

  const stagnantSummary: StagnantSummary = {
    totalSkusParados: stagnantSkus.length,
    capitalTravadoTotalCusto,
    capitalTravadoTotalVenda,
    parados30Count,
    parados60Count,
    parados90Count,
  };

  // ── 2.2 Ranking de Produtos e Curva ABC ─────────────────────────────────

  const salesBySkuMap = new Map<
    string,
    { quantitySold: number; totalRevenueCents: number }
  >();

  for (const item of allSaleItems) {
    const current = salesBySkuMap.get(item.skuId) ?? {
      quantitySold: 0,
      totalRevenueCents: 0,
    };

    salesBySkuMap.set(item.skuId, {
      quantitySold: current.quantitySold + item.quantity,
      totalRevenueCents: current.totalRevenueCents + item.quantity * item.unitValue,
    });
  }

  // Mapeia todos os SKUs para a lista de ranking
  const rawRanking = skus.map((sku) => {
    const salesData = salesBySkuMap.get(sku.id) ?? {
      quantitySold: 0,
      totalRevenueCents: 0,
    };
    const totalRevenue = fromCents(salesData.totalRevenueCents);
    const salePrice = fromCents(sku.salePriceOverride ?? sku.product.baseSalePrice);
    const averagePrice =
      salesData.quantitySold > 0
        ? totalRevenue / salesData.quantitySold
        : salePrice;

    return {
      id: sku.id,
      sku: sku.sku,
      productName: sku.product.name,
      color: sku.color,
      size: sku.size,
      quantitySold: salesData.quantitySold,
      totalRevenue,
      averagePrice,
      currentStock: sku.currentStock,
    };
  });

  // Ordena por maior faturamento (e depois por quantidade vendida)
  rawRanking.sort((a, b) => {
    if (b.totalRevenue !== a.totalRevenue) return b.totalRevenue - a.totalRevenue;
    return b.quantitySold - a.quantitySold;
  });

  const grandTotalRevenue = rawRanking.reduce((acc, r) => acc + r.totalRevenue, 0);

  let cumulativeRevenue = 0;
  const productRanking: ProductRankingItem[] = rawRanking.map((item) => {
    let abcClass: "A" | "B" | "C" = "C";

    if (item.totalRevenue > 0 && grandTotalRevenue > 0) {
      const prevShare = cumulativeRevenue / grandTotalRevenue;
      cumulativeRevenue += item.totalRevenue;
      const currentShare = cumulativeRevenue / grandTotalRevenue;

      if (prevShare < 0.80) {
        abcClass = "A";
      } else if (prevShare < 0.95) {
        abcClass = "B";
      } else {
        abcClass = "C";
      }
    }

    return {
      ...item,
      abcClass,
    };
  });

  // ── 2.3 Giro por Tamanho e Cor ───────────────────────────────────────────

  const sizeMap = new Map<string, { quantitySold: number; currentStock: number }>();
  const colorMap = new Map<string, { quantitySold: number; currentStock: number }>();

  // Acumula estoque atual por tamanho/cor
  for (const sku of skus) {
    const sEntry = sizeMap.get(sku.size) ?? { quantitySold: 0, currentStock: 0 };
    sizeMap.set(sku.size, {
      ...sEntry,
      currentStock: sEntry.currentStock + sku.currentStock,
    });

    const cEntry = colorMap.get(sku.color) ?? { quantitySold: 0, currentStock: 0 };
    colorMap.set(sku.color, {
      ...cEntry,
      currentStock: cEntry.currentStock + sku.currentStock,
    });
  }

  // Acumula vendas por tamanho/cor
  for (const item of allSaleItems) {
    const size = item.sku.size;
    const color = item.sku.color;

    const sEntry = sizeMap.get(size) ?? { quantitySold: 0, currentStock: 0 };
    sizeMap.set(size, {
      ...sEntry,
      quantitySold: sEntry.quantitySold + item.quantity,
    });

    const cEntry = colorMap.get(color) ?? { quantitySold: 0, currentStock: 0 };
    colorMap.set(color, {
      ...cEntry,
      quantitySold: cEntry.quantitySold + item.quantity,
    });
  }

  const breakdownBySize: DistributionBreakdownItem[] = Array.from(
    sizeMap.entries()
  ).map(([size, data]) => ({
    name: size,
    size,
    quantitySold: data.quantitySold,
    currentStock: data.currentStock,
  }));
  breakdownBySize.sort((a, b) => b.quantitySold - a.quantitySold);

  const breakdownByColor: DistributionBreakdownItem[] = Array.from(
    colorMap.entries()
  ).map(([color, data]) => ({
    name: color,
    color,
    quantitySold: data.quantitySold,
    currentStock: data.currentStock,
  }));
  breakdownByColor.sort((a, b) => b.quantitySold - a.quantitySold);

  return {
    stagnantSkus,
    stagnantSummary,
    productRanking,
    breakdownBySize,
    breakdownByColor,
  };
}
