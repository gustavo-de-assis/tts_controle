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
    return availableSkus.filter(s => 
      s.sku.toLowerCase().includes(search.toLowerCase()) || 
      s.productName.toLowerCase().includes(search.toLowerCase())
    );
  }, [availableSkus, search]);

  const addToCart = (skuId: string) => {
    const sku = availableSkus.find(s => s.id === skuId);
    if (!sku) return;
    
    setCart(prev => {
      const currentQty = prev[skuId] || 0;
      // RN-002: Previne selecionar mais do que existe no frontend (tbm validado no backend)
      if (currentQty >= sku.currentStock) return prev; 
      
      return { ...prev, [skuId]: currentQty + 1 };
    });
  };

  const removeFromCart = (skuId: string) => {
    setCart(prev => {
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
      const sku = availableSkus.find(s => s.id === skuId)!;
      return { sku, qty };
    });
  }, [cart, availableSkus]);

  const isPending = paymentMethod === "FIADO";
  const totalValue = cartItems.reduce((acc, item) => acc + (item.qty * (item.sku.salePrice ?? 0)), 0) - discount;
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
      const itemsPayload = Object.entries(cart).map(([skuId, quantity]) => ({ skuId, quantity }));
      
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
      setError(err instanceof Error ? err.message : "Erro ao processar venda (Verifique o estoque).");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm transition-all duration-300">
      <div className="bg-card w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl border border-border flex overflow-hidden">
        
        {/* Esquerda: Catálogo / Seleção */}
        <div className="flex-1 flex flex-col border-r border-border bg-background/50">
          <div className="p-4 border-b border-border">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" /> Ponto de Venda
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar produto ou código SKU..."
                className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredSkus.map(sku => (
                <div key={sku.id} className="p-4 bg-card border border-border rounded-xl flex flex-col justify-between hover:border-primary/50 transition-colors">
                  <div>
                    <div className="text-xs font-semibold text-primary mb-1">{sku.sku}</div>
                    <div className="font-medium text-sm text-foreground line-clamp-1">{sku.productName}</div>
                    <div className="text-xs text-muted-foreground mt-1">{sku.color} • {sku.size}</div>
                    <div className="text-sm font-semibold text-foreground mt-2">R$ {(sku.salePrice ?? 0).toFixed(2)}</div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs font-medium px-2 py-1 bg-muted rounded-md text-foreground">
                      Estoque: {sku.currentStock}
                    </div>
                    <button 
                      onClick={() => addToCart(sku.id)}
                      disabled={sku.currentStock === 0}
                      className="p-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Direita: Carrinho & Checkout */}
        <div className="w-96 flex flex-col bg-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Resumo ({totalItems} itens)</h3>
            <button onClick={onClose} className="p-1.5 text-muted-foreground hover:bg-muted rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <ShoppingCart className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm">Carrinho vazio</p>
              </div>
            ) : (
              cartItems.map(({ sku, qty }) => (
                <div key={sku.id} className="flex justify-between items-center p-3 bg-muted/20 border border-border rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-foreground">{sku.sku}</div>
                    <div className="text-xs text-muted-foreground">{qty}x R$ {(sku.salePrice ?? 0).toFixed(2)}</div>
                  </div>
                  <div className="flex items-center gap-2 bg-background border border-border rounded-lg p-0.5">
                    <button onClick={() => removeFromCart(sku.id)} className="p-1 hover:bg-muted rounded text-foreground">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-semibold w-4 text-center text-foreground">{qty}</span>
                    <button onClick={() => addToCart(sku.id)} disabled={qty >= sku.currentStock} className="p-1 hover:bg-muted rounded text-foreground">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
            
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs font-medium mt-4">
                {error}
              </div>
            )}
          </div>

          <div className="p-5 border-t border-border space-y-4 bg-muted/10">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Pagamento</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="PIX">PIX</option>
                  <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                  <option value="CARTAO_DEBITO">Cartão de Débito</option>
                  <option value="DINHEIRO">Dinheiro</option>
                  <option value="FIADO">Fiado / A Prazo</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Cliente {isPending ? "(obrigatório)" : "(opcional)"}</label>
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nome do cliente"
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              {isPending && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Data de vencimento</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              )}
              
              <div className="flex justify-between items-end gap-4">
                <div className="flex-1">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Desconto (R$)</label>
                  <input type="number" min="0" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-medium">Total Estimado</span>
              <span className="text-2xl font-bold text-foreground">
                R$ {totalValue > 0 ? totalValue.toFixed(2) : "---"}
              </span>
            </div>

            <button onClick={handleSubmit} disabled={loading || cartItems.length === 0}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              <CreditCard className="w-4 h-4" />
              {loading ? "Processando Venda..." : "Confirmar Venda"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
