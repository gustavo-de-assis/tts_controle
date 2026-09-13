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
  Filter,
  X,
} from "lucide-react";
import type { SaleHistoryItem } from "../../src/actions/sale";
import type { SkuTableRow } from "./sku-table";
import { SaleDetailModal } from "./sale-detail-modal";
import { SaleModal } from "./sale-modal";

interface SalesHistoryTableProps {
  sales: SaleHistoryItem[];
  availableSkus: SkuTableRow[];
}

const ITEMS_PER_PAGE = 10;

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
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSale, setSelectedSale] = useState<SaleHistoryItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  // Mobile filter drawer
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [tempStatusFilter, setTempStatusFilter] = useState("");
  const [tempPaymentFilter, setTempPaymentFilter] = useState("");

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

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / ITEMS_PER_PAGE));

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePaymentFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPaymentFilter(e.target.value);
    setCurrentPage(1);
  };

  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSales.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSales, currentPage]);

  const startIndex = filteredSales.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, filteredSales.length);

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

  const activeFilterCount = [statusFilter, paymentFilter].filter(Boolean).length;

  const openFilterDrawer = () => {
    setTempStatusFilter(statusFilter);
    setTempPaymentFilter(paymentFilter);
    setIsFilterDrawerOpen(true);
  };

  const applyMobileFilters = () => {
    setStatusFilter(tempStatusFilter);
    setPaymentFilter(tempPaymentFilter);
    setCurrentPage(1);
    setIsFilterDrawerOpen(false);
  };

  const clearMobileFilters = () => {
    setTempStatusFilter("");
    setTempPaymentFilter("");
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

      {/* ── Toolbar ─────────────────────────────────────────────────── */}

      {/* Desktop Toolbar (md+) */}
      <div className="hidden md:flex items-center gap-3 mb-6">
        {/* Busca */}
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            id="sale-search"
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Buscar por cliente ou ID da venda..."
            className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-xl bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-sm transition-colors"
          />
        </div>

        {/* Filtro por Status */}
        <div className="relative">
          <select
            id="status-filter"
            value={statusFilter}
            onChange={handleStatusFilterChange}
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
            onChange={handlePaymentFilterChange}
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

        {/* Botão Nova Venda — desktop only */}
        <button
          id="btn-nova-venda"
          onClick={() => setIsNewSaleOpen(true)}
          className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent/90 transition-all shadow-lg shadow-accent/25 whitespace-nowrap ml-auto"
        >
          <Plus className="w-4 h-4" />
          Nova Venda
        </button>
      </div>

      {/* Mobile Toolbar */}
      <div className="flex md:hidden items-center gap-2 mb-4">
        {/* Busca full-width */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            id="sale-search-mobile"
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Buscar cliente ou ID..."
            className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-xl bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-sm transition-colors"
          />
        </div>

        {/* Botão Filtros Mobile */}
        <button
          type="button"
          data-testid="btn-filtros-mobile"
          onClick={openFilterDrawer}
          className="relative flex items-center gap-1.5 px-3.5 py-2.5 border border-border rounded-xl bg-card text-foreground text-sm font-medium hover:bg-muted transition-colors shrink-0"
        >
          <Filter className="w-4 h-4" />
          <span>Filtros</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Filter Drawer (Bottom Sheet) */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end pb-10 md:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsFilterDrawerOpen(false)}
          />
          {/* Panel */}
          <div className="relative bg-[#131b2e] border-t border-slate-800 rounded-t-2xl p-5 pb-8 space-y-5 animate-in slide-in-from-bottom duration-300">
            {/* Handle */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-700 rounded-full" />

            {/* Header */}
            <div className="flex items-center justify-between pt-2">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Filter className="w-4 h-4 text-accent" />
                Filtrar Vendas
              </h3>
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "", label: "Todos" },
                  { value: "CONCLUIDA", label: "Concluídas" },
                  { value: "PENDENTE", label: "Pendentes" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTempStatusFilter(opt.value)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      tempStatusFilter === opt.value
                        ? "bg-accent text-white border-accent shadow-sm"
                        : "bg-[#1a233a] text-slate-300 border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Forma de Pagamento */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Forma de Pagamento</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "", label: "Todas" },
                  { value: "PIX", label: "PIX" },
                  { value: "CARTAO_CREDITO", label: "Cartão Crédito" },
                  { value: "CARTAO_DEBITO", label: "Cartão Débito" },
                  { value: "DINHEIRO", label: "Dinheiro" },
                  { value: "FIADO", label: "Fiado" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTempPaymentFilter(opt.value)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      tempPaymentFilter === opt.value
                        ? "bg-accent text-white border-accent shadow-sm"
                        : "bg-[#1a233a] text-slate-300 border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={clearMobileFilters}
                className="flex-1 py-2.5 border border-slate-700 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={applyMobileFilters}
                className="flex-1 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl text-sm font-semibold transition-all shadow-md active:scale-[0.98]"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Data Table ──────────────────────────────────────────────── */}
      {/* ── Data Table / Mobile Cards ──────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* ── Mobile Sales Cards View (block md:hidden) ────────────────── */}
        <div className="block md:hidden p-3 space-y-3 bg-muted/10">
          {paginatedSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
              <Receipt className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">Nenhuma venda encontrada.</p>
              {search && (
                <p className="text-xs opacity-70 text-center">
                  Tente ajustar os filtros ou o termo de busca.
                </p>
              )}
            </div>
          ) : (
            paginatedSales.map((sale) => {
              const isPending = sale.status === "PENDENTE";
              return (
                <div
                  key={sale.id}
                  data-testid="sale-card-mobile"
                  onClick={() => handleOpenDetail(sale)}
                  className="bg-card border border-border rounded-xl p-4 shadow-xs space-y-3 cursor-pointer hover:border-accent/40 active:scale-[0.99] transition-all"
                >
                  {/* Top row: ID, Date & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs font-bold text-foreground tracking-wider">
                        #{sale.id.slice(-8).toUpperCase()}
                      </span>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(sale.createdAt)}
                      </span>
                    </div>

                    <div>
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
                  </div>

                  {/* Customer and Payment method */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50 text-xs">
                    <div className="text-sm font-semibold text-foreground truncate flex-1">
                      {sale.customerName}
                    </div>
                    <span className="px-2 py-0.5 bg-muted rounded-md text-[11px] font-medium text-muted-foreground shrink-0">
                      {sale.paymentMethod}
                    </span>
                  </div>

                  {/* Total Amount & Detail Action */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs text-muted-foreground">Total:</span>
                      <span className="text-base font-bold font-mono text-foreground">
                        {formatCurrency(sale.totalAmount)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(sale);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-accent p-1.5 rounded-lg hover:bg-accent/10 transition-colors"
                      title="Ver Detalhes"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Detalhes</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Desktop Table View (hidden md:block) ─────────────────────── */}
        <div className="hidden md:block">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_1.2fr_1fr_1fr_1fr_1fr_4rem] px-5 py-3 border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <div>ID Venda</div>
            <div>Data / Hora</div>
            <div>Cliente</div>
            <div>Pagamento</div>
            <div className="text-right">Valor Total</div>
            <div className="text-center">Status</div>
            <div className="text-center">Ações</div>
          </div>

          {paginatedSales.length === 0 ? (
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
              {paginatedSales.map((sale) => {
                const isPending = sale.status === "PENDENTE";
                return (
                  <div
                    key={sale.id}
                    onClick={() => handleOpenDetail(sale)}
                    className="grid grid-cols-[1fr_1.2fr_1fr_1fr_1fr_1fr_4rem] items-center px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                  >
                    {/* ID Venda */}
                    <div className="font-mono text-xs font-bold text-foreground tracking-wider flex items-center gap-2">
                      <span>#{sale.id.slice(-8).toUpperCase()}</span>
                    </div>

                    {/* Data / Hora */}
                    <div className="text-xs text-muted-foreground">
                      {formatDate(sale.createdAt)}
                    </div>

                    {/* Cliente */}
                    <div className="text-sm text-foreground truncate">
                      {sale.customerName}
                    </div>

                    {/* Forma de Pagamento */}
                    <div>
                      <span className="px-2 py-0.5 bg-muted rounded-md text-xs font-medium text-muted-foreground">
                        {sale.paymentMethod}
                      </span>
                    </div>

                    {/* Valor Total */}
                    <div className="text-sm text-right font-mono font-bold text-foreground">
                      {formatCurrency(sale.totalAmount)}
                    </div>

                    {/* Status Badge */}
                    <div className="flex justify-center">
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
                    <div className="flex justify-center">
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
        </div>

        {/* Rodapé / Paginação */}
        <div className="px-5 py-4 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            Exibindo <strong className="text-foreground">{startIndex}</strong> a{" "}
            <strong className="text-foreground">{endIndex}</strong> de{" "}
            <strong className="text-foreground">{filteredSales.length}</strong>{" "}
            venda{filteredSales.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2">
            <span>
              Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-border rounded-lg text-xs hover:bg-muted disabled:opacity-40 transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-border rounded-lg text-xs hover:bg-muted disabled:opacity-40 transition-colors"
              >
                Próximo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating Action Button (FAB) Mobile ─────────────────────── */}
      <button
        type="button"
        data-testid="fab-nova-venda"
        onClick={() => setIsNewSaleOpen(true)}
        className="fixed bottom-20 right-4 z-40 rounded-full w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white shadow-lg flex items-center justify-center md:hidden transition-all active:scale-95 shadow-orange-500/30"
        aria-label="Nova Venda (PDV)"
        title="Nova Venda (PDV)"
      >
        <Plus className="w-6 h-6" />
      </button>

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
