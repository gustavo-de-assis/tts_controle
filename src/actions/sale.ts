"use server";

import { prisma } from "../lib/prisma";
import { processarVenda } from "../domain/sale";
import { revalidatePath } from "next/cache";

export interface RegisterSaleInput {
  paymentMethod: string; // PIX, CARTAO_CREDITO, etc.
  discount: number;
  items: Array<{
    skuId: string;
    quantity: number;
  }>;
}

export async function registerSale(data: RegisterSaleInput) {
  if (!data.items || data.items.length === 0) {
    throw new Error("A venda precisa ter ao menos um item.");
  }

  // Executa toda a lógica em uma transação para garantir integridade (RN-006)
  const saleId = await prisma.$transaction(async (tx) => {
    // 1. Busca os SKUs no banco de dados para injetar no domínio
    const skuIds = data.items.map(item => item.skuId);
    const dbSkus = await tx.sku.findMany({
      where: { id: { in: skuIds } },
      include: { product: true }
    });

    if (dbSkus.length !== data.items.length) {
      throw new Error("Um ou mais SKUs não foram encontrados no banco de dados.");
    }

    // 2. Mapeia para o formato esperado pelo Domínio
    const itensVenda = data.items.map(item => {
      const dbSku = dbSkus.find(s => s.id === item.skuId)!;
      // Preço de venda: usa o override do SKU se existir, senão usa o preço base do Produto Pai
      const salePrice = dbSku.salePriceOverride ?? dbSku.product.baseSalePrice;

      return {
        sku: {
          id: dbSku.id,
          cor: dbSku.color,
          tamanho: dbSku.size,
          estoqueAtual: dbSku.currentStock,
          estoqueMinimo: dbSku.minimumStock,
          ativo: dbSku.active,
        },
        quantidade: item.quantity,
        valorUnitario: salePrice,
      };
    });

    // 3. Aplica a Regra de Domínio (RN-002 e RN-006)
    // Se não houver saldo, essa função vai lançar um Error interrompendo a transação
    const resultado = processarVenda(itensVenda);

    // 4. Se passou pela validação de domínio, aplicamos o resultado no banco
    const sale = await tx.sale.create({
      data: {
        totalAmount: resultado.valorTotal - data.discount,
        discount: data.discount,
        paymentMethod: data.paymentMethod,
        status: "CONCLUIDA",
      }
    });

    for (const mov of resultado.movimentacoes) {
      // 4.1 Cria o ItemVenda linkado com a Sale
      await tx.saleItem.create({
        data: {
          saleId: sale.id,
          skuId: mov.skuId,
          quantity: mov.quantidade,
          unitValue: mov.valorUnitario,
        }
      });

      // 4.2 Cria a Movimentação Imutável de SAIDA_VENDA
      await tx.stockMovement.create({
        data: {
          skuId: mov.skuId,
          type: mov.tipo,
          quantity: mov.quantidade,
          unitValue: mov.valorUnitario,
          saleId: sale.id,
          observation: "Baixa Automática por Venda",
        }
      });

      // 4.3 Atualiza o Saldo do SKU
      const skuDomain = resultado.skusAtualizados.find(s => s.id === mov.skuId)!;
      await tx.sku.update({
        where: { id: mov.skuId },
        data: { currentStock: skuDomain.estoqueAtual }
      });
    }

    return sale.id;
  });

  revalidatePath("/");
  return saleId;
}
