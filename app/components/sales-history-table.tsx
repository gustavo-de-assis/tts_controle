"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  ChevronDown,
  Receipt,
  Eye,
  CheckCircle2,
  Clock,
  DollarSign,
  UserCheck,
  TrendingUp,
} from "lucide-react";
import type { SaleHistoryItem } from "../../src/actions/sale";
import type { SkuTableRow } from "./sku-table";
import { SaleDetailModal } from "./sale-detail-modal";
import { SaleModal } from "./sale-modal";

interface SalesHistoryTableProps {
  sales: SaleHistoryItem[];
  availableSkus: SkuTableRow[];
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val);

const formatDate = (isoStr: string) => {
  const d = new Date(isoStr);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
};

export function SalesHistoryTable({
  sales,
  availableSkus,
}: SalesHistoryTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [selectedSale, setSelectedSale] = useState<SaleHistoryItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchesSearch =
        !search ||
        s.customerName.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || s.status === statusFilter;
      const matchesPayment =
        !paymentFilter || s.paymentMethod === paymentFilter;
      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [sales, search, statusFilter, paymentFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlySales = sales.filter((s) => {
      const d = new Date(s.createdAt);
      return (
        s.status === "CONCLUIDA" &&
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear
      );
    });

    const totalMonthly = monthlySales.reduce((acc, s) => acc + s.totalAmount, 0);

    const pendingSales = sales.filter((s) => s.status === "PENDENTE");
    const totalPending = pendingSales.reduce((acc, s) => acc + s.totalAmount, 0);

    const concludedSales = sales.filter((s) => s.status === "CONCLUIDA");
    const averageTicket =
      concludedSales.length > 0
        ? concludedSales.reduce((acc, s) => acc + s.totalAmount, 0) /
          concludedSales.length
        : 0;

    return {
      totalMonthly,
      pendingCount: pendingSales.length,
      totalPending,
      averageTicket,
    };
  }, [sales]);

  const handleOpenDetail = (sale: SaleHistoryItem) => {
    setSelectedSale(sale);
    setIsDetailOpen(true);
  };

  return (
    <>
      {/* ── Top KPI Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Total Vendido no Mês */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-accent/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Vendido (Mês)
            </h3>
            <div className="p-2 bg-success/10 text-success rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground font-mono">
            {formatCurrency(metrics.totalMonthly)}
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-success" />
            Vendas concluídas no mês atual
          </p>
        </div>

        {/* Card 2: Vendas Pendentes / Fiado */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-accent/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pendentes / Fiado
            </h3>
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground font-mono">
              {formatCurrency(metrics.totalPending)}
            </span>
            <span className="text-xs text-amber-500 font-semibold">
              ({metrics.pendingCount} pendente{metrics.pendingCount !== 1 ? "s" : ""})
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Aguardando pagamento / baixa
          </p>
        </div>

        {/* Card 3: Ticket Médio */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-accent/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Ticket Médio
            </h3>
            <div className="p-2 bg-accent/10 text-accent rounded-xl">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground font-mono">
            {formatCurrency(metrics.averageTicket)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Média por venda realizada
          </p>
        </div>
      </div>

      {/* ── Toolbar / Filtros ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        {/* Busca */}
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            id="sale-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente ou ID da venda..."
            className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-xl bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-sm transition-colors"
          />
        </div>

        {/* Filtro por Status */}
        <div className="relative">
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2.5 border border-border rounded-xl bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors cursor-pointer"
          >
            <option value="">Todos os Status</option>
            <option value="CONCLUIDA">Concluídas</option>
            <option value="PENDENTE">Pendentes</option>
          </select>
          <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>

        {/* Filtro por Forma de Pagamento */}
        <div className="relative">
          <select
            id="payment-filter"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2.5 border border-border rounded-xl bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors cursor-pointer"
          >
            <option value="">Todas as Formas</option>
            <option value="PIX">PIX</option>
            <option value="CARTAO_CREDITO">Cartão de Crédito</option>
            <option value="CARTAO_DEBITO">Cartão de Débito</option>
            <option value="DINHEIRO">Dinheiro</option>
            <option value="FIADO">Fiado / A Prazo</option>
          </select>
          <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>

        {/* Botão Nova Venda */}
        <button
          id="btn-nova-venda"
          onClick={() => setIsNewSaleOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent/90 transition-all shadow-lg shadow-accent/25 whitespace-nowrap ml-auto"
        >
          <Plus className="w-4 h-4" />
          Nova Venda
        </button>
      </div>

      {/* ── Data Table ──────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-[1fr_1.2fr_1fr_1fr_1fr_1fr_4rem] px-5 py-3 border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <div>ID Venda</div>
          <div>Data / Hora</div>
          <div>Cliente</div>
          <div>Pagamento</div>
          <div className="text-right">Valor Total</div>
          <div className="text-center">Status</div>
          <div className="text-center">Ações</div>
        </div>

        {filteredSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <Receipt className="w-12 h-12 opacity-30" />
            <p className="text-sm font-medium">Nenhuma venda encontrada.</p>
            {search && (
              <p className="text-xs opacity-70">
                Tente ajustar os filtros ou o termo de busca.
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredSales.map((sale) => {
              const isPending = sale.status === "PENDENTE";
              return (
                <div
                  key={sale.id}
                  onClick={() => handleOpenDetail(sale)}
                  className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_1.2fr_1fr_1fr_1fr_1fr_4rem] items-center px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                >
                  {/* ID Venda */}
                  <div className="font-mono text-xs font-bold text-foreground tracking-wider flex items-center gap-2">
                    <span>#{sale.id.slice(-8).toUpperCase()}</span>
                  </div>

                  {/* Data / Hora */}
                  <div className="hidden md:block text-xs text-muted-foreground">
                    {formatDate(sale.createdAt)}
                  </div>

                  {/* Cliente */}
                  <div className="hidden md:block text-sm text-foreground truncate">
                    {sale.customerName}
                  </div>

                  {/* Forma de Pagamento */}
                  <div className="hidden md:block">
                    <span className="px-2 py-0.5 bg-muted rounded-md text-xs font-medium text-muted-foreground">
                      {sale.paymentMethod}
                    </span>
                  </div>

                  {/* Valor Total */}
                  <div className="hidden md:block text-sm text-right font-mono font-bold text-foreground">
                    {formatCurrency(sale.totalAmount)}
                  </div>

                  {/* Status Badge */}
                  <div className="hidden md:flex justify-center">
                    {isPending ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <Clock className="w-3 h-3" />
                        Pendente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Concluída
                      </span>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex justify-end md:justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(sale);
                      }}
                      className="p-1.5 text-muted-foreground hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                      title="Ver Detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Rodapé */}
        <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Exibindo{" "}
            <strong className="text-foreground">
              {filteredSales.length}
            </strong>{" "}
            de <strong className="text-foreground">{sales.length}</strong>{" "}
            venda{sales.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── Modais ──────────────────────────────────────────────────── */}
      <SaleDetailModal
        sale={selectedSale}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedSale(null);
        }}
      />

      <SaleModal
        isOpen={isNewSaleOpen}
        onClose={() => setIsNewSaleOpen(false)}
        availableSkus={availableSkus}
      />
    </>
  );
}
