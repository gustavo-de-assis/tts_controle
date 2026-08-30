"use client";

import React, { useState } from "react";
import {
  X,
  Receipt,
  User,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import type { SaleHistoryItem } from "../../src/actions/sale";
import { markSaleAsConcluded } from "../../src/actions/sale";

interface SaleDetailModalProps {
  sale: SaleHistoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated?: () => void;
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val);

const formatDate = (isoStr: string) => {
  const d = new Date(isoStr);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
};

export function SaleDetailModal({
  sale,
  isOpen,
  onClose,
  onStatusUpdated,
}: SaleDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !sale) return null;

  const handleMarkAsConcluded = async () => {
    setLoading(true);
    setError("");
    try {
      await markSaleAsConcluded(sale.id);
      if (onStatusUpdated) onStatusUpdated();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao dar baixa na venda."
      );
    } finally {
      setLoading(false);
    }
  };

  const isPending = sale.status === "PENDENTE";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm transition-all">
      <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent/10 text-accent rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground font-mono">
                  #{sale.id.slice(-8).toUpperCase()}
                </h2>
                {isPending ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Clock className="w-3 h-3" />
                    Pendente
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20">
                    <CheckCircle2 className="w-3 h-3" />
                    Concluída
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Realizada em {formatDate(sale.createdAt)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted/20 border border-border rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <span className="text-muted-foreground block">Cliente</span>
                <strong className="text-foreground text-sm font-medium">
                  {sale.customerName}
                </strong>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <span className="text-muted-foreground block">Pagamento</span>
                <strong className="text-foreground text-sm font-medium">
                  {sale.paymentMethod}
                </strong>
              </div>
            </div>
            {sale.dueDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <span className="text-muted-foreground block">
                    Vencimento
                  </span>
                  <strong className="text-amber-500 text-sm font-medium">
                    {new Date(sale.dueDate).toLocaleDateString("pt-BR")}
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Itens da Transação ({sale.items.length})
            </h3>
            <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
              <div className="grid grid-cols-[1fr_4rem_5rem_6rem] px-4 py-2.5 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <div>Produto / SKU</div>
                <div className="text-center">Qtd</div>
                <div className="text-right">Unitário</div>
                <div className="text-right">Subtotal</div>
              </div>
              {sale.items.map((item) => {
                const subtotal = item.quantity * item.unitValue;
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_4rem_5rem_6rem] items-center px-4 py-3 text-xs hover:bg-muted/10 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-foreground">
                        {item.productName}
                      </div>
                      <div className="text-muted-foreground font-mono text-[11px]">
                        {item.skuCode} · {item.color} · {item.size}
                      </div>
                    </div>
                    <div className="text-center font-medium text-foreground">
                      {item.quantity}
                    </div>
                    <div className="text-right font-mono text-muted-foreground">
                      {formatCurrency(item.unitValue)}
                    </div>
                    <div className="text-right font-mono font-semibold text-foreground">
                      {formatCurrency(subtotal)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Values breakdown */}
          <div className="border-t border-border pt-4 space-y-2 text-xs">
            {sale.discount > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Desconto</span>
                <span className="font-mono text-danger">
                  -{formatCurrency(sale.discount)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-border/50">
              <span className="text-foreground">Total da Venda</span>
              <span className="text-xl text-foreground font-mono">
                {formatCurrency(sale.totalAmount)}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-border bg-muted/20 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-xl text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Fechar
          </button>

          {isPending && (
            <button
              onClick={handleMarkAsConcluded}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-success text-white text-xs font-semibold rounded-xl hover:bg-success/90 transition-all shadow-lg shadow-success/25 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading ? "Processando..." : "Dar Baixa / Receber"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
