import React from "react";
import { Package } from "lucide-react";
import { getProductsWithSkus } from "../../src/actions/product";
import { prisma } from "../../src/lib/prisma";
import { ProductCatalogTable } from "../components/product-catalog-table";

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
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="bg-card border-b border-border h-16 flex items-center px-8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg text-accent">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">
              Produtos & Catálogo
            </h1>
            <p className="text-xs text-muted-foreground">
              {products.length} produto{products.length !== 1 ? "s" : ""}{" "}
              cadastrado{products.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </header>

      {/* ── Main Content ────────────────────────────────────────── */}
      <main className="flex-1 p-8 overflow-y-auto bg-background">
        <div className="max-w-7xl mx-auto">
          <ProductCatalogTable products={products} categories={categories} />
        </div>
      </main>
    </>
  );
}
