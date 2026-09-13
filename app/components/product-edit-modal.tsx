"use client";

import React, { useState } from "react";
import { Pencil, X } from "lucide-react";
import { updateProductWithSku } from "../../src/actions/product";
import type { SkuTableRow } from "./sku-table";

interface ProductEditModalProps {
  isOpen: boolean;
  sku: SkuTableRow | null;
  onClose: () => void;
}

export function ProductEditModal({ isOpen, sku, onClose }: ProductEditModalProps) {
  const [name, setName] = useState(sku?.productName ?? "");
  const [baseCostPrice, setBaseCostPrice] = useState(sku?.baseCostPrice ?? 0);
  const [baseSalePrice, setBaseSalePrice] = useState(sku?.baseSalePrice ?? sku?.salePrice ?? 0);
  const [skuCode, setSkuCode] = useState(sku?.sku ?? "");
  const [color, setColor] = useState(sku?.color ?? "");
  const [size, setSize] = useState(sku?.size ?? "");
  const [minimumStock, setMinimumStock] = useState(sku?.minimumStock ?? 0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !sku || !sku.productId) return null;
  const productId = sku.productId;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await updateProductWithSku({
        productId,
        skuId: sku.id,
        name,
        baseCostPrice,
        baseSalePrice,
        sku: skuCode,
        color,
        size,
        minimumStock,
      });
      onClose();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Erro ao atualizar produto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 pb-20 md:p-6 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#131b2e] p-6 shadow-2xl mb-16 md:mb-0 max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#131b2e] z-10 mb-6 flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground"><Pencil className="h-5 w-5 text-primary" /> Editar produto</h2>
          <button type="button" onClick={onClose} aria-label="Fechar edição" className="rounded-full p-1.5 text-muted-foreground hover:bg-slate-800 hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-foreground">Nome<input required value={name} onChange={event => setName(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal" /></label>
          <label className="text-sm font-medium text-foreground">Código SKU<input required value={skuCode} onChange={event => setSkuCode(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal" /></label>
          <label className="text-sm font-medium text-foreground">Cor<input required value={color} onChange={event => setColor(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal" /></label>
          <label className="text-sm font-medium text-foreground">Tamanho<input required value={size} onChange={event => setSize(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal" /></label>
          <label className="text-sm font-medium text-foreground">Custo base<input required type="number" min="0" step="0.01" value={baseCostPrice} onChange={event => setBaseCostPrice(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal" /></label>
          <label className="text-sm font-medium text-foreground">Preço de venda<input required type="number" min="0" step="0.01" value={baseSalePrice} onChange={event => setBaseSalePrice(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal" /></label>
          <label className="text-sm font-medium text-foreground">Estoque mínimo<input required type="number" min="0" step="1" value={minimumStock} onChange={event => setMinimumStock(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal" /></label>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-500">{error}</p>}
        <div className="sticky bottom-0 bg-[#131b2e] z-10 mt-6 flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">Cancelar</button>
          <button type="submit" disabled={loading} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{loading ? "Salvando..." : "Salvar alterações"}</button>
        </div>
      </form>
    </div>
  );
}