"use client";

import React, { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { SaleModal } from "./sale-modal";
import type { SkuTableRow } from "./sku-table";

interface DashboardActionsProps {
  categories?: { id: string; name: string }[];
  skus: SkuTableRow[];
}

export function DashboardActions({ skus }: DashboardActionsProps) {
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setIsSaleModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
          <ShoppingCart className="w-4 h-4" /> Nova Venda
        </button>
      </div>
      
      <SaleModal 
        isOpen={isSaleModalOpen} 
        onClose={() => setIsSaleModalOpen(false)} 
        availableSkus={skus} 
      />
    </>
  );
}
