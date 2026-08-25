"use server";

import { prisma } from "../lib/prisma";
import { revalidatePath } from "next/cache";
import { toCents } from "../domain/money";

export interface CreateProductInput {
  name: string;
  categoryId: string;
  baseCostPrice: number;
  baseSalePrice: number;
  skus: Array<{
    sku: string;
    color: string;
    size: string;
    currentStock: number;
    minimumStock: number;
  }>;
}

export async function createProductWithSkus(data: CreateProductInput) {
  if (!data.name || !data.categoryId || data.skus.length === 0) {
    throw new Error("Dados inválidos: Nome, Categoria e ao menos um SKU são obrigatórios.");
  }

  // Utiliza $transaction para garantir que Produto e SKUs sejam inseridos atomicamente
  const result = await prisma.$transaction(async (tx) => {
    // 1. Criar o Produto Pai
    const product = await tx.product.create({
      data: {
        name: data.name,
        categoryId: data.categoryId,
        baseCostPrice: toCents(data.baseCostPrice),
        baseSalePrice: toCents(data.baseSalePrice),
      },
    });

    const createdSkus = [];

    // 2. Criar os SKUs
    for (const skuData of data.skus) {
      const sku = await tx.sku.create({
        data: {
          productId: product.id,
          sku: skuData.sku,
          color: skuData.color,
          size: skuData.size,
          currentStock: skuData.currentStock,
          minimumStock: skuData.minimumStock,
        },
      });
      createdSkus.push(sku);

      // 3. Se houver estoque inicial, registrar a movimentação de ENTRADA
      if (sku.currentStock > 0) {
        await tx.stockMovement.create({
          data: {
            skuId: sku.id,
            type: "ENTRADA",
            quantity: sku.currentStock,
            unitValue: toCents(data.baseCostPrice),
            observation: "Estoque Inicial via Cadastro de Produto",
          },
        });
      }
    }

    return { product, skus: createdSkus };
  });

  revalidatePath("/");
  return result;
}

export interface UpdateProductWithSkuInput {
  productId: string;
  skuId: string;
  name: string;
  baseCostPrice: number;
  baseSalePrice: number;
  sku: string;
  color: string;
  size: string;
  minimumStock: number;
}

export async function updateProductWithSku(data: UpdateProductWithSkuInput) {
  if (!data.productId || !data.skuId || !data.name.trim() || !data.sku.trim()) {
    throw new Error("Produto, SKU e nome são obrigatórios.");
  }

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.update({
      where: { id: data.productId },
      data: {
        name: data.name.trim(),
        baseCostPrice: toCents(data.baseCostPrice),
        baseSalePrice: toCents(data.baseSalePrice),
      },
    });

    const sku = await tx.sku.update({
      where: { id: data.skuId },
      data: {
        sku: data.sku.trim(),
        color: data.color.trim(),
        size: data.size.trim(),
        minimumStock: data.minimumStock,
      },
    });

    revalidatePath("/");
    return { product, sku };
  });
}
