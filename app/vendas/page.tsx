import { getSalesHistory } from "../../src/actions/sale";
import { SalesHistoryTable } from "../components/sales-history-table";

export default async function VendasPage() {
  const salesHistory = await getSalesHistory();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Histórico de Vendas</h1>
        <p className="text-muted-foreground mt-1">
          Consulte e gerencie todas as vendas realizadas
        </p>
      </div>

      <SalesHistoryTable data={salesHistory} />
    </div>
  );
}
