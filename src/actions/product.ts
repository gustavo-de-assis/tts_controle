"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { revalidatePath } from "next/cache";
import { toCents, fromCents } from "../domain/money";
import { StatusEstoque } from "../domain/stock";
import { requireUser } from "../lib/auth-guard";

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
  await requireUser();
  if (!data.name || !data.categoryId || data.skus.length === 0) {
    throw new Error("Dados inválidos: Nome, Categoria e ao menos um SKU são obrigatórios.");
  }

  // Utiliza $transaction para garantir que Produto e SKUs sejam inseridos atomicamente
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

// ---------------------------------------------------------------------------
// Listagem de Produtos com SKUs — Catálogo
// ---------------------------------------------------------------------------

export interface ProductCatalogItem {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  baseCostPrice: number; // em reais
  baseSalePrice: number; // em reais
  totalStock: number;
  skus: Array<{
    id: string;
    sku: string;
    color: string;
    size: string;
    currentStock: number;
    minimumStock: number;
    status: StatusEstoque;
  }>;
}

export async function getProductsWithSkus(
  filters?: { search?: string; categoryId?: string }
): Promise<ProductCatalogItem[]> {
  await requireUser();

  const where: Record<string, unknown> = {};
  if (filters?.search) {
    where.name = { contains: filters.search, mode: "insensitive" };
  }
  if (filters?.categoryId) {
    where.categoryId = filters.categoryId;
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      skus: { where: { active: true } },
    },
    orderBy: { name: "asc" },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    categoryId: p.categoryId,
    categoryName: p.category.name,
    baseCostPrice: fromCents(p.baseCostPrice),
    baseSalePrice: fromCents(p.baseSalePrice),
    totalStock: p.skus.reduce((sum, s) => sum + s.currentStock, 0),
    skus: p.skus.map((s) => ({
      id: s.id,
      sku: s.sku,
      color: s.color,
      size: s.size,
      currentStock: s.currentStock,
      minimumStock: s.minimumStock,
      status:
        s.currentStock <= s.minimumStock
          ? StatusEstoque.ESTOQUE_CRITICO
          : StatusEstoque.NORMAL,
    })),
  }));
}

export interface UpdateProductInput {
  productId: string;
  name: string;
  categoryId?: string;
  baseCostPrice: number;
  baseSalePrice: number;
}

export async function updateProduct(data: UpdateProductInput) {
  await requireUser();
  if (!data.productId || !data.name.trim()) {
    throw new Error("ID do produto e nome são obrigatórios.");
  }

  const updateData: Record<string, unknown> = {
    name: data.name.trim(),
    baseCostPrice: toCents(data.baseCostPrice),
    baseSalePrice: toCents(data.baseSalePrice),
  };

  if (data.categoryId) {
    updateData.categoryId = data.categoryId;
  }

  const product = await prisma.product.update({
    where: { id: data.productId },
    data: updateData,
  });

  revalidatePath("/");
  revalidatePath("/produtos");
  return product;
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
  await requireUser();
  if (!data.productId || !data.skuId || !data.name.trim() || !data.sku.trim()) {
    throw new Error("Produto, SKU e nome são obrigatórios.");
  }

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
