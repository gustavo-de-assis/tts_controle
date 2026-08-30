"use client";

import React, { useState } from "react";
import { Pencil, X } from "lucide-react";
import { updateProduct, ProductCatalogItem } from "../../src/actions/product";

interface ProductParentEditModalProps {
  isOpen: boolean;
  product: ProductCatalogItem | null;
  categories: { id: string; name: string }[];
  onClose: () => void;
}

export function ProductParentEditModal({
  isOpen,
  product,
  categories,
  onClose,
}: ProductParentEditModalProps) {
  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [baseCostPrice, setBaseCostPrice] = useState(product?.baseCostPrice ?? 0);
  const [baseSalePrice, setBaseSalePrice] = useState(product?.baseSalePrice ?? 0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !product) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await updateProduct({
        productId: product.id,
        name,
        categoryId: categoryId || undefined,
        baseCostPrice,
        baseSalePrice,
      });
      onClose();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Erro ao atualizar produto."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Pencil className="h-5 w-5 text-accent" /> Editar Produto
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar edição"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
          <label className="col-span-2 font-medium text-foreground">
            Nome do Produto
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2 font-normal text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Ex: Vestido Floral"
            />
          </label>

          <label className="col-span-2 font-medium text-foreground">
            Categoria
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2 font-normal text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
            >
              <option value="">Selecione uma categoria...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="font-medium text-foreground">
            Custo Base (R$)
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={baseCostPrice}
              onChange={(e) => setBaseCostPrice(Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2 font-normal text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>

          <label className="font-medium text-foreground">
            Preço de Venda Base (R$)
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={baseSalePrice}
              onChange={(e) => setBaseSalePrice(Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2 font-normal text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
        </div>

        {error && (
          <p className="rounded-xl bg-danger/10 p-3 text-xs font-semibold text-danger border border-danger/20">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-accent px-5 py-2 text-xs font-semibold text-white hover:bg-accent/90 disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
