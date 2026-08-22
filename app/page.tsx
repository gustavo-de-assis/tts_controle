import React from "react";
import { Search, Bell } from "lucide-react";
import { KpiCard } from "./components/kpi-card";
import { SkuTable, SkuTableRow } from "./components/sku-table";
import { StatusEstoque } from "../src/domain/stock";

// Mock data
const mockSkus: SkuTableRow[] = [
  { id: "1", sku: "VES-FLO-P", productName: "Vestido Floral Verão", color: "Azul", size: "P", currentStock: 12, minimumStock: 3, status: StatusEstoque.NORMAL },
  { id: "2", sku: "VES-FLO-M", productName: "Vestido Floral Verão", color: "Azul", size: "M", currentStock: 2, minimumStock: 3, status: StatusEstoque.ESTOQUE_CRITICO },
  { id: "3", sku: "CAM-BAS-BR-G", productName: "Camiseta Básica", color: "Branco", size: "G", currentStock: 45, minimumStock: 10, status: StatusEstoque.NORMAL },
  { id: "4", sku: "CAL-JEA-AZ-38", productName: "Calça Jeans Skinny", color: "Azul Escuro", size: "38", currentStock: 0, minimumStock: 5, status: StatusEstoque.ESTOQUE_CRITICO },
  { id: "5", sku: "JAQ-COU-PR-M", productName: "Jaqueta Couro Sintético", color: "Preto", size: "M", currentStock: 8, minimumStock: 2, status: StatusEstoque.NORMAL },
];

export default function Home() {
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
          
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard Overview</h1>
            <p className="text-muted-foreground mt-1 text-sm">Resumo do desempenho e alertas do seu estoque hoje.</p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard 
              title="Faturamento Mensal" 
              value="R$ 42.500" 
              trend="up" 
              trendValue="12.5%" 
            />
            <KpiCard 
              title="Margem Média" 
              value="62.4%" 
              trend="up" 
              trendValue="2.1%" 
            />
            <KpiCard 
              title="Total em Estoque" 
              value="1.248" 
              trend="neutral" 
            />
            <KpiCard 
              title="Alertas de Reposição" 
              value="14" 
              trend="down" 
              trendValue="-3" 
            />
          </div>

          {/* Data Table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Status de Estoque por SKU</h2>
            </div>
            <SkuTable data={mockSkus} />
          </div>
          
        </div>
      </main>
    </>
  );
}
