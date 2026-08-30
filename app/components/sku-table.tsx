"use client";

import React, { useState, useMemo } from "react";
import { Search, ArrowUpDown, AlertTriangle } from "lucide-react";
import { StatusEstoque } from "../../src/domain/stock";

export interface SkuTableRow {
  id: string;
  productId?: string;
  sku: string;
  productName: string;
  baseCostPrice?: number;
  baseSalePrice?: number;
  color: string;
  size: string;
  currentStock: number;
  minimumStock: number;
  salePrice?: number;
  status: StatusEstoque;
}

const ITEMS_PER_PAGE = 10;

export function SkuTable({ data }: { data: SkuTableRow[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  // Total de páginas
  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));

  // Reset da página quando a busca muda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Dados fatiados para a página atual
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const startIndex = filteredData.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length);

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-border flex items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-border rounded-md leading-5 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent sm:text-sm"
            placeholder="Buscar SKU ou Produto..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Mobile Stacked Cards View (block md:hidden) */}
      <div className="block md:hidden p-3 space-y-3 bg-muted/10">
        {paginatedData.length > 0 ? (
          paginatedData.map((row) => (
            <div
              key={row.id}
              className="p-4 bg-card border border-border rounded-xl flex items-start justify-between gap-3 shadow-xs"
            >
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-0.5">
                  SKU
                </span>
                <h3 className="text-base font-semibold text-foreground leading-snug">
                  {row.productName}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {row.color} - {row.size}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <div
                  data-testid="sku-stock-ratio-mobile"
                  className="flex items-center gap-1 text-sm font-bold"
                >
                  <span
                    className={
                      row.status === StatusEstoque.ESTOQUE_CRITICO
                        ? "text-danger"
                        : "text-foreground"
                    }
                  >
                    {row.currentStock}
                  </span>
                  <span className="text-muted-foreground font-normal mx-0.5"> / </span>
                  <span className="text-muted-foreground">{row.minimumStock}</span>
                  {row.status === StatusEstoque.ESTOQUE_CRITICO && (
                    <AlertTriangle className="w-4 h-4 text-danger inline-block ml-0.5 shrink-0" />
                  )}
                </div>

                {row.status === StatusEstoque.ESTOQUE_CRITICO ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-danger/10 text-danger border border-danger/20">
                    Estoque Crítico
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-success/10 text-success border border-success/20">
                    Normal
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Nenhum SKU encontrado para a busca &quot;{searchTerm}&quot;.
          </div>
        )}
      </div>

      {/* Desktop Table View (hidden md:block) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
            <tr>
              <th scope="col" className="px-6 py-3 font-semibold tracking-wider">
                <div className="flex items-center gap-2 cursor-pointer hover:text-foreground">
                  SKU
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th scope="col" className="px-6 py-3 font-semibold tracking-wider">Produto</th>
              <th scope="col" className="px-6 py-3 font-semibold tracking-wider">Cor / Tamanho</th>
              <th scope="col" className="px-6 py-3 font-semibold tracking-wider text-right">Estoque / Mínimo</th>
              <th scope="col" className="px-6 py-3 font-semibold tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                    {row.sku}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {row.productName}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {row.color} - {row.size}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span
                      data-testid="sku-stock-ratio"
                      className="inline-flex items-center gap-1 font-medium"
                    >
                      <span className="text-foreground">{row.currentStock}</span>
                      <span className="text-muted-foreground mx-1">/</span>
                      <span className="text-muted-foreground">{row.minimumStock}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {row.status === StatusEstoque.ESTOQUE_CRITICO ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-danger/10 text-danger border border-danger/20">
                        Estoque Crítico
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success border border-success/20">
                        Normal
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  Nenhum SKU encontrado para a busca &quot;{searchTerm}&quot;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer / Pagination */}
      <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground bg-muted/20">
        <span>
          Mostrando <strong>{startIndex}</strong> a <strong>{endIndex}</strong> de <strong>{filteredData.length}</strong> resultados
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs">Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong></span>
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
  );
}
