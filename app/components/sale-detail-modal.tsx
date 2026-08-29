"use client";

import React, { useState } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { markSaleAsConcluded } from "../../src/actions/sale";
import type { SaleHistoryItem } from "../../src/actions/sale";

interface SaleDetailModalProps {
  sale: SaleHistoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaleConcluded?: () => void;
}

export function SaleDetailModal({
  sale,
  isOpen,
  onClose,
  onSaleConcluded,
}: SaleDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !sale) return null;

  const isPending = sale.status === "PENDENTE";
  const subtotal = sale.totalAmount + sale.discount;

  const handleMarkAsConcluded = async () => {
    try {
      setLoading(true);
      setError("");
      await markSaleAsConcluded(sale.id);
      onSaleConcluded?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar venda");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Detalhes da Venda</h2>
            <p className="text-sm text-muted-foreground">ID: {sale.id}</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 hover:bg-muted rounded-md transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-md text-sm text-danger">
              {error}
            </div>
          )}

          {/* Summary Section */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                Data
              </p>
              <p className="text-sm font-medium text-foreground">
                {new Date(sale.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                Cliente
              </p>
              <p className="text-sm font-medium text-foreground">
                {sale.customerName}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                Forma de Pagamento
              </p>
              <p className="text-sm font-medium text-foreground">
                {sale.paymentMethod}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                Status
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                    sale.status === "CONCLUIDA"
                      ? "bg-success/10 text-success border border-success/20"
                      : "bg-yellow-500/10 text-yellow-700 border border-yellow-500/20"
                  }`}
                >
                  {sale.status === "CONCLUIDA" ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Concluída
                    </>
                  ) : (
                    "Pendente"
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Produto
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Variação
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                    Qtd
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                    Valor Unit.
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sale.items.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {item.skuCode}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {item.productName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {item.color} / {item.size}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-foreground">
                      R$ {item.unitValue.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      R$ {(item.quantity * item.unitValue).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Desconto</span>
              <span className="text-danger">
                -R$ {sale.discount.toFixed(2)}
              </span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between text-base font-semibold">
              <span className="text-foreground">Total</span>
              <span className="text-accent">R$ {sale.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {sale.dueDate && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800 font-semibold">
                Data de Vencimento
              </p>
              <p className="text-sm text-yellow-900">
                {new Date(sale.dueDate).toLocaleDateString("pt-BR")}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-card border-t border-border p-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-md transition-colors disabled:opacity-50"
          >
            Fechar
          </button>
          {isPending && (
            <button
              onClick={handleMarkAsConcluded}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-success hover:bg-success/90 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Dar Baixa
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
