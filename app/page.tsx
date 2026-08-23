import React from "react";
import { Search, Bell } from "lucide-react";
import { KpiCard } from "./components/kpi-card";
import { SkuTable } from "./components/sku-table";
import { DashboardActions } from "./components/dashboard-actions";
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
      {/* Header Superior */}
      <header className="bg-card border-b border-border h-16 flex items-center justify-between px-8 shrink-0">
        <div className="flex-1 max-w-2xl">
          <div className="relative w-full max-w-md hidden md:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-border rounded-full leading-5 bg-muted/50 text-foreground placeholder-muted-foreground focus:outline-none focus:bg-card focus:ring-2 focus:ring-accent focus:border-accent sm:text-sm transition-colors"
              placeholder="Pesquisar em todo o sistema..."
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-accent ring-2 ring-card"></span>
          </button>
          
          <div className="h-8 w-px bg-border mx-2"></div>
          
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="text-right hidden md:block">
              <div className="text-sm font-semibold text-foreground leading-tight">Admin</div>
              <div className="text-xs text-muted-foreground">Loja Principal</div>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-accent to-orange-300 flex items-center justify-center text-white font-bold shadow-sm">
              AD
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto bg-background">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard Overview</h1>
              <p className="text-muted-foreground mt-1 text-sm">Resumo do desempenho e alertas do seu estoque hoje.</p>
            </div>
            
            {/* Componente Client-Side para controlar os Modais */}
            <DashboardActions categories={categories} skus={skus} />
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

