"use server";

import { prisma } from "../lib/prisma";
import { SkuTableRow } from "../../app/components/sku-table";
import { StatusEstoque } from "../domain/stock";

export async function getSkus(): Promise<SkuTableRow[]> {
  const skus = await prisma.sku.findMany({
    where: { active: true },
    include: {
      product: true,
    },
    orderBy: {
      sku: "asc",
    },
  });

  return skus.map((sku) => {
    // Aplicação da RN-003 no backend
    const status = sku.currentStock <= sku.minimumStock 
      ? StatusEstoque.ESTOQUE_CRITICO 
      : StatusEstoque.NORMAL;

    return {
      id: sku.id,
      sku: sku.sku,
      productName: sku.product.name,
      color: sku.color,
      size: sku.size,
      currentStock: sku.currentStock,
      minimumStock: sku.minimumStock,
      status,
    };
  });
}
