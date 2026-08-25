"use client";

import React, { useState } from "react";
import { Search, Filter, ArrowUpDown, PackagePlus, Pencil } from "lucide-react";
import { StatusEstoque } from "../../src/domain/stock";
import { StockEntryModal } from "./stock-entry-modal";
import { ProductEditModal } from "./product-edit-modal";

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

export function SkuTable({ data }: { data: SkuTableRow[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [entrySku, setEntrySku] = useState<SkuTableRow | null>(null);
  const [editSku, setEditSku] = useState<SkuTableRow | null>(null);

  const filteredData = data.filter(
    (item) =>
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-md text-sm font-medium text-foreground bg-card hover:bg-muted transition-colors">
            <Filter className="h-4 w-4" />
            Filtros
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
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
              <th scope="col" className="px-6 py-3 font-semibold tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredData.length > 0 ? (
              filteredData.map((row) => (
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
                    <span className="font-medium text-foreground">{row.currentStock}</span>
                    <span className="text-muted-foreground mx-1">/</span>
                    <span className="text-muted-foreground">{row.minimumStock}</span>
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
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => setEntrySku(row)} title="Dar entrada" aria-label={`Dar entrada em ${row.sku}`} className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary">
                      <PackagePlus className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setEditSku(row)} title="Editar produto" aria-label={`Editar produto ${row.productName}`} className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                      <Pencil className="h-4 w-4" />
                    </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                  Nenhum SKU encontrado para a busca &quot;{searchTerm}&quot;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Table Footer / Pagination Mock */}
      <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground bg-muted/20">
        <span>Mostrando <strong>{filteredData.length}</strong> de <strong>{data.length}</strong> resultados</span>
        <div className="flex gap-1">
          <button className="px-3 py-1 border border-border rounded hover:bg-muted disabled:opacity-50" disabled>Anterior</button>
          <button className="px-3 py-1 border border-border rounded hover:bg-muted">Próximo</button>
        </div>
      </div>

      <StockEntryModal isOpen={entrySku !== null} sku={entrySku} onClose={() => setEntrySku(null)} />
      <ProductEditModal key={editSku?.id ?? "none"} isOpen={editSku !== null} sku={editSku} onClose={() => setEditSku(null)} />
    </div>
  );
}
