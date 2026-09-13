"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../lib/prisma";
import { auth } from "../auth";

export interface CategoryItem {
  id: string;
  name: string;
}

async function requireAuthenticatedUser() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
}

function normalizeCategoryName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

async function findDuplicateCategory(name: string, excludedId?: string) {
  return prisma.category.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      ...(excludedId ? { id: { not: excludedId } } : {}),
    },
  });
}

export async function createCategory(name: string): Promise<CategoryItem> {
  await requireAuthenticatedUser();
  const normalizedName = normalizeCategoryName(name);

  if (!normalizedName) {
    throw new Error("O nome da categoria é obrigatório.");
  }

  const duplicate = await findDuplicateCategory(normalizedName);
  if (duplicate) {
    throw new Error("Já existe uma categoria com esse nome.");
  }

  const category = await prisma.category.create({
    data: { name: normalizedName },
    select: { id: true, name: true },
  });

  revalidatePath("/produtos");
  revalidatePath("/");
  return category;
}

export async function updateCategory(id: string, name: string): Promise<CategoryItem> {
  await requireAuthenticatedUser();
  const normalizedName = normalizeCategoryName(name);

  if (!id || !normalizedName) {
    throw new Error("ID e nome da categoria são obrigatórios.");
  }

  const duplicate = await findDuplicateCategory(normalizedName, id);
  if (duplicate) {
    throw new Error("Já existe uma categoria com esse nome.");
  }

  const category = await prisma.category.update({
    where: { id },
    data: { name: normalizedName },
    select: { id: true, name: true },
  });

  revalidatePath("/produtos");
  revalidatePath("/");
  return category;
}

export async function deleteCategory(id: string) {
  await requireAuthenticatedUser();
  if (!id) {
    throw new Error("ID da categoria é obrigatório.");
  }

  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });

  if (!category) {
    throw new Error("Categoria não encontrada.");
  }

  if (category._count.products > 0) {
    throw new Error("Não é possível excluir uma categoria que possui produtos.");
  }

  await prisma.category.update({
    where: { id },
    data: { active: false },
  });

  revalidatePath("/produtos");
  revalidatePath("/");
}
