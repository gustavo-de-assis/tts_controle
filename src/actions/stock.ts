"use server";

import { prisma } from "../lib/prisma";
import { SkuTableRow } from "../../app/components/sku-table";
import { StatusEstoque } from "../domain/stock";
import { revalidatePath } from "next/cache";
import { fromCents, toCents } from "../domain/money";

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
      productId: sku.productId,
      sku: sku.sku,
      productName: sku.product.name,
      baseCostPrice: fromCents(sku.product.baseCostPrice),
      baseSalePrice: fromCents(sku.product.baseSalePrice),
      color: sku.color,
      size: sku.size,
      currentStock: sku.currentStock,
      minimumStock: sku.minimumStock,
      salePrice: fromCents(sku.salePriceOverride ?? sku.product.baseSalePrice),
      status,
    };
  });
}

export interface RegisterStockEntryInput {
  skuId: string;
  quantity: number;
  unitValue: number;
  observation?: string;
}

export async function registerStockEntry(data: RegisterStockEntryInput) {
  if (data.quantity <= 0 || data.unitValue <= 0) {
    throw new Error("Quantidade e custo unitário devem ser maiores que zero.");
  }

  await prisma.$transaction(async (tx) => {
    const sku = await tx.sku.findUnique({ where: { id: data.skuId } });

    if (!sku) {
      throw new Error("SKU não encontrado.");
    }

    if (!sku.active) {
      throw new Error("Não é possível dar entrada em um SKU inativo.");
    }

    await tx.sku.update({
      where: { id: sku.id },
      data: { currentStock: sku.currentStock + data.quantity },
    });

    await tx.stockMovement.create({
      data: {
        skuId: sku.id,
        type: "ENTRADA",
        quantity: data.quantity,
        unitValue: toCents(data.unitValue),
        observation: data.observation ?? "Entrada manual de estoque",
      },
    });
  });

  revalidatePath("/");
}
