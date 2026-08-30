import React from "react";
import { Search, Bell } from "lucide-react";
import { KpiCard } from "./components/kpi-card";
import { SkuTable } from "./components/sku-table";
import { DashboardActions } from "./components/dashboard-actions";
import { TopHeader } from "./components/top-header";
import { getDashboardKpis } from "../src/actions/dashboard";
import { getSkus as fetchSkus } from "../src/actions/stock";
import { prisma } from "../src/lib/prisma";

export default async function Home() {
  const skus = await fetchSkus();
  const kpis = await getDashboardKpis();
  
  // Buscar categorias para o modal de produto
  const categories = await prisma.category.findMany({
    select: { id: true, name: true }
  });

  // Função utilitária para formatar valores em R$
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <>
      <TopHeader />

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 pb-20 md:pb-6 overflow-y-auto bg-background">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard Overview</h1>
              <p className="text-muted-foreground mt-1 text-sm">Resumo do desempenho e alertas do seu estoque hoje.</p>
            </div>
            
            {/* Componente Client-Side para controlar os Modais */}
            <DashboardActions categories={categories} skus={skus} />
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <KpiCard 
              title="Faturamento Mensal" 
              value={formatCurrency(kpis.monthlyRevenue)} 
              trend="up" 
              trendValue="0%" 
            />
            <KpiCard 
              title="Margem Média" 
              value={`${kpis.averageMargin.toFixed(1)}%`} 
              trend="neutral" 
            />
            <KpiCard 
              title="Total em Estoque" 
              value={kpis.totalStock.toString()} 
              trend="neutral" 
            />
            <KpiCard 
              title="Alertas de Reposição" 
              value={kpis.alertsCount.toString()} 
              trend={kpis.alertsCount > 0 ? "down" : "up"} 
            />
          </div>

          {/* Data Table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Status de Estoque por SKU</h2>
            </div>
            <SkuTable data={skus} />
          </div>
          
        </div>
      </main>
    </>
  );
}

