"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  Clock,
  Calendar,
  CreditCard,
  QrCode,
  Banknote,
  Percent,
  Award,
  Sparkles,
  Flame,
  Tag,
  Filter,
  ArrowUpRight,
  ChevronRight,
  Info,
  CheckCircle2,
} from "lucide-react";
import {
  FinancialReportData,
  InventoryPerformanceData,
  StagnantSkuItem,
  getFinancialReportData,
} from "../../src/actions/reports";

export interface ReportsViewProps {
  initialFinancialData: FinancialReportData;
  initialPerformanceData: InventoryPerformanceData;
}

export type PeriodPreset = "month" | "30days" | "custom";
export type ActiveTab = "financial" | "performance" | "stagnant";

const ITEMS_PER_PAGE = 10;

export function ReportsView({
  initialFinancialData,
  initialPerformanceData,
}: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("financial");
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("month");
  
  // Date states for filtering
  const getInitialDates = (preset: PeriodPreset) => {
    const now = new Date();
    if (preset === "month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        start: firstDay.toISOString().split("T")[0],
        end: now.toISOString().split("T")[0],
      };
    } else if (preset === "30days") {
      const past30 = new Date();
      past30.setDate(now.getDate() - 30);
      return {
        start: past30.toISOString().split("T")[0],
        end: now.toISOString().split("T")[0],
      };
    }
    return { start: "", end: "" };
  };

  const initialDates = getInitialDates("month");
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);
  const [financialData, setFinancialData] = useState<FinancialReportData>(initialFinancialData);
  const [isPending, startTransition] = useTransition();

  // Table pagination states
  const [rankingPage, setRankingPage] = useState(1);
  const [stagnantPage, setStagnantPage] = useState(1);

  // Liquidation modal state
  const [selectedLiquidationSku, setSelectedLiquidationSku] = useState<StagnantSkuItem | null>(null);

  // Helper formatting function
  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getAbcBadge = (abc: "A" | "B" | "C") => {
    if (abc === "A")
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
          Classe A
        </span>
      );
    if (abc === "B")
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
          Classe B
        </span>
      );
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/15 text-slate-700 dark:text-slate-400 border border-slate-500/20">
        Classe C
      </span>
    );
  };

  const getStagnantStatusBadge = (days: number) => {
    if (days >= 90)
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
          <AlertTriangle className="w-3 h-3" />
          &gt; 90 dias (Crítico)
        </span>
      );
    if (days >= 60)
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/30">
          <Clock className="w-3 h-3" />
          &gt; 60 dias (Alerta)
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
        <Clock className="w-3 h-3" />
        &gt; 30 dias (Atenção)
      </span>
    );
  };

  // Handle Preset Change
  const handlePresetChange = (preset: PeriodPreset) => {
    setPeriodPreset(preset);
    if (preset !== "custom") {
      const dates = getInitialDates(preset);
      setStartDate(dates.start);
      setEndDate(dates.end);
      fetchFinancials(dates.start, dates.end);
    }
  };

  // Handle Custom Date Apply
  const fetchFinancials = (start?: string, end?: string) => {
    startTransition(async () => {
      try {
        const data = await getFinancialReportData({
          startDate: start || undefined,
          endDate: end || undefined,
        });
        setFinancialData(data);
      } catch (err) {
        console.error("Erro ao atualizar relatório financeiro:", err);
      }
    });
  };

  const handleCustomDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFinancials(startDate, endDate);
  };

  // Ranking Pagination Logic
  const rankingList = initialPerformanceData.productRanking;
  const totalRankingPages = Math.max(1, Math.ceil(rankingList.length / ITEMS_PER_PAGE));
  const paginatedRanking = useMemo(() => {
    const start = (rankingPage - 1) * ITEMS_PER_PAGE;
    return rankingList.slice(start, start + ITEMS_PER_PAGE);
  }, [rankingList, rankingPage]);

  // Stagnant Pagination Logic
  const stagnantList = initialPerformanceData.stagnantSkus;
  const totalStagnantPages = Math.max(1, Math.ceil(stagnantList.length / ITEMS_PER_PAGE));
  const paginatedStagnant = useMemo(() => {
    const start = (stagnantPage - 1) * ITEMS_PER_PAGE;
    return stagnantList.slice(start, start + ITEMS_PER_PAGE);
  }, [stagnantList, stagnantPage]);

  return (
    <div className="space-y-6">
      {/* ── Top Header Bar & Period Filter ──────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-accent" />
              Relatórios Gerenciais
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Visão estratégica de valoração de estoque, faturamento e giro de vendas.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-muted p-1.5 rounded-xl border border-border">
            <button
              onClick={() => handlePresetChange("month")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                periodPreset === "month"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mês Atual
            </button>
            <button
              onClick={() => handlePresetChange("30days")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                periodPreset === "30days"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Últimos 30 Dias
            </button>
            <button
              onClick={() => handlePresetChange("custom")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                periodPreset === "custom"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Personalizado
            </button>
          </div>
        </div>

        {/* Custom Date Pickers */}
        {periodPreset === "custom" && (
          <form
            onSubmit={handleCustomDateSubmit}
            className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-border/60"
          >
            {/* Date fields row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">De:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 min-w-0 bg-background border border-border text-foreground text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Até:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 min-w-0 bg-background border border-border text-foreground text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-4 py-2 sm:py-1.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Filter className="w-3.5 h-3.5" />
              {isPending ? "Filtrando..." : "Aplicar Filtro"}
            </button>
          </form>
        )}
      </div>

      {/* ── Navigation Tabs ─────────────────────────────────────────────────── */}
      <div
        data-testid="reports-tabs-container"
        className="border-b border-border flex items-center gap-2 sm:gap-4 text-sm font-medium overflow-x-auto whitespace-nowrap pb-1 no-scrollbar"
      >
        <button
          onClick={() => setActiveTab("financial")}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-t-xl transition-all border-b-2 shrink-0 whitespace-nowrap ${
            activeTab === "financial"
              ? "border-accent text-accent font-semibold bg-accent/5"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Financeiro</span>
        </button>
        <button
          onClick={() => setActiveTab("performance")}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-t-xl transition-all border-b-2 shrink-0 whitespace-nowrap ${
            activeTab === "performance"
              ? "border-accent text-accent font-semibold bg-accent/5"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Desempenho de Produtos</span>
        </button>
        <button
          onClick={() => setActiveTab("stagnant")}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-t-xl transition-all border-b-2 shrink-0 whitespace-nowrap relative ${
            activeTab === "stagnant"
              ? "border-accent text-accent font-semibold bg-accent/5"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Flame className="w-4 h-4 text-amber-500" />
          <span>Estoque Parado / Liquidação</span>
          {initialPerformanceData.stagnantSummary.totalSkusParados > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
              {initialPerformanceData.stagnantSummary.totalSkusParados}
            </span>
          )}
        </button>
      </div>

      {/* ── TAB 1: FINANCEIRO ────────────────────────────────────────────────── */}
      {activeTab === "financial" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Valuation KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Capital Investido (Custo Total) */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover-effect relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Capital Investido
                </span>
                <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {formatMoney(financialData.custoTotal)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Custo total de reposição do estoque ativo
              </p>
            </div>

            {/* Projeção de Venda */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover-effect relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Projeção de Caixa
                </span>
                <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {formatMoney(financialData.valorTotalVenda)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Valor bruto estimado na venda integral do estoque
              </p>
            </div>

            {/* Margem Projetada */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover-effect relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Margem Projetada
                </span>
                <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
                  <Percent className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold text-foreground">
                  {financialData.margemProjetada.toFixed(1)}%
                </div>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  ({formatMoney(financialData.lucroProjetado)})
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Lucro bruto projetado sobre custo
              </p>
            </div>

            {/* Faturamento do Período */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover-effect relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Faturamento (Período)
                </span>
                <div className="p-2 bg-accent/10 text-accent rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {formatMoney(financialData.faturamentoTotal)}
              </div>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {financialData.totalVendasCount} vendas concluídas no período
              </p>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-accent" />
                  Faturamento por Forma de Pagamento
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Distribuição de entradas brutas por canal no período selecionado.
                </p>
              </div>
              <span className="text-xs font-semibold bg-muted text-muted-foreground px-3 py-1 rounded-lg border border-border">
                Total: {formatMoney(financialData.faturamentoTotal)}
              </span>
            </div>

            {financialData.paymentMethods.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                Nenhuma venda concluída registrada para este período.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {financialData.paymentMethods.map((pm) => {
                  const getIcon = (method: string) => {
                    if (method === "PIX") return <QrCode className="w-5 h-5 text-emerald-500" />;
                    if (method === "CARTAO_CREDITO") return <CreditCard className="w-5 h-5 text-blue-500" />;
                    if (method === "CARTAO_DEBITO") return <CreditCard className="w-5 h-5 text-indigo-500" />;
                    return <Banknote className="w-5 h-5 text-amber-500" />;
                  };

                  return (
                    <div
                      key={pm.method}
                      className="p-4 rounded-xl border border-border bg-background/50 hover:bg-background transition-colors space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-card border border-border shadow-2xs">
                            {getIcon(pm.method)}
                          </div>
                          <div>
                            <span className="font-semibold text-foreground text-sm block">
                              {pm.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {pm.count} {pm.count === 1 ? "transação" : "transações"}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-foreground text-base">
                            {formatMoney(pm.totalAmount)}
                          </div>
                          <span className="text-xs font-semibold text-accent">
                            {pm.percentage}% do total
                          </span>
                        </div>
                      </div>

                      {/* Visual progress bar */}
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-accent h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(2, pm.percentage)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: DESEMPENHO DE PRODUTOS ────────────────────────────────────── */}
      {activeTab === "performance" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* ABC Legend Card */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Curva ABC & Ranking de Produtos
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Classificação baseada no princípio de Pareto (80% da receita vem de 20% dos itens).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Classe A (Alta Receita ~80%)
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Classe B (Médio Giro ~15%)
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-500/20">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                Classe C (Baixo Giro ~5%)
              </span>
            </div>
          </div>

          {/* Ranking Table & Mobile Cards */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ranking Completo de SKUs ({rankingList.length} itens)
              </span>
            </div>

            {/* ── Mobile Ranking Cards View (block md:hidden) ── */}
            <div className="block md:hidden p-3 space-y-3 bg-muted/10">
              {paginatedRanking.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Nenhum produto cadastrado no catálogo.
                </div>
              ) : (
                paginatedRanking.map((item, idx) => {
                  const absoluteIndex = (rankingPage - 1) * ITEMS_PER_PAGE + idx + 1;
                  return (
                    <div
                      key={item.id}
                      data-testid="ranking-card-mobile"
                      className="p-4 bg-card border border-border rounded-xl space-y-3 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                            #{absoluteIndex}
                          </span>
                          {getAbcBadge(item.abcClass)}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Estoque:{" "}
                          <strong
                            className={
                              item.currentStock === 0 ? "text-danger" : "text-foreground"
                            }
                          >
                            {item.currentStock} un
                          </strong>
                        </span>
                      </div>

                      <div>
                        <h4 className="font-semibold text-foreground text-sm leading-snug">
                          {item.productName}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span className="font-mono">{item.sku}</span>
                          <span>•</span>
                          <span>{item.color} / {item.size}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Qtd. Vendida</span>
                          <span className="font-bold text-foreground text-sm">
                            {item.quantitySold} pçs
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-muted-foreground block text-[11px]">Faturamento Total</span>
                          <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                            {formatMoney(item.totalRevenue)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ── Desktop Table View (hidden md:block) ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">SKU / Produto</th>
                    <th className="py-3 px-4">Variação</th>
                    <th className="py-3 px-4 text-center">Curva ABC</th>
                    <th className="py-3 px-4 text-right">Qtd. Vendida</th>
                    <th className="py-3 px-4 text-right">Faturamento Total</th>
                    <th className="py-3 px-4 text-right">Preço Médio</th>
                    <th className="py-3 px-4 text-right">Estoque Atual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedRanking.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhum produto cadastrado no catálogo.
                      </td>
                    </tr>
                  ) : (
                    paginatedRanking.map((item, idx) => {
                      const absoluteIndex = (rankingPage - 1) * ITEMS_PER_PAGE + idx + 1;
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-muted/40 transition-colors"
                        >
                          <td className="py-3 px-4 text-center font-bold text-xs text-muted-foreground">
                            {absoluteIndex}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-foreground block">
                              {item.productName}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {item.sku}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">
                            {item.color} / {item.size}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {getAbcBadge(item.abcClass)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-foreground">
                            {item.quantitySold} pçs
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {formatMoney(item.totalRevenue)}
                          </td>
                          <td className="py-3 px-4 text-right text-muted-foreground text-xs">
                            {formatMoney(item.averagePrice)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span
                              className={`font-semibold ${
                                item.currentStock === 0
                                  ? "text-danger"
                                  : "text-foreground"
                              }`}
                            >
                              {item.currentStock} un
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação Ranking */}
            <div className="px-5 py-4 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>
                Exibindo <strong>{rankingList.length > 0 ? (rankingPage - 1) * ITEMS_PER_PAGE + 1 : 0}</strong> a{" "}
                <strong>{Math.min(rankingPage * ITEMS_PER_PAGE, rankingList.length)}</strong> de{" "}
                <strong>{rankingList.length}</strong> itens
              </span>
              <div className="flex items-center gap-2">
                <span>Página <strong>{rankingPage}</strong> de <strong>{totalRankingPages}</strong></span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setRankingPage((prev) => Math.max(1, prev - 1))}
                    disabled={rankingPage === 1}
                    className="px-3 py-1 border border-border rounded-lg text-xs hover:bg-muted disabled:opacity-40 transition-colors"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setRankingPage((prev) => Math.min(totalRankingPages, prev + 1))}
                    disabled={rankingPage === totalRankingPages}
                    className="px-3 py-1 border border-border rounded-lg text-xs hover:bg-muted disabled:opacity-40 transition-colors"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Breakdown Cards (Giro por Tamanho e Cor) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Giro por Tamanho */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-foreground flex items-center justify-between border-b border-border pb-3">
                <span>Giro de Vendas por Tamanho</span>
                <span className="text-xs font-normal text-muted-foreground">
                  (Vendas vs. Saldo)
                </span>
              </h4>

              <div className="space-y-3">
                {initialPerformanceData.breakdownBySize.map((b) => {
                  const total = b.quantitySold + b.currentStock;
                  const soldShare = total > 0 ? (b.quantitySold / total) * 100 : 0;

                  return (
                    <div key={b.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground">
                          Tamanho {b.size}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            {b.quantitySold} vendidos
                          </span>
                          <span className="text-muted-foreground">
                            {b.currentStock} em estoque
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-2"
                          style={{ width: `${Math.max(5, soldShare)}%` }}
                          title={`Vendas: ${b.quantitySold}`}
                        />
                        <div
                          className="bg-blue-400 h-2 opacity-50"
                          style={{ width: `${100 - soldShare}%` }}
                          title={`Estoque: ${b.currentStock}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Giro por Cor */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-foreground flex items-center justify-between border-b border-border pb-3">
                <span>Giro de Vendas por Cor</span>
                <span className="text-xs font-normal text-muted-foreground">
                  (Vendas vs. Saldo)
                </span>
              </h4>

              <div className="space-y-3">
                {initialPerformanceData.breakdownByColor.map((b) => {
                  const total = b.quantitySold + b.currentStock;
                  const soldShare = total > 0 ? (b.quantitySold / total) * 100 : 0;

                  return (
                    <div key={b.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground">{b.color}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            {b.quantitySold} vendidos
                          </span>
                          <span className="text-muted-foreground">
                            {b.currentStock} em estoque
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden flex">
                        <div
                          className="bg-accent h-2"
                          style={{ width: `${Math.max(5, soldShare)}%` }}
                          title={`Vendas: ${b.quantitySold}`}
                        />
                        <div
                          className="bg-slate-400 h-2 opacity-50"
                          style={{ width: `${100 - soldShare}%` }}
                          title={`Estoque: ${b.currentStock}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: ESTOQUE PARADO / LIQUIDAÇÃO ────────────────────────────────── */}
      {activeTab === "stagnant" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Summary Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-amber-500/15 text-amber-600 rounded-xl">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Capital Preso em Estoque Parado (&gt; 30 Dias)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Identificação de itens sem movimentação de vendas para otimização de caixa.
                  </p>
                </div>
              </div>

              {/* Badges count */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  {initialPerformanceData.stagnantSummary.parados30Count} SKUs (30-59d)
                </span>
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/30">
                  {initialPerformanceData.stagnantSummary.parados60Count} SKUs (60-89d)
                </span>
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                  {initialPerformanceData.stagnantSummary.parados90Count} SKUs (&ge;90d)
                </span>
              </div>
            </div>

            {/* Total Capital Locked Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-card/80 backdrop-blur-sm border border-border p-4 rounded-xl">
                <span className="text-xs font-medium text-muted-foreground block">
                  Capital Travado em Custo
                </span>
                <div className="text-xl font-bold text-foreground mt-1">
                  {formatMoney(
                    initialPerformanceData.stagnantSummary.capitalTravadoTotalCusto
                  )}
                </div>
              </div>
              <div className="bg-card/80 backdrop-blur-sm border border-border p-4 rounded-xl">
                <span className="text-xs font-medium text-muted-foreground block">
                  Projeção de Recuo no Preço de Venda
                </span>
                <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {formatMoney(
                    initialPerformanceData.stagnantSummary.capitalTravadoTotalVenda
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stagnant SKU Table & Mobile Cards */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Lista de Peças sem Vendas
              </span>
            </div>

            {/* ── Mobile Stagnant Cards View (block md:hidden) ── */}
            <div className="block md:hidden p-3 space-y-3 bg-muted/10">
              {paginatedStagnant.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                  Excelente! Não há SKUs com estoque parado há mais de 30 dias.
                </div>
              ) : (
                paginatedStagnant.map((sku) => (
                  <div
                    key={sku.id}
                    data-testid="stagnant-card-mobile"
                    className="p-4 bg-card border border-border rounded-xl space-y-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStagnantStatusBadge(sku.diasSemVenda)}
                        <span className="text-xs text-muted-foreground">
                          {sku.diasSemVenda} dias
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Estoque: <strong className="text-foreground">{sku.currentStock} un</strong>
                      </span>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground text-sm leading-snug">
                        {sku.productName}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="font-mono text-accent font-semibold">{sku.sku}</span>
                        <span>•</span>
                        <span>{sku.color} / {sku.size}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Capital Travado</span>
                        <span className="font-bold text-sm text-amber-600 dark:text-amber-400 font-mono">
                          {formatMoney(sku.capitalTravadoCusto)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedLiquidationSku(sku)}
                        className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 text-xs px-3.5 py-1.5 rounded-lg font-semibold transition-colors border border-amber-500/30"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>Liquidar</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ── Desktop Table View (hidden md:block) ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="py-3 px-4">SKU / Produto</th>
                    <th className="py-3 px-4">Variação</th>
                    <th className="py-3 px-4 text-right">Estoque</th>
                    <th className="py-3 px-4 text-right">Custo Unit.</th>
                    <th className="py-3 px-4 text-right">Venda Unit.</th>
                    <th className="py-3 px-4 text-right">Capital Travado</th>
                    <th className="py-3 px-4 text-center">Dias sem Venda</th>
                    <th className="py-3 px-4 text-center">Status / Nível</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedStagnant.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-muted-foreground">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                        Excelente! Não há SKUs com estoque parado há mais de 30 dias.
                      </td>
                    </tr>
                  ) : (
                    paginatedStagnant.map((sku) => {
                      return (
                        <tr
                          key={sku.id}
                          className="hover:bg-muted/40 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <span className="font-semibold text-foreground block">
                              {sku.productName}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {sku.sku}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">
                            {sku.color} / {sku.size}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-foreground">
                            {sku.currentStock} un
                          </td>
                          <td className="py-3 px-4 text-right text-muted-foreground text-xs">
                            {formatMoney(sku.costPrice)}
                          </td>
                          <td className="py-3 px-4 text-right text-foreground font-medium text-xs">
                            {formatMoney(sku.salePrice)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-amber-600 dark:text-amber-400">
                            {formatMoney(sku.capitalTravadoCusto)}
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-foreground">
                            {sku.diasSemVenda} dias
                          </td>
                          <td className="py-3 px-4 text-center">
                            {getStagnantStatusBadge(sku.diasSemVenda)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => setSelectedLiquidationSku(sku)}
                              className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors border border-amber-500/30"
                            >
                              <Tag className="w-3.5 h-3.5" />
                              Liquidar
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação Estoque Parado */}
            <div className="px-5 py-4 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>
                Exibindo <strong>{stagnantList.length > 0 ? (stagnantPage - 1) * ITEMS_PER_PAGE + 1 : 0}</strong> a{" "}
                <strong>{Math.min(stagnantPage * ITEMS_PER_PAGE, stagnantList.length)}</strong> de{" "}
                <strong>{stagnantList.length}</strong> itens
              </span>
              <div className="flex items-center gap-2">
                <span>Página <strong>{stagnantPage}</strong> de <strong>{totalStagnantPages}</strong></span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setStagnantPage((prev) => Math.max(1, prev - 1))}
                    disabled={stagnantPage === 1}
                    className="px-3 py-1 border border-border rounded-lg text-xs hover:bg-muted disabled:opacity-40 transition-colors"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setStagnantPage((prev) => Math.min(totalStagnantPages, prev + 1))}
                    disabled={stagnantPage === totalStagnantPages}
                    className="px-3 py-1 border border-border rounded-lg text-xs hover:bg-muted disabled:opacity-40 transition-colors"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE SUGESTÃO DE LIQUIDAÇÃO ─────────────────────────────────── */}
      {selectedLiquidationSku && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-500" />
                Sugestão de Liquidação
              </h3>
              <button
                onClick={() => setSelectedLiquidationSku(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1 rounded-lg hover:bg-muted"
              >
                ✕
              </button>
            </div>

            {/* Sku Details */}
            <div className="bg-muted/50 p-4 rounded-xl space-y-2 border border-border">
              <span className="text-xs font-mono text-accent font-semibold">
                {selectedLiquidationSku.sku}
              </span>
              <h4 className="font-bold text-foreground text-sm">
                {selectedLiquidationSku.productName} ({selectedLiquidationSku.color} - {selectedLiquidationSku.size})
              </h4>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>Estoque Atual: <b>{selectedLiquidationSku.currentStock} un</b></span>
                <span>Sem vendas há: <b>{selectedLiquidationSku.diasSemVenda} dias</b></span>
              </div>
            </div>

            {/* Discount Calculation Recommendation */}
            {(() => {
              const days = selectedLiquidationSku.diasSemVenda;
              const discountPercent = days >= 90 ? 50 : days >= 60 ? 30 : 20;
              const originalPrice = selectedLiquidationSku.salePrice;
              const liquidatedPrice = originalPrice * (1 - discountPercent / 100);
              const costPrice = selectedLiquidationSku.costPrice;
              const isAboveCost = liquidatedPrice >= costPrice;

              return (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                      Estratégia Recomendada: Desconto de {discountPercent}%
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {days >= 90
                        ? "Peça parada há mais de 90 dias. Desconto agressivo sugerido para liberar caixa imediatamente."
                        : days >= 60
                        ? "Peça sem giro há 60 dias. Recomenda-se promoção de meio de estação."
                        : "Estoque parado há 30 dias. Aplicar cupom ou queimão leve."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl border border-border bg-background">
                      <span className="text-muted-foreground block">Preço De:</span>
                      <span className="text-base font-bold text-foreground line-through">
                        {formatMoney(originalPrice)}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold block">
                        Preço Por:
                      </span>
                      <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                        {formatMoney(liquidatedPrice)}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1 bg-muted p-3 rounded-xl border border-border">
                    <div className="flex justify-between">
                      <span>Custo da Peça:</span>
                      <span className="font-semibold text-foreground">{formatMoney(costPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Margem na Liquidação:</span>
                      <span className={`font-semibold ${isAboveCost ? "text-emerald-600" : "text-danger"}`}>
                        {formatMoney(liquidatedPrice - costPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-border/60">
                      <span>Recuperação Total de Caixa:</span>
                      <span className="font-bold text-foreground">
                        {formatMoney(liquidatedPrice * selectedLiquidationSku.currentStock)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedLiquidationSku(null)}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
