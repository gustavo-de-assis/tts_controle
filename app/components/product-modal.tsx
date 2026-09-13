"use client";

import React, { useState } from "react";
import { X, Plus, Trash2, Tag, Layers, DollarSign, ChevronDown, Check } from "lucide-react";
import { createProductWithSkus, CreateProductInput } from "../../src/actions/product";
import { createCategory } from "../../src/actions/category";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: { id: string; name: string }[];
  onCategoriesChange?: (categories: { id: string; name: string }[]) => void;
}

export function ProductModal({ isOpen, onClose, categories, onCategoriesChange }: ProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [localCategories, setLocalCategories] = useState(categories);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categoryToast, setCategoryToast] = useState("");
  const [baseCostPrice, setBaseCostPrice] = useState<number>(0);
  const [baseSalePrice, setBaseSalePrice] = useState<number>(0);
  
  const [skus, setSkus] = useState<CreateProductInput["skus"]>([
    { sku: "", color: "", size: "", currentStock: 0, minimumStock: 0 }
  ]);

  if (!isOpen) return null;

  const handleAddSku = () => {
    setSkus([...skus, { sku: "", color: "", size: "", currentStock: 0, minimumStock: 0 }]);
  };

  const handleRemoveSku = (index: number) => {
    setSkus(skus.filter((_, i) => i !== index));
  };

  const handleSkuChange = (index: number, field: keyof CreateProductInput["skus"][0], value: string | number) => {
    const newSkus = [...skus];
    newSkus[index] = { ...newSkus[index], [field]: value };
    setSkus(newSkus);
  };

  const selectedCategory = localCategories.find((category) => category.id === categoryId);
  const matchingCategories = localCategories.filter((category) =>
    category.name.toLowerCase().includes(categoryQuery.trim().toLowerCase()),
  );
  const canCreateCategory = categoryQuery.trim().length > 0 && !localCategories.some(
    (category) => category.name.trim().toLowerCase() === categoryQuery.trim().toLowerCase(),
  );

  const handleCreateCategory = async () => {
    const nameToCreate = categoryQuery.trim();
    if (!nameToCreate) return;

    try {
      const category = await createCategory(nameToCreate);
      const nextCategories = [...localCategories, category].sort((a, b) => a.name.localeCompare(b.name));
      setLocalCategories(nextCategories);
      onCategoriesChange?.(nextCategories);
      setCategoryId(category.id);
      setCategoryQuery("");
      setIsCategoryOpen(false);
      setCategoryToast(`Categoria "${category.name}" criada.`);
      window.setTimeout(() => setCategoryToast(""), 3000);
    } catch (categoryError) {
      setError(categoryError instanceof Error ? categoryError.message : "Erro ao criar categoria.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await createProductWithSkus({
        name,
        categoryId,
        baseCostPrice,
        baseSalePrice,
        skus,
      });
      onClose();
      // Reset form
      setName("");
      setBaseCostPrice(0);
      setBaseSalePrice(0);
      setSkus([{ sku: "", color: "", size: "", currentStock: 0, minimumStock: 0 }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar o produto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-5 md:p-6 bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-[#131b2e] text-foreground w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[85vh] mb-16 md:mb-0">
        
        {/* Sticky Header */}
        <div className="sticky top-0 bg-[#131b2e] z-10 flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Tag className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Novo Produto</h2>
          </div>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-slate-800/80 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">
              {error}
            </div>
          )}
          {categoryToast && (
            <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400" role="status">
              {categoryToast}
            </div>
          )}

          <form id="product-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Seção Produto */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-muted-foreground" /> Informações Básicas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Nome do Produto</label>
                  <input required type="text" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Ex: Camiseta Básica" />
                </div>
                
                <div className="relative space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Categoria</label>
                  <button
                    type="button"
                    onClick={() => setIsCategoryOpen((open) => !open)}
                    className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-left focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-expanded={isCategoryOpen}
                    data-testid="category-combobox"
                  >
                    <span className={selectedCategory ? "text-foreground" : "text-muted-foreground"}>
                      {selectedCategory?.name || "Selecione uma categoria"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <input required tabIndex={-1} value={categoryId} onChange={() => undefined} className="sr-only" aria-label="Categoria obrigatória" />
                  {isCategoryOpen && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-border bg-[#131b2e] shadow-xl">
                      <input
                        autoFocus
                        value={categoryQuery}
                        onChange={(event) => setCategoryQuery(event.target.value)}
                        placeholder="Buscar categoria..."
                        className="w-full border-b border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
                        data-testid="category-combobox-input"
                      />
                      <div className="max-h-44 overflow-y-auto p-1">
                        {canCreateCategory && (
                          <button type="button" onClick={handleCreateCategory} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-primary hover:bg-primary/10">
                            <Plus className="h-4 w-4" /> Cadastrar &quot;{categoryQuery.trim()}&quot;
                          </button>
                        )}
                        {matchingCategories.map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => { setCategoryId(category.id); setCategoryQuery(""); setIsCategoryOpen(false); }}
                            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                          >
                            {category.name}
                            {category.id === categoryId && <Check className="h-4 w-4 text-primary" />}
                          </button>
                        ))}
                        {!canCreateCategory && matchingCategories.length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">Nenhuma categoria encontrada.</p>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Custo Base (R$)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <input required type="number" step="0.01" value={baseCostPrice} onChange={(e) => setBaseCostPrice(parseFloat(e.target.value))}
                      className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Preço Venda Base (R$)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <input required type="number" step="0.01" value={baseSalePrice} onChange={(e) => setBaseSalePrice(parseFloat(e.target.value))}
                      className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" />
                  </div>
                </div>
              </div>
            </section>

            {/* Seção SKUs */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-muted-foreground" /> Variações (SKUs)
                </h3>
                <button type="button" onClick={handleAddSku}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-lg hover:bg-primary/20 transition-colors">
                  <Plus className="w-4 h-4" /> Adicionar SKU
                </button>
              </div>

              <div className="space-y-3">
                {skus.map((sku, index) => (
                  <div key={index} className="flex flex-wrap md:flex-nowrap items-end gap-3 p-4 bg-muted/20 border border-border rounded-xl">
                    <div className="flex-1 min-w-[120px] space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Código SKU</label>
                      <input required type="text" value={sku.sku} onChange={(e) => handleSkuChange(index, 'sku', e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Ex: CAM-BR-M" />
                    </div>
                    <div className="w-24 space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Cor</label>
                      <input required type="text" value={sku.color} onChange={(e) => handleSkuChange(index, 'color', e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Branco" />
                    </div>
                    <div className="w-20 space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Tamanho</label>
                      <input required type="text" value={sku.size} onChange={(e) => handleSkuChange(index, 'size', e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="M" />
                    </div>
                    <div className="w-24 space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Estoque Ini.</label>
                      <input required type="number" min="0" value={sku.currentStock} onChange={(e) => handleSkuChange(index, 'currentStock', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="w-24 space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Estq. Min.</label>
                      <input required type="number" min="0" value={sku.minimumStock} onChange={(e) => handleSkuChange(index, 'minimumStock', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    
                    {skus.length > 1 && (
                      <button type="button" onClick={() => handleRemoveSku(index)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors mb-0.5">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
            
          </form>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-[#131b2e] z-10 p-4 sm:p-6 border-t border-slate-800 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-foreground bg-slate-800/80 border border-slate-700 hover:bg-slate-700 rounded-xl transition-all disabled:opacity-50">
            Cancelar
          </button>
          <button type="submit" form="product-form" disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50 flex items-center gap-2">
            {loading ? "Salvando..." : "Cadastrar Produto"}
          </button>
        </div>
      </div>
    </div>
  );
}
