"use client";

import React, { useState } from "react";
import { Plus, ShoppingCart } from "lucide-react";
import { ProductModal } from "./product-modal";
import { SaleModal } from "./sale-modal";
import type { SkuTableRow } from "./sku-table";

interface DashboardActionsProps {
  categories: { id: string; name: string }[];
  skus: SkuTableRow[];
}

export function DashboardActions({ categories, skus }: DashboardActionsProps) {
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setIsProductModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-xl hover:bg-secondary/80 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Novo Produto
        </button>
        
        <button 
          onClick={() => setIsSaleModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
          <ShoppingCart className="w-4 h-4" /> Nova Venda
        </button>
      </div>

      <ProductModal 
        isOpen={isProductModalOpen} 
        onClose={() => setIsProductModalOpen(false)} 
        categories={categories} 
      />
      
      <SaleModal 
        isOpen={isSaleModalOpen} 
        onClose={() => setIsSaleModalOpen(false)} 
        availableSkus={skus} 
      />
    </>
  );
}
