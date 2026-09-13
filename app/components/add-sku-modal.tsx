"use client";

import React, { useState } from "react";
import { PlusCircle, X } from "lucide-react";
import { addSkuToProduct, ProductCatalogItem } from "../../src/actions/product";

interface AddSkuModalProps {
  isOpen: boolean;
  product: ProductCatalogItem | null;
  onClose: () => void;
}

export function AddSkuModal({
  isOpen,
  product,
  onClose,
}: AddSkuModalProps) {
  const [sku, setSku] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [currentStock, setCurrentStock] = useState(0);
  const [minimumStock, setMinimumStock] = useState(2);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !product) return null;

  const resetForm = () => {
    setSku("");
    setColor("");
    setSize("");
    setCurrentStock(0);
    setMinimumStock(2);
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await addSkuToProduct({
        productId: product.id,
        sku: sku.trim(),
        color: color.trim(),
        size: size.trim(),
        currentStock,
        minimumStock,
      });
      handleClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao adicionar SKU."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 pb-20 md:p-6 backdrop-blur-sm animate-in fade-in duration-200">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#131b2e] p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 mb-16 md:mb-0 max-h-[85vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-[#131b2e] z-10 flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <PlusCircle className="h-5 w-5 text-accent" /> Novo SKU para o Produto
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">
              {product.name} ({product.categoryName})
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fechar cadastro de SKU"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
          <label className="col-span-2 font-medium text-foreground">
            Código SKU
            <input
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2 font-mono text-sm text-foreground uppercase placeholder:normal-case placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Ex: CAM-PRETA-G"
            />
          </label>

          <label className="font-medium text-foreground">
            Cor
            <input
              required
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2 font-normal text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Ex: Preta"
            />
          </label>

          <label className="font-medium text-foreground">
            Tamanho
            <input
              required
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2 font-normal text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Ex: G"
            />
          </label>

          <label className="font-medium text-foreground">
            Estoque Inicial (Qtde)
            <input
              required
              type="number"
              min="0"
              value={currentStock}
              onChange={(e) => setCurrentStock(Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2 font-normal text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>

          <label className="font-medium text-foreground">
            Estoque Mínimo
            <input
              required
              type="number"
              min="1"
              value={minimumStock}
              onChange={(e) => setMinimumStock(Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2 font-normal text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
        </div>

        {error && (
          <p className="rounded-xl bg-danger/10 p-3 text-xs font-semibold text-danger border border-danger/20">
            {error}
          </p>
        )}

        <div className="sticky bottom-0 bg-[#131b2e] z-10 flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-accent px-5 py-2 text-xs font-semibold text-white hover:bg-accent/90 disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? "Adicionando..." : "Adicionar SKU"}
          </button>
        </div>
      </form>
    </div>
  );
}
