"use server";

import { prisma } from "../lib/prisma";
import { requireUser } from "../lib/auth-guard";

export async function getDashboardKpis() {
  await requireUser();
  // 1. Total em Estoque
  const skus = await prisma.sku.findMany({
    where: { active: true }
  });
  
  const totalStock = skus.reduce((acc: number, sku: { currentStock: number }) => acc + sku.currentStock, 0);

  // 2. Alertas de Reposição (RN-003)
  const alertsCount = skus.filter((sku: { currentStock: number; minimumStock: number }) => sku.currentStock <= sku.minimumStock).length;

  // 3. Faturamento Mensal (mock, since we haven't seeded sales yet)
  // TODO: Implementar agregação real de `Sale` com Prisma no futuro.
  const monthlyRevenue = 0; // "R$ 0,00" por enquanto, pois não criamos vendas no seed
  
  // 4. Margem Média (mock)
  // TODO: Calcular margem com base nos produtos.
  const averageMargin = 0; 

  return {
    totalStock,
    alertsCount,
    monthlyRevenue,
    averageMargin,
  };
}
