import React from "react";
import { Package } from "lucide-react";
import { getProductsWithSkus } from "../../src/actions/product";
import { prisma } from "../../src/lib/prisma";
import { ProductCatalogTable } from "../components/product-catalog-table";
import { TopHeader } from "../components/top-header";

export const metadata = {
  title: "Produtos & Catálogo — StockApp",
  description: "Gerencie seus produtos, categorias e variações de SKU.",
};

export default async function ProdutosPage() {
  const [products, categories] = await Promise.all([
    getProductsWithSkus(),
    prisma.category.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
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
                Produtos & Catálogo
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Gerencie seus produtos, categorias e variações de SKU ({products.length} produtos cadastrados).
              </p>
            </div>
          </div>

          <ProductCatalogTable products={products} categories={categories} />
        </div>
      </main>
    </>
  );
}
