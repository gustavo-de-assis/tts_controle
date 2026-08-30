import React from "react";
import { getFinancialReportData, getInventoryPerformanceData } from "../../actions/reports";
import { ReportsView } from "../../../app/components/reports-view";
import { TopHeader } from "../../../app/components/top-header";

export const metadata = {
  title: "Relatórios Gerenciais — StockApp Fashion",
  description: "Relatórios estratégicos de valoração de estoque, faturamento por meio de pagamento, curva ABC e liquidação de estoque parado.",
};

export default async function RelatoriosPage() {
  const [financialData, performanceData] = await Promise.all([
    getFinancialReportData(),
    getInventoryPerformanceData(),
  ]);

  return (
    <>
      <TopHeader />
      <main className="flex-1 p-4 md:p-8 pb-20 md:pb-6 overflow-y-auto bg-background">
        <div className="max-w-7xl mx-auto">
          <ReportsView
            initialFinancialData={financialData}
            initialPerformanceData={performanceData}
          />
        </div>
      </main>
    </>
  );
}
