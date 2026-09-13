"use client";

import React, { useState } from "react";
import { X, PackagePlus } from "lucide-react";
import { registerStockEntry } from "../../src/actions/stock";
import type { SkuTableRow } from "./sku-table";

interface StockEntryModalProps {
  isOpen: boolean;
  sku: SkuTableRow | null;
  onClose: () => void;
}

export function StockEntryModal({ isOpen, sku, onClose }: StockEntryModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [unitValue, setUnitValue] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !sku) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await registerStockEntry({ skuId: sku.id, quantity, unitValue });
      setQuantity(1);
      setUnitValue(0);
      onClose();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Erro ao registrar entrada.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 pb-20 md:p-6 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#131b2e] p-6 shadow-2xl mb-16 md:mb-0 max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#131b2e] z-10 mb-6 flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <PackagePlus className="h-5 w-5 text-primary" /> Dar Entrada
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{sku.productName} · {sku.sku}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-slate-800 hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="stock-entry-quantity" className="mb-1 block text-sm font-medium text-foreground">Quantidade</label>
            <input id="stock-entry-quantity" type="number" min="1" step="1" value={quantity} onChange={event => setQuantity(Number(event.target.value))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label htmlFor="stock-entry-unit-value" className="mb-1 block text-sm font-medium text-foreground">Custo unitário (R$)</label>
            <input id="stock-entry-unit-value" type="number" min="0.01" step="0.01" value={unitValue} onChange={event => setUnitValue(Number(event.target.value))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500">{error}</p>}
        </div>

        <div className="sticky bottom-0 bg-[#131b2e] z-10 mt-6 pt-3 border-t border-slate-800">
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md">
            {loading ? "Registrando..." : "Confirmar entrada"}
          </button>
        </div>
      </form>
    </div>
  );
}
