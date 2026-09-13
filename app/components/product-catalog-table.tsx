"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  Tag,
  Package,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Layers,
  Pencil,
  PlusCircle,
  PackagePlus,
  Filter,
  X,
} from "lucide-react";
import { StatusEstoque } from "../../src/domain/stock";
import type { ProductCatalogItem } from "../../src/actions/product";
import type { CategoryItem } from "../../src/actions/category";
import { ProductModal } from "./product-modal";
import { CategoryManagerModal } from "./category-manager-modal";
import { ProductParentEditModal } from "./product-parent-edit-modal";
import { AddSkuModal } from "./add-sku-modal";
import { StockEntryModal } from "./stock-entry-modal";
import type { SkuTableRow } from "./sku-table";

interface ProductCatalogTableProps {
  products: ProductCatalogItem[];
  categories: { id: string; name: string }[];
}

const ITEMS_PER_PAGE = 10;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export function ProductCatalogTable({
  products,
  categories,
}: ProductCatalogTableProps) {
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  // Modais
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductCatalogItem | null>(null);
  const [addSkuProduct, setAddSkuProduct] = useState<ProductCatalogItem | null>(null);
  const [stockEntrySku, setStockEntrySku] = useState<SkuTableRow | null>(null);
  const [localCategories, setLocalCategories] = useState<CategoryItem[]>(categories);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  // Mobile filter drawer
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [tempCategoryId, setTempCategoryId] = useState("");

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.categoryName.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        !selectedCategoryId ||
        localCategories.find((c) => c.id === selectedCategoryId)?.name ===
          p.categoryName;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategoryId, localCategories]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategoryId(e.target.value);
    setCurrentPage(1);
  };

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const startIndex = filtered.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, filtered.length);

  const activeFilterCount = selectedCategoryId ? 1 : 0;

  const openFilterDrawer = () => {
    setTempCategoryId(selectedCategoryId);
    setIsFilterDrawerOpen(true);
  };

  const applyMobileFilters = () => {
    setSelectedCategoryId(tempCategoryId);
    setCurrentPage(1);
    setIsFilterDrawerOpen(false);
  };

  const clearMobileFilters = () => {
    setTempCategoryId("");
  };

  return (
    <>
      {/* ── Barra de Ferramentas ──────────────────────────────────────── */}

      {/* Desktop Toolbar (md+) */}
      <div className="hidden md:flex items-center gap-3 mb-6">
        {/* Busca */}
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            id="product-search"
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Buscar produto ou categoria..."
            className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-xl bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-sm transition-colors"
          />
        </div>

        {/* Filtro de Categoria */}
        <div className="relative">
          <select
            id="category-filter"
            value={selectedCategoryId}
            onChange={handleCategoryChange}
            className="appearance-none pl-4 pr-10 py-2.5 border border-border rounded-xl bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors cursor-pointer"
          >
            <option value="">Todas as Categorias</option>
            {localCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>

        <button
          type="button"
          onClick={() => setIsCategoryManagerOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors whitespace-nowrap"
        >
          <Tag className="h-4 w-4" />
          Gerenciar Categorias
        </button>

        {/* Botão Novo Produto — desktop only */}
        <button
          id="btn-novo-produto"
          onClick={() => setIsProductModalOpen(true)}
          className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent/90 transition-all shadow-lg shadow-accent/25 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
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
            id="product-search-mobile"
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Buscar produto..."
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
                Filtrar Produtos
              </h3>
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Categoria</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTempCategoryId("")}
                  className={`py-2 px-4 rounded-xl text-xs font-semibold border transition-all ${
                    tempCategoryId === ""
                      ? "bg-accent text-white border-accent shadow-sm"
                      : "bg-[#1a233a] text-slate-300 border-slate-700 hover:border-slate-600"
                  }`}
                >
                  Todas
                </button>
                {localCategories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setTempCategoryId(c.id)}
                    className={`py-2 px-4 rounded-xl text-xs font-semibold border transition-all ${
                      tempCategoryId === c.id
                        ? "bg-accent text-white border-accent shadow-sm"
                        : "bg-[#1a233a] text-slate-300 border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    {c.name}
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

      {/* ── Tabela / Accordion ──────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* ── Mobile Stacked Accordion Cards View (block md:hidden) ── */}
        <div className="block md:hidden p-3 space-y-3 bg-muted/10">
          {paginatedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
              <Package className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">Nenhum produto encontrado.</p>
              {search && (
                <p className="text-xs opacity-70 text-center">
                  Tente ajustar a busca ou o filtro de categoria.
                </p>
              )}
            </div>
          ) : (
            paginatedProducts.map((product) => {
              const isExpanded = expandedIds.has(product.id);
              const hasCritical = product.skus.some(
                (s) => s.status === StatusEstoque.ESTOQUE_CRITICO
              );

              return (
                <div
                  key={product.id}
                  data-testid="product-card-mobile"
                  className="bg-card border border-border rounded-xl shadow-xs overflow-hidden"
                >
                  {/* Product Card Header */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="px-2 py-0.5 bg-muted rounded-full text-[11px] font-medium text-muted-foreground">
                            {product.categoryName}
                          </span>
                          {hasCritical && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-danger/10 text-danger border border-danger/20">
                              <AlertTriangle className="w-3 h-3" />
                              Crítico
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-semibold text-foreground leading-snug">
                          {product.name}
                        </h3>
                      </div>

                      <button
                        type="button"
                        data-testid="product-card-toggle-mobile"
                        onClick={() => toggleExpand(product.id)}
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? "Recolher" : "Expandir"} variações de ${product.name}`}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Preço e Total em Estoque */}
                    <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Preço</span>
                        <span className="font-mono font-bold text-sm text-foreground">
                          {formatCurrency(product.baseSalePrice)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-muted-foreground block text-[11px]">Total em Estoque</span>
                        <span
                          className={`font-bold text-sm ${
                            hasCritical ? "text-danger" : "text-success"
                          }`}
                        >
                          {product.totalStock} un.
                        </span>
                      </div>
                    </div>

                    {/* Ações Rápidas Mobile */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                      <button
                        type="button"
                        onClick={() => setAddSkuProduct(product)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-accent p-1.5 rounded-lg hover:bg-accent/10 transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Novo SKU</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingProduct(product)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                    </div>
                  </div>

                  {/* Sub-cards de variações de SKU (Accordion) */}
                  {isExpanded && (
                    <div className="bg-muted/20 border-t border-border/60 p-3 space-y-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Variações de SKU ({product.skus.length})
                      </div>
                      {product.skus.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-2">
                          Nenhuma variação cadastrada.
                        </p>
                      ) : (
                        product.skus.map((sku) => {
                          const isCritical = sku.status === StatusEstoque.ESTOQUE_CRITICO;
                          return (
                            <div
                              key={sku.id}
                              className="p-3 bg-card border border-border/80 rounded-xl space-y-2 shadow-2xs"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="font-mono text-xs font-bold text-foreground block tracking-wider">
                                    {sku.sku}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {sku.color} · {sku.size}
                                  </span>
                                </div>

                                {isCritical ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-danger/10 text-danger border border-danger/20 shrink-0">
                                    Estoque Crítico
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-success/10 text-success border border-success/20 shrink-0">
                                    Normal
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                                <span className="text-muted-foreground">
                                  Estoque: <strong className={isCritical ? "text-danger" : "text-foreground"}>{sku.currentStock}</strong> / Mín: {sku.minimumStock}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setStockEntrySku({
                                      id: sku.id,
                                      sku: sku.sku,
                                      productName: product.name,
                                      color: sku.color,
                                      size: sku.size,
                                      currentStock: sku.currentStock,
                                      minimumStock: sku.minimumStock,
                                      status: sku.status,
                                      baseCostPrice: product.baseCostPrice,
                                      baseSalePrice: product.baseSalePrice,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:text-accent/80 p-1 rounded transition-colors"
                                >
                                  <PackagePlus className="w-3.5 h-3.5" />
                                  <span>Entrada</span>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Desktop Table View (hidden md:block) ─────────────────────── */}
        <div className="hidden md:block">
          {/* Cabeçalho da Tabela */}
          <div className="grid grid-cols-[2.5rem_1.5fr_1fr_1fr_1fr_1fr_5rem] px-5 py-3 border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <div />
            <div className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" /> Produto
            </div>
            <div className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Categoria
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <DollarSign className="w-3.5 h-3.5" /> Custo Base
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <DollarSign className="w-3.5 h-3.5" /> Venda Base
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <Layers className="w-3.5 h-3.5" /> Total Estoque
            </div>
            <div className="text-center">Ações</div>
          </div>

          {paginatedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <Package className="w-12 h-12 opacity-30" />
              <p className="text-sm font-medium">Nenhum produto encontrado.</p>
              {search && (
                <p className="text-xs opacity-70">
                  Tente ajustar a busca ou o filtro de categoria.
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {paginatedProducts.map((product) => {
                const isExpanded = expandedIds.has(product.id);
                const hasCritical = product.skus.some(
                  (s) => s.status === StatusEstoque.ESTOQUE_CRITICO
                );

                return (
                  <div key={product.id}>
                    {/* ── Linha do Produto Pai ─────────────────────── */}
                    <div className="grid grid-cols-[2.5rem_1.5fr_1fr_1fr_1fr_1fr_5rem] items-center px-5 py-4 hover:bg-muted/30 transition-colors text-left group">
                      {/* Botão de Expansão */}
                      <button
                        type="button"
                        onClick={() => toggleExpand(product.id)}
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? "Recolher" : "Expandir"} variações de ${product.name}`}
                        className="flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>

                      {/* Nome + badge crítico */}
                      <div
                        onClick={() => toggleExpand(product.id)}
                        className="flex items-center gap-2 min-w-0 cursor-pointer"
                      >
                        <span className="font-semibold text-foreground truncate">
                          {product.name}
                        </span>
                        {hasCritical && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium bg-danger/10 text-danger border border-danger/20 shrink-0">
                            <AlertTriangle className="w-3 h-3" />
                            Alerta
                          </span>
                        )}
                      </div>

                      {/* Categoria */}
                      <div className="text-sm text-muted-foreground">
                        <span className="px-2 py-0.5 bg-muted rounded-full text-xs font-medium">
                          {product.categoryName}
                        </span>
                      </div>

                      {/* Custo Base */}
                      <div className="text-sm text-right font-mono text-muted-foreground">
                        {formatCurrency(product.baseCostPrice)}
                      </div>

                      {/* Venda Base */}
                      <div className="text-sm text-right font-mono font-medium text-foreground">
                        {formatCurrency(product.baseSalePrice)}
                      </div>

                      {/* Total Estoque */}
                      <div className="text-sm text-right">
                        <span
                          className={`font-bold ${
                            hasCritical ? "text-danger" : "text-success"
                          }`}
                        >
                          {product.totalStock}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          un.
                        </span>
                      </div>

                      {/* Botões de Ação do Produto Pai (Adicionar SKU + Editar Produto) */}
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddSkuProduct(product);
                          }}
                          title={`Adicionar SKU ao produto ${product.name}`}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProduct(product);
                          }}
                          title={`Editar produto ${product.name}`}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* ── Variações de SKU (Accordion) ─────────────── */}
                    {isExpanded && (
                      <div className="bg-muted/20 border-t border-border/50">
                        {/* Sub-cabeçalho das variações */}
                        <div className="grid grid-cols-[2.5rem_1.5fr_1fr_1fr_1fr_1fr_1fr_5rem] px-5 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/50">
                          <div />
                          <div>Código SKU</div>
                          <div>Cor</div>
                          <div>Tamanho</div>
                          <div className="text-right">Qtde</div>
                          <div className="text-right">Mín.</div>
                          <div className="text-center">Status</div>
                          <div className="text-center">Ações</div>
                        </div>

                        {product.skus.length === 0 ? (
                          <p className="px-8 py-4 text-sm text-muted-foreground italic">
                            Nenhuma variação ativa cadastrada.
                          </p>
                        ) : (
                          product.skus.map((sku) => {
                            const isCritical =
                              sku.status === StatusEstoque.ESTOQUE_CRITICO;
                            return (
                              <div
                                key={sku.id}
                                className="grid grid-cols-[2.5rem_1.5fr_1fr_1fr_1fr_1fr_1fr_5rem] items-center px-5 py-3 border-b border-border/30 last:border-b-0 hover:bg-muted/20 transition-colors"
                              >
                                {/* Ícone sub-nível */}
                                <div className="flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full bg-border" />
                                </div>

                                {/* Código SKU */}
                                <div className="font-mono text-xs font-semibold text-foreground tracking-wider">
                                  {sku.sku}
                                </div>

                                {/* Cor */}
                                <div className="text-sm text-muted-foreground">
                                  {sku.color}
                                </div>

                                {/* Tamanho */}
                                <div>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-xs font-bold text-foreground">
                                    {sku.size}
                                  </span>
                                </div>

                                {/* Qtde (Quantidade) */}
                                <div className="text-right">
                                  <span
                                    className={`font-bold text-sm ${
                                      isCritical
                                        ? "text-danger"
                                        : "text-foreground"
                                    }`}
                                  >
                                    {sku.currentStock}
                                  </span>
                                </div>

                                {/* Estoque Mínimo */}
                                <div className="text-right text-sm text-muted-foreground">
                                  {sku.minimumStock}
                                </div>

                                {/* Status Badge */}
                                <div className="flex justify-center">
                                  {isCritical ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-danger/10 text-danger border border-danger/20">
                                      <AlertTriangle className="w-3 h-3" />
                                      Estoque Crítico
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Normal
                                    </span>
                                  )}
                                </div>

                                {/* Botão de Ação para Entrada de Estoque no SKU */}
                                <div className="flex justify-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setStockEntrySku({
                                        id: sku.id,
                                        sku: sku.sku,
                                        productName: product.name,
                                        color: sku.color,
                                        size: sku.size,
                                        currentStock: sku.currentStock,
                                        minimumStock: sku.minimumStock,
                                        status: sku.status,
                                        baseCostPrice: product.baseCostPrice,
                                        baseSalePrice: product.baseSalePrice,
                                      })
                                    }
                                    title={`Dar entrada de estoque em ${sku.sku}`}
                                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors"
                                  >
                                    <PackagePlus className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
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
            <strong className="text-foreground">{filtered.length}</strong>{" "}
            produto{filtered.length !== 1 ? "s" : ""}
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
        data-testid="fab-novo-produto"
        onClick={() => setIsProductModalOpen(true)}
        className="fixed bottom-20 right-4 z-40 rounded-full w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white shadow-lg flex items-center justify-center md:hidden transition-all active:scale-95 shadow-orange-500/30"
        aria-label="Novo Produto"
        title="Novo Produto"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* ── Modais ─────────────────────────────────────────────────── */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        categories={localCategories}
        onCategoriesChange={setLocalCategories}
      />

      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        categories={localCategories}
        onClose={() => setIsCategoryManagerOpen(false)}
        onCategoriesChange={(nextCategories) => {
          setLocalCategories(nextCategories);
          if (selectedCategoryId && !nextCategories.some((category) => category.id === selectedCategoryId)) {
            setSelectedCategoryId("");
          }
        }}
      />

      <ProductParentEditModal
        isOpen={editingProduct !== null}
        product={editingProduct}
        categories={localCategories}
        onClose={() => setEditingProduct(null)}
      />

      <AddSkuModal
        isOpen={addSkuProduct !== null}
        product={addSkuProduct}
        onClose={() => setAddSkuProduct(null)}
      />

      <StockEntryModal
        isOpen={stockEntrySku !== null}
        sku={stockEntrySku}
        onClose={() => setStockEntrySku(null)}
      />
    </>
  );
}
