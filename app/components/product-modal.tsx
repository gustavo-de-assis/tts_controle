"use client";

import React, { useState } from "react";
import { X, Plus, Trash2, Tag, Layers, DollarSign } from "lucide-react";
import { createProductWithSkus, CreateProductInput } from "../../src/actions/product";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: { id: string; name: string }[];
}

export function ProductModal({ isOpen, onClose, categories }: ProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
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
    } catch (err: any) {
      setError(err.message || "Erro ao salvar o produto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-20 md:p-6 bg-black/60 backdrop-blur-sm transition-all duration-300">
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
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Categoria</label>
                  <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
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
