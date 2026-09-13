import React from "react";
import { getSalesHistory } from "../../src/actions/sale";
import { getSkus } from "../../src/actions/stock";
import { SalesHistoryTable } from "../components/sales-history-table";
import { TopHeader } from "../components/top-header";

export const metadata = {
  title: "Histórico de Vendas — StockApp",
  description: "Acompanhe e gerencie as vendas e pedidos realizados.",
};

export default async function VendasPage() {
  const [sales, skus] = await Promise.all([
    getSalesHistory(),
    getSkus(),
  ]);

  return (
    <>
      <TopHeader />

      {/* ── Main Content ────────────────────────────────────────── */}
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-6 overflow-y-auto bg-background">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Histórico de Vendas
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Acompanhe o registro de vendas, pagamentos pendentes e detalhes de transações.
              </p>
            </div>
          </div>

          <SalesHistoryTable sales={sales} availableSkus={skus} />
        </div>
      </main>
    </>
  );
}
