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
  PackagePlus,
} from "lucide-react";
import { StatusEstoque } from "../../src/domain/stock";
import type { ProductCatalogItem } from "../../src/actions/product";
import { ProductModal } from "./product-modal";
import { ProductParentEditModal } from "./product-parent-edit-modal";
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
  const [stockEntrySku, setStockEntrySku] = useState<SkuTableRow | null>(null);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.categoryName.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        !selectedCategoryId ||
        categories.find((c) => c.id === selectedCategoryId)?.name ===
          p.categoryName;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategoryId, categories]);

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

  return (
    <>
      {/* ── Barra de Ferramentas ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
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
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>

        {/* Botão Novo Produto */}
        <button
          id="btn-novo-produto"
          onClick={() => setIsProductModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent/90 transition-all shadow-lg shadow-accent/25 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </button>
      </div>

      {/* ── Tabela / Accordion ──────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Cabeçalho da Tabela */}
        <div className="hidden md:grid grid-cols-[2.5rem_1.5fr_1fr_1fr_1fr_1fr_4rem] px-5 py-3 border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
                  <div className="grid grid-cols-[2.5rem_1fr] md:grid-cols-[2.5rem_1.5fr_1fr_1fr_1fr_1fr_4rem] items-center px-5 py-4 hover:bg-muted/30 transition-colors text-left group">
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
                        <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium bg-danger/10 text-danger border border-danger/20 shrink-0">
                          <AlertTriangle className="w-3 h-3" />
                          Alerta
                        </span>
                      )}
                    </div>

                    {/* Categoria */}
                    <div className="hidden md:block text-sm text-muted-foreground">
                      <span className="px-2 py-0.5 bg-muted rounded-full text-xs font-medium">
                        {product.categoryName}
                      </span>
                    </div>

                    {/* Custo Base */}
                    <div className="hidden md:block text-sm text-right font-mono text-muted-foreground">
                      {formatCurrency(product.baseCostPrice)}
                    </div>

                    {/* Venda Base */}
                    <div className="hidden md:block text-sm text-right font-mono font-medium text-foreground">
                      {formatCurrency(product.baseSalePrice)}
                    </div>

                    {/* Total Estoque */}
                    <div className="hidden md:block text-sm text-right">
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

                    {/* Botão de Edição do Produto Pai */}
                    <div className="hidden md:flex justify-center">
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
                      <div className="hidden md:grid grid-cols-[2.5rem_1.5fr_1fr_1fr_1fr_1fr_1fr_4rem] px-5 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/50">
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
                              className="grid grid-cols-[2.5rem_1fr] md:grid-cols-[2.5rem_1.5fr_1fr_1fr_1fr_1fr_1fr_4rem] items-center px-5 py-3 border-b border-border/30 last:border-b-0 hover:bg-muted/20 transition-colors"
                            >
                              {/* Ícone sub-nível */}
                              <div className="flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-border" />
                              </div>

                              {/* Código SKU */}
                              <div className="font-mono text-xs font-semibold text-foreground tracking-wider">
                                {sku.sku}
                                {/* Mobile: exibe info compacta */}
                                <div className="md:hidden text-muted-foreground font-sans font-normal mt-0.5">
                                  {sku.color} · {sku.size} · Qtde:{" "}
                                  <span
                                    className={
                                      isCritical
                                        ? "text-danger font-bold"
                                        : "text-success font-bold"
                                    }
                                  >
                                    {sku.currentStock}
                                  </span>
                                </div>
                              </div>

                              {/* Cor */}
                              <div className="hidden md:block text-sm text-muted-foreground">
                                {sku.color}
                              </div>

                              {/* Tamanho */}
                              <div className="hidden md:block">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-xs font-bold text-foreground">
                                  {sku.size}
                                </span>
                              </div>

                              {/* Qtde (Quantidade) */}
                              <div className="hidden md:block text-right">
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
                              <div className="hidden md:block text-right text-sm text-muted-foreground">
                                {sku.minimumStock}
                              </div>

                              {/* Status Badge */}
                              <div className="hidden md:flex justify-center">
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
                              <div className="hidden md:flex justify-center">
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

      {/* ── Modais ─────────────────────────────────────────────────── */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        categories={categories}
      />

      <ProductParentEditModal
        isOpen={editingProduct !== null}
        product={editingProduct}
        categories={categories}
        onClose={() => setEditingProduct(null)}
      />

      <StockEntryModal
        isOpen={stockEntrySku !== null}
        sku={stockEntrySku}
        onClose={() => setStockEntrySku(null)}
      />
    </>
  );
}
