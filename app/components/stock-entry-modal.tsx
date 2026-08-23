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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <PackagePlus className="h-5 w-5 text-primary" /> Dar Entrada
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{sku.productName} · {sku.sku}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted">
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

        <button type="submit" disabled={loading} className="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {loading ? "Registrando..." : "Confirmar entrada"}
        </button>
      </form>
    </div>
  );
}
