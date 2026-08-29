"use client";

import React, { useState, useMemo } from "react";
import { Search, ChevronDown, Eye } from "lucide-react";
import { KpiCard } from "./kpi-card";
import { SaleDetailModal } from "./sale-detail-modal";
import type { SaleHistoryItem } from "../../src/actions/sale";

interface SalesHistoryTableProps {
  data: SaleHistoryItem[];
  onRefresh?: () => void;
}

export function SalesHistoryTable({
  data,
  onRefresh,
}: SalesHistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [selectedSale, setSelectedSale] = useState<SaleHistoryItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Filter data
  const filteredData = useMemo(() => {
    return data.filter((sale) => {
      const matchesSearch =
        sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customerName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || sale.status === statusFilter;

      const matchesPayment =
        paymentMethodFilter === "all" ||
        sale.paymentMethod === paymentMethodFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [data, searchTerm, statusFilter, paymentMethodFilter]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthSales = filteredData.filter(
      (s) => new Date(s.createdAt) >= monthStart
    );

    const totalMonth = monthSales.reduce((acc, s) => acc + s.totalAmount, 0);
    const pendingSales = filteredData.filter(
      (s) => s.status === "PENDENTE"
    ).length;
    const avgTicket =
      filteredData.length > 0
        ? filteredData.reduce((acc, s) => acc + s.totalAmount, 0) /
          filteredData.length
        : 0;

    return {
      totalMonth,
      pendingSales,
      avgTicket,
    };
  }, [filteredData]);

  const handleSelectSale = (sale: SaleHistoryItem) => {
    setSelectedSale(sale);
    setDetailsOpen(true);
  };

  const handleCloseSaleDetail = () => {
    setDetailsOpen(false);
    setSelectedSale(null);
  };

  const handleSaleConcluded = () => {
    onRefresh?.();
  };

  // Unique payment methods from data
  const paymentMethods = useMemo(() => {
    return Array.from(new Set(data.map((s) => s.paymentMethod)));
  }, [data]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          title="Total Vendido (Mês)"
          value={`R$ ${kpis.totalMonth.toFixed(2)}`}
          trend={kpis.totalMonth > 0 ? "up" : "neutral"}
        />
        <KpiCard
          title="Vendas Pendentes"
          value={String(kpis.pendingSales)}
          trend={kpis.pendingSales > 0 ? "down" : "neutral"}
        />
        <KpiCard
          title="Ticket Médio"
          value={`R$ ${kpis.avgTicket.toFixed(2)}`}
          trend="neutral"
        />
      </div>

      {/* Filters & Search */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Buscar por ID ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-border rounded-md text-sm bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent appearance-none cursor-pointer pr-8"
            >
              <option value="all">Todos os Status</option>
              <option value="CONCLUIDA">Concluída</option>
              <option value="PENDENTE">Pendente</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>

          {/* Payment Method Filter */}
          <div className="relative">
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent appearance-none cursor-pointer pr-8"
            >
              <option value="all">Todas as Formas de Pgto</option>
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {filteredData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    Forma de Pgto
                  </th>
                  <th className="px-6 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider text-right">
                    Total
                  </th>
                  <th className="px-6 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider text-center">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredData.map((sale) => (
                  <tr key={sale.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground text-xs font-mono">
                      {sale.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-foreground text-sm">
                      {new Date(sale.createdAt).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      {sale.customerName}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {sale.paymentMethod}
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground text-right">
                      R$ {sale.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                          sale.status === "CONCLUIDA"
                            ? "bg-success/10 text-success border border-success/20"
                            : "bg-yellow-500/10 text-yellow-700 border border-yellow-500/20"
                        }`}
                      >
                        {sale.status === "CONCLUIDA" ? "Concluída" : "Pendente"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleSelectSale(sale)}
                        className="inline-flex items-center justify-center p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-accent"
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">
              Nenhuma venda encontrada com os filtros aplicados.
            </p>
          </div>
        )}
      </div>

      {/* Sale Detail Modal */}
      <SaleDetailModal
        sale={selectedSale}
        isOpen={detailsOpen}
        onClose={handleCloseSaleDetail}
        onSaleConcluded={handleSaleConcluded}
      />
    </div>
  );
}
