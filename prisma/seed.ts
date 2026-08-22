import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('Iniciando o seed do banco de dados...')

  // Limpa o banco para evitar duplicatas em re-seeds
  await prisma.saleItem.deleteMany()
  await prisma.stockMovement.deleteMany()
  await prisma.sale.deleteMany()
  await prisma.sku.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()

  console.log('Banco de dados limpo.')

  // 1. Criar Categorias
  const catVestidos = await prisma.category.create({
    data: {
      name: 'Vestidos',
      description: 'Vestidos femininos diversos',
    },
  })

  const catCamisetas = await prisma.category.create({
    data: {
      name: 'Camisetas',
      description: 'Camisetas unissex e femininas',
    },
  })

  const catCalcas = await prisma.category.create({
    data: {
      name: 'Calças',
      description: 'Calças jeans e alfaiataria',
    },
  })

  // 2. Criar Produtos Pai
  const prodVestidoFloral = await prisma.product.create({
    data: {
      name: 'Vestido Floral Verão',
      baseCostPrice: 45.0,
      baseSalePrice: 120.0,
      categoryId: catVestidos.id,
    },
  })

  const prodCamisetaBasica = await prisma.product.create({
    data: {
      name: 'Camiseta Básica Algodão',
      baseCostPrice: 15.0,
      baseSalePrice: 49.9,
      categoryId: catCamisetas.id,
    },
  })

  const prodCalcaJeans = await prisma.product.create({
    data: {
      name: 'Calça Jeans Skinny',
      baseCostPrice: 60.0,
      baseSalePrice: 159.9,
      categoryId: catCalcas.id,
    },
  })

  // 3. Criar SKUs com diferentes níveis de estoque para testar RN-003
  
  // Vestidos
  await prisma.sku.create({
    data: {
      sku: 'VES-FLO-AZ-P',
      color: 'Azul',
      size: 'P',
      currentStock: 12,
      minimumStock: 3,
      productId: prodVestidoFloral.id,
    },
  })

  await prisma.sku.create({
    data: {
      sku: 'VES-FLO-AZ-M',
      color: 'Azul',
      size: 'M',
      currentStock: 2, // Estoque crítico (<= 3)
      minimumStock: 3,
      productId: prodVestidoFloral.id,
    },
  })

  // Camisetas
  await prisma.sku.create({
    data: {
      sku: 'CAM-BAS-BR-G',
      color: 'Branco',
      size: 'G',
      currentStock: 45,
      minimumStock: 10,
      productId: prodCamisetaBasica.id,
    },
  })

  // Calças
  await prisma.sku.create({
    data: {
      sku: 'CAL-JEA-AZ-38',
      color: 'Azul Escuro',
      size: '38',
      currentStock: 0, // Estoque crítico e zerado (<= 5)
      minimumStock: 5,
      productId: prodCalcaJeans.id,
    },
  })

  await prisma.sku.create({
    data: {
      sku: 'CAL-JEA-AZ-40',
      color: 'Azul Escuro',
      size: '40',
      currentStock: 8,
      minimumStock: 5,
      productId: prodCalcaJeans.id,
    },
  })

  console.log('Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
