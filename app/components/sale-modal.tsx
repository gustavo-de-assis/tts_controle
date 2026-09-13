"use client";

import React, { useState, useMemo } from "react";
import { X, ShoppingCart, Plus, Minus, CreditCard, Search } from "lucide-react";
import { registerSale } from "../../src/actions/sale";
import type { SkuTableRow } from "./sku-table";

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableSkus: SkuTableRow[];
}

export function SaleModal({ isOpen, onClose, availableSkus }: SaleModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [discount, setDiscount] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Carrinho local { skuId: quantity }
  const [cart, setCart] = useState<Record<string, number>>({});

  // Filtra SKUs baseados na busca
  const filteredSkus = useMemo(() => {
    return availableSkus.filter(
      (s) =>
        s.sku.toLowerCase().includes(search.toLowerCase()) ||
        s.productName.toLowerCase().includes(search.toLowerCase())
    );
  }, [availableSkus, search]);

  const addToCart = (skuId: string) => {
    const sku = availableSkus.find((s) => s.id === skuId);
    if (!sku) return;

    setCart((prev) => {
      const currentQty = prev[skuId] || 0;
      // RN-002: Previne selecionar mais do que existe no frontend (tbm validado no backend)
      if (currentQty >= sku.currentStock) return prev;

      return { ...prev, [skuId]: currentQty + 1 };
    });
  };

  const removeFromCart = (skuId: string) => {
    setCart((prev) => {
      const currentQty = prev[skuId] || 0;
      if (currentQty <= 1) {
        const newCart = { ...prev };
        delete newCart[skuId];
        return newCart;
      }
      return { ...prev, [skuId]: currentQty - 1 };
    });
  };

  const cartItems = useMemo(() => {
    return Object.entries(cart).map(([skuId, qty]) => {
      const sku = availableSkus.find((s) => s.id === skuId)!;
      return { sku, qty };
    });
  }, [cart, availableSkus]);

  const isPending = paymentMethod === "FIADO";
  const totalValue =
    cartItems.reduce(
      (acc, item) => acc + item.qty * (item.sku.salePrice ?? 0),
      0
    ) - discount;
  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalItems === 0) {
      setError("Adicione ao menos um item no carrinho.");
      return;
    }
    if (isPending && !customerName.trim()) {
      setError("Informe o nome do cliente para vendas fiadas.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const itemsPayload = Object.entries(cart).map(([skuId, quantity]) => ({
        skuId,
        quantity,
      }));

      await registerSale({
        paymentMethod,
        discount,
        status: isPending ? "PENDENTE" : "CONCLUIDA",
        customerName: customerName.trim() || undefined,
        dueDate: isPending ? dueDate || undefined : undefined,
        items: itemsPayload,
      });

      onClose();
      // Reset
      setCart({});
      setSearch("");
      setDiscount(0);
      setCustomerName("");
      setDueDate("");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao processar venda (Verifique o estoque)."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-20 md:p-6 bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-[#131b2e] text-foreground w-full max-w-lg md:max-w-4xl max-h-[85vh] md:h-[85vh] mb-16 md:mb-0 rounded-2xl shadow-2xl border border-slate-800 flex flex-col md:grid md:grid-cols-12 overflow-y-auto md:overflow-hidden relative">
        {/* Sticky Header unificado */}
        <div className="sticky top-0 bg-[#131b2e] z-10 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between md:col-span-12">
          <h2 className="text-lg md:text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" /> Ponto de Venda
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Esquerda: Catálogo / Seleção */}
        <div className="w-full md:col-span-7 flex flex-col border-b md:border-b-0 md:border-r border-slate-800 bg-[#131b2e]/60 md:overflow-y-auto">
          {/* Busca */}
          <div className="p-3 sm:p-4 border-b border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar produto ou código SKU..."
                className="w-full pl-9 pr-3 py-2 bg-[#1a233a] border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          {/* Grid de Cards de Produtos */}
          <div className="p-3 sm:p-4">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {filteredSkus.length === 0 ? (
                <div className="col-span-2 py-8 text-center text-xs text-slate-400">
                  Nenhum produto encontrado.
                </div>
              ) : (
                filteredSkus.map((sku) => (
                  <div
                    key={sku.id}
                    className="p-3 bg-[#1a233a] border border-slate-800 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-all shadow-xs"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-100 uppercase tracking-wide line-clamp-2 leading-tight">
                        {sku.productName}
                      </div>
                      <div className="text-[11px] text-slate-400 uppercase font-medium mt-1">
                        {sku.color} • {sku.size}
                      </div>
                      <div className="text-sm font-bold text-slate-100 mt-2 font-mono">
                        R$ {(sku.salePrice ?? 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-1">
                      <div className="text-[11px] font-medium px-2 py-1 bg-slate-800/80 rounded-md text-slate-300">
                        Estoque: {sku.currentStock}
                      </div>
                      <button
                        type="button"
                        onClick={() => addToCart(sku.id)}
                        disabled={
                          sku.currentStock === 0 ||
                          (cart[sku.id] || 0) >= sku.currentStock
                        }
                        className="p-1.5 px-2 bg-slate-800/80 text-slate-300 hover:text-primary hover:bg-slate-700/80 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Direita: Carrinho & Checkout (Resumo da Venda) */}
        <div className="w-full md:col-span-5 flex flex-col bg-[#131b2e] md:overflow-y-auto">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-100">
              Resumo da Venda {totalItems > 0 && `(${totalItems})`}
            </h3>
          </div>

          <div className="p-4 space-y-2.5">
            {cartItems.length === 0 ? (
              <div className="py-4 flex flex-col items-center justify-center text-slate-400 gap-1.5">
                <ShoppingCart className="w-8 h-8 opacity-25" />
                <p className="text-xs font-medium">Carrinho vazio</p>
              </div>
            ) : (
              cartItems.map(({ sku, qty }) => (
                <div
                  key={sku.id}
                  className="flex justify-between items-center p-2.5 bg-[#1a233a] border border-slate-800 rounded-lg"
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <div className="text-xs font-semibold text-slate-100 truncate">
                      {sku.sku}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {qty}x R$ {(sku.salePrice ?? 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 rounded-lg p-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => removeFromCart(sku.id)}
                      className="p-1 hover:bg-slate-700 rounded text-slate-200"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center text-slate-100">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => addToCart(sku.id)}
                      disabled={qty >= sku.currentStock}
                      className="p-1 hover:bg-slate-700 rounded text-slate-200 disabled:opacity-40"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}

            {error && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-medium">
                {error}
              </div>
            )}
          </div>

          {/* Formulário de Finalização */}
          <div className="p-4 pt-0 space-y-3.5">
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">
                Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#1a233a] border border-slate-700/80 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="PIX">PIX</option>
                <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                <option value="CARTAO_DEBITO">Cartão de Débito</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="FIADO">Fiado / A Prazo</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">
                Cliente {isPending ? "(obrigatório)" : "(opcional)"}
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nome do cliente"
                className="w-full px-3 py-2 text-sm bg-[#1a233a] border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {isPending && (
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1 block">
                  Data de vencimento
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#1a233a] border border-slate-700/80 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            {/* Desconto & Total Estimado lado a lado como na imagem */}
            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="w-28 sm:w-32">
                <label className="text-xs font-medium text-slate-400 mb-1 block">
                  Desconto (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm bg-[#1a233a] border border-slate-700/80 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col items-end justify-center">
                <span className="text-xs text-slate-400">Total Estimado</span>
                <div className="text-2xl font-black text-slate-100 font-mono tracking-tight">
                  {totalValue > 0 ? `R$ ${totalValue.toFixed(2)}` : "R$ ---"}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || cartItems.length === 0}
                className="w-full py-3.5 bg-[#2d3a54] hover:bg-[#394a6d] text-slate-100 text-sm font-semibold rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-md active:scale-[0.99]"
              >
                <CreditCard className="w-4 h-4" />
                {loading ? "Processando Venda..." : "Confirmar Venda"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
