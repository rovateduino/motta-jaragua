/**
 * Seed de demonstração do Mercado Motta Jaraguá.
 *
 * Todos os dados são FICTÍCIOS e servem apenas para desenvolvimento.
 * Não execute este seed em produção.
 *
 * Uso: npm run db:seed -w @motta/db
 */
import { Prisma, PrismaClient, ProductUnit } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Quantidades são inteiras em milésimos da unidade de venda (1 un = 1000;
 * 500 g = 500 quando a unidade é o kg). O seed declara estoque e limites em
 * unidades inteiras por legibilidade e converte ao gravar.
 */
const QUANTITY_SCALE = 1000;

function toQuantityMilli(quantity: number): number {
  return quantity * QUANTITY_SCALE;
}

interface CategorySeed {
  slug: string;
  name: string;
  icon: string;
  sortOrder: number;
}

interface ProductSeed {
  sku: string;
  name: string;
  slug: string;
  categorySlug: string;
  unit: ProductUnit;
  priceCents: number;
  stock: number;
  reorderPoint?: number;
  brand?: string;
}

interface PromotionSeed {
  sku: string;
  promotionalPriceCents: number;
  maxQuantityPerOrder?: number;
  conditions?: string;
}

const categories: CategorySeed[] = [
  { slug: "hortifruti", name: "Hortifruti", icon: "🥬", sortOrder: 1 },
  { slug: "acougue-e-aves", name: "Açougue e aves", icon: "🥩", sortOrder: 2 },
  { slug: "padaria", name: "Padaria", icon: "🥖", sortOrder: 3 },
  { slug: "laticinios-e-frios", name: "Laticínios e frios", icon: "🧀", sortOrder: 4 },
  { slug: "mercearia", name: "Mercearia", icon: "🛒", sortOrder: 5 },
  { slug: "bebidas", name: "Bebidas", icon: "🥤", sortOrder: 6 },
  { slug: "limpeza", name: "Limpeza", icon: "🧼", sortOrder: 7 },
  { slug: "higiene-pessoal", name: "Higiene pessoal", icon: "🧴", sortOrder: 8 },
  { slug: "congelados", name: "Congelados", icon: "🧊", sortOrder: 9 },
  { slug: "pet-shop", name: "Pet shop", icon: "🐶", sortOrder: 10 },
];

const products: ProductSeed[] = [
  { sku: "ARR-001", name: "Arroz Tipo 1 5kg", slug: "arroz-tipo-1-5kg", categorySlug: "mercearia", unit: ProductUnit.UNIT, priceCents: 2490, stock: 48, reorderPoint: 12 },
  { sku: "FEI-001", name: "Feijão Carioca 1kg", slug: "feijao-carioca-1kg", categorySlug: "mercearia", unit: ProductUnit.UNIT, priceCents: 790, stock: 60, reorderPoint: 15 },
  { sku: "OLE-001", name: "Óleo de Soja 900ml", slug: "oleo-de-soja-900ml", categorySlug: "mercearia", unit: ProductUnit.UNIT, priceCents: 649, stock: 72, reorderPoint: 18 },
  { sku: "MAC-001", name: "Macarrão Espaguete 500g", slug: "macarrao-espaguete-500g", categorySlug: "mercearia", unit: ProductUnit.UNIT, priceCents: 429, stock: 90, reorderPoint: 20 },
  { sku: "CAF-001", name: "Café Torrado e Moído 500g", slug: "cafe-torrado-e-moido-500g", categorySlug: "mercearia", unit: ProductUnit.UNIT, priceCents: 1890, stock: 35, reorderPoint: 10 },

  { sku: "BAN-001", name: "Banana Prata", slug: "banana-prata", categorySlug: "hortifruti", unit: ProductUnit.KG, priceCents: 599, stock: 80, reorderPoint: 20 },
  { sku: "TOM-001", name: "Tomate", slug: "tomate", categorySlug: "hortifruti", unit: ProductUnit.KG, priceCents: 749, stock: 45, reorderPoint: 15 },
  { sku: "BAT-001", name: "Batata Inglesa", slug: "batata-inglesa", categorySlug: "hortifruti", unit: ProductUnit.KG, priceCents: 499, stock: 70, reorderPoint: 20 },
  { sku: "ALC-001", name: "Alface Crespa", slug: "alface-crespa", categorySlug: "hortifruti", unit: ProductUnit.UNIT, priceCents: 299, stock: 25, reorderPoint: 10 },

  { sku: "PAT-001", name: "Picanha Bovina", slug: "picanha-bovina", categorySlug: "acougue-e-aves", unit: ProductUnit.KG, priceCents: 8990, stock: 18, reorderPoint: 6 },
  { sku: "FRA-001", name: "Frango Inteiro", slug: "frango-inteiro", categorySlug: "acougue-e-aves", unit: ProductUnit.KG, priceCents: 1290, stock: 40, reorderPoint: 12 },
  { sku: "LIN-001", name: "Linguiça Toscana", slug: "linguica-toscana", categorySlug: "acougue-e-aves", unit: ProductUnit.KG, priceCents: 2190, stock: 22, reorderPoint: 8 },

  { sku: "PAO-001", name: "Pão Francês", slug: "pao-frances", categorySlug: "padaria", unit: ProductUnit.KG, priceCents: 1290, stock: 30, reorderPoint: 10 },
  { sku: "BOL-001", name: "Bolo de Cenoura 400g", slug: "bolo-de-cenoura-400g", categorySlug: "padaria", unit: ProductUnit.UNIT, priceCents: 1590, stock: 12, reorderPoint: 5 },

  { sku: "LEI-001", name: "Leite Integral 1L", slug: "leite-integral-1l", categorySlug: "laticinios-e-frios", unit: ProductUnit.UNIT, priceCents: 549, stock: 96, reorderPoint: 24 },
  { sku: "QUE-001", name: "Queijo Mussarela", slug: "queijo-mussarela", categorySlug: "laticinios-e-frios", unit: ProductUnit.KG, priceCents: 4590, stock: 15, reorderPoint: 6 },
  { sku: "MAN-001", name: "Manteiga 200g", slug: "manteiga-200g", categorySlug: "laticinios-e-frios", unit: ProductUnit.UNIT, priceCents: 990, stock: 28, reorderPoint: 10 },

  { sku: "REF-001", name: "Refrigerante Cola 2L", slug: "refrigerante-cola-2l", categorySlug: "bebidas", unit: ProductUnit.UNIT, priceCents: 899, stock: 54, reorderPoint: 18 },
  { sku: "SUC-001", name: "Suco de Uva Integral 1L", slug: "suco-de-uva-integral-1l", categorySlug: "bebidas", unit: ProductUnit.UNIT, priceCents: 1290, stock: 26, reorderPoint: 10 },

  { sku: "DET-001", name: "Detergente 500ml", slug: "detergente-500ml", categorySlug: "limpeza", unit: ProductUnit.UNIT, priceCents: 299, stock: 110, reorderPoint: 30 },
  { sku: "SAB-001", name: "Sabão em Pó 1kg", slug: "sabao-em-po-1kg", categorySlug: "limpeza", unit: ProductUnit.UNIT, priceCents: 1190, stock: 42, reorderPoint: 12 },

  { sku: "PAP-001", name: "Papel Higiênico 12 rolos", slug: "papel-higienico-12-rolos", categorySlug: "higiene-pessoal", unit: ProductUnit.UNIT, priceCents: 1890, stock: 33, reorderPoint: 10 },
  { sku: "SHA-001", name: "Shampoo 350ml", slug: "shampoo-350ml", categorySlug: "higiene-pessoal", unit: ProductUnit.UNIT, priceCents: 1590, stock: 24, reorderPoint: 8 },

  { sku: "PIZ-001", name: "Pizza Congelada 460g", slug: "pizza-congelada-460g", categorySlug: "congelados", unit: ProductUnit.UNIT, priceCents: 1790, stock: 20, reorderPoint: 8 },
  { sku: "ERV-001", name: "Ervilha Congelada 400g", slug: "ervilha-congelada-400g", categorySlug: "congelados", unit: ProductUnit.UNIT, priceCents: 899, stock: 14, reorderPoint: 6 },

  { sku: "RAC-001", name: "Ração para Cães 3kg", slug: "racao-para-caes-3kg", categorySlug: "pet-shop", unit: ProductUnit.UNIT, priceCents: 4590, stock: 8, reorderPoint: 4 },
];

const promotions: PromotionSeed[] = [
  { sku: "ARR-001", promotionalPriceCents: 2190, maxQuantityPerOrder: 5, conditions: "Oferta demonstrativa limitada a 5 unidades por pedido." },
  { sku: "PAT-001", promotionalPriceCents: 7990, conditions: "Oferta demonstrativa válida enquanto durar o estoque." },
  { sku: "REF-001", promotionalPriceCents: 749, maxQuantityPerOrder: 6, conditions: "Oferta demonstrativa limitada a 6 unidades por pedido." },
  { sku: "DET-001", promotionalPriceCents: 249, conditions: "Oferta demonstrativa." },
  { sku: "LEI-001", promotionalPriceCents: 479, maxQuantityPerOrder: 12, conditions: "Oferta demonstrativa limitada a 12 unidades por pedido." },
];

const permissions = [
  ["orders.read", "Consultar pedidos"],
  ["orders.update", "Atualizar status de pedidos"],
  ["products.read", "Consultar produtos"],
  ["products.write", "Criar e editar produtos"],
  ["inventory.write", "Ajustar estoque"],
  ["promotions.write", "Gerenciar promoções e preços"],
  ["customers.read", "Consultar clientes"],
  ["reports.read", "Consultar relatórios"],
  ["settings.write", "Alterar configurações"],
  ["users.manage", "Gerenciar usuários e papéis"],
  ["audit.read", "Consultar auditoria"],
] as const;

/**
 * Hash Argon2id da senha fictícia "Motta@2026!" usada apenas pelas contas demo.
 * Nunca reutilize esta senha em ambientes reais.
 */
const DEMO_PASSWORD_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$yLkKDZEvdowPNZZvxrXfNg$OWFLnkZ5C1/mAhmrdPmDxYlq5vXDjf9Q0SJvSpY5kx4";

const roles: Array<{ name: string; description: string; permissions: string[] }> = [
  { name: "ADMIN", description: "Acesso completo", permissions: permissions.map(([key]) => key) },
  { name: "MANAGER", description: "Operação e catálogo", permissions: ["orders.read", "orders.update", "products.read", "products.write", "inventory.write", "promotions.write", "reports.read", "customers.read"] },
  { name: "PICKER", description: "Separação de pedidos", permissions: ["orders.read", "orders.update", "products.read", "inventory.write"] },
  { name: "DRIVER", description: "Entregas atribuídas", permissions: ["orders.read", "orders.update"] },
  { name: "SUPPORT", description: "Atendimento ao cliente", permissions: ["orders.read", "customers.read"] },
  { name: "FINANCE", description: "Financeiro e conciliação", permissions: ["orders.read", "reports.read", "customers.read"] },
];

function startOfUtcDay(date: Date): Date {
  const copy = new Date(date);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

function daysFrom(base: Date, days: number): Date {
  const copy = new Date(base);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

async function upsertDemoAdmin(input: {
  name: string;
  email: string;
  roleNames: string[];
}): Promise<string> {
  const admin = await prisma.adminUser.upsert({
    where: { email: input.email },
    update: {
      name: input.name,
      passwordHash: DEMO_PASSWORD_HASH,
      active: true,
    },
    create: {
      name: input.name,
      email: input.email,
      passwordHash: DEMO_PASSWORD_HASH,
      active: true,
    },
  });

  const roles = await prisma.role.findMany({
    where: { name: { in: input.roleNames } },
    select: { id: true },
  });

  await prisma.adminUserRole.deleteMany({ where: { adminUserId: admin.id } });
  await prisma.adminUserRole.createMany({
    data: roles.map((role) => ({ adminUserId: admin.id, roleId: role.id })),
    skipDuplicates: true,
  });

  return admin.id;
}

async function main(): Promise<void> {
  const store = await prisma.store.upsert({
    where: { slug: "jaragua" },
    update: {
      name: "Mercado Motta Jaraguá",
      active: true,
    },
    create: {
      name: "Mercado Motta Jaraguá",
      slug: "jaragua",
      addressLine: "Endereço oficial a confirmar",
      district: "Centro",
      city: "Jaraguá do Sul",
      state: "SC",
      zipCode: "00000-000",
      phone: null,
    },
  });

  const categoryIds = new Map<string, string>();
  for (const category of categories) {
    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, icon: category.icon, sortOrder: category.sortOrder, active: true },
      create: { name: category.name, slug: category.slug, icon: category.icon, sortOrder: category.sortOrder },
    });
    categoryIds.set(category.slug, row.id);
  }

  for (const product of products) {
    const categoryId = categoryIds.get(product.categorySlug);
    if (!categoryId) {
      throw new Error(`Categoria inexistente no seed: ${product.categorySlug}`);
    }

    const row = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        slug: product.slug,
        categoryId,
        unit: product.unit,
        weighsVariable: product.unit === ProductUnit.KG,
        active: true,
      },
      create: {
        sku: product.sku,
        name: product.name,
        slug: product.slug,
        description: "Produto fictício para demonstração.",
        brand: product.brand ?? null,
        categoryId,
        unit: product.unit,
        weighsVariable: product.unit === ProductUnit.KG,
        active: true,
      },
    });

    await prisma.price.upsert({
      where: { storeId_productId: { storeId: store.id, productId: row.id } },
      update: { basePriceCents: product.priceCents, active: true },
      create: { storeId: store.id, productId: row.id, basePriceCents: product.priceCents },
    });

    await prisma.inventory.upsert({
      where: { storeId_productId: { storeId: store.id, productId: row.id } },
      update: {
        onHand: toQuantityMilli(product.stock),
        reorderPoint: toQuantityMilli(product.reorderPoint ?? 5),
      },
      create: {
        storeId: store.id,
        productId: row.id,
        onHand: toQuantityMilli(product.stock),
        reorderPoint: toQuantityMilli(product.reorderPoint ?? 5),
      },
    });
  }

  const now = new Date();
  const promotionStartsAt = daysFrom(now, -7);
  const promotionEndsAt = daysFrom(now, 30);

  for (const promotion of promotions) {
    const product = await prisma.product.findUnique({ where: { sku: promotion.sku } });
    if (!product) {
      throw new Error(`Produto inexistente para promoção: ${promotion.sku}`);
    }

    await prisma.promotion.upsert({
      where: { id: `promo-demo-${promotion.sku.toLowerCase()}` },
      update: {
        promotionalPriceCents: promotion.promotionalPriceCents,
        startsAt: promotionStartsAt,
        endsAt: promotionEndsAt,
        maxQuantityPerOrder:
          promotion.maxQuantityPerOrder === undefined
            ? null
            : toQuantityMilli(promotion.maxQuantityPerOrder),
        conditions: promotion.conditions ?? null,
        active: true,
      },
      create: {
        id: `promo-demo-${promotion.sku.toLowerCase()}`,
        storeId: store.id,
        productId: product.id,
        promotionalPriceCents: promotion.promotionalPriceCents,
        startsAt: promotionStartsAt,
        endsAt: promotionEndsAt,
        maxQuantityPerOrder:
          promotion.maxQuantityPerOrder === undefined
            ? null
            : toQuantityMilli(promotion.maxQuantityPerOrder),
        conditions: promotion.conditions ?? null,
      },
    });
  }

  const today = startOfUtcDay(now);
  const windows = [
    { startTime: "09:00", endTime: "12:00" },
    { startTime: "14:00", endTime: "18:00" },
    { startTime: "18:00", endTime: "21:00" },
  ];

  for (let offset = 1; offset <= 3; offset += 1) {
    const date = daysFrom(today, offset);
    for (const window of windows) {
      await prisma.deliverySlot.upsert({
        where: {
          storeId_date_startTime: {
            storeId: store.id,
            date,
            startTime: window.startTime,
          },
        },
        update: { endTime: window.endTime, capacity: 20, active: true },
        create: {
          storeId: store.id,
          date,
          startTime: window.startTime,
          endTime: window.endTime,
          capacity: 20,
        },
      });
    }
  }

  const settings: Array<{ key: string; value: Prisma.InputJsonValue; description: string }> = [
    { key: "store.name", value: "Mercado Motta Jaraguá", description: "Nome exibido na loja" },
    { key: "delivery.enabled", value: true, description: "Entrega em domicílio habilitada no demo" },
    { key: "pickup.enabled", value: true, description: "Retirada na loja habilitada no demo" },
    { key: "delivery.feeCents", value: 990, description: "Taxa de entrega demonstrativa em centavos" },
    { key: "delivery.freeAboveCents", value: 15000, description: "Frete grátis demonstrativo em centavos" },
    { key: "order.minimumCents", value: 3000, description: "Pedido mínimo demonstrativo em centavos" },
    { key: "demo.mode", value: true, description: "Dados fictícios, sem cobrança real" },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, description: setting.description },
      create: { key: setting.key, value: setting.value, description: setting.description },
    });
  }

  for (const [key, description] of permissions) {
    await prisma.permission.upsert({
      where: { key },
      update: { description },
      create: { key, description },
    });
  }

  for (const role of roles) {
    const roleRow = await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: { name: role.name, description: role.description },
    });

    for (const permissionKey of role.permissions) {
      const permission = await prisma.permission.findUnique({ where: { key: permissionKey } });
      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: roleRow.id, permissionId: permission.id },
        },
        update: {},
        create: { roleId: roleRow.id, permissionId: permission.id },
      });
    }
  }

  const demoCustomer = await prisma.customer.upsert({
    where: { email: "cliente@motta.test" },
    update: {
      name: "Cliente Demonstração",
      phone: "(48) 99999-0000",
      passwordHash: DEMO_PASSWORD_HASH,
      anonymizedAt: null,
    },
    create: {
      name: "Cliente Demonstração",
      email: "cliente@motta.test",
      phone: "(48) 99999-0000",
      passwordHash: DEMO_PASSWORD_HASH,
    },
  });

  const demoAdminIds = await Promise.all([
    upsertDemoAdmin({
      name: "Administrador Motta",
      email: "admin@motta.test",
      roleNames: ["ADMIN"],
    }),
    upsertDemoAdmin({
      name: "Atendimento Motta",
      email: "atendimento@motta.test",
      roleNames: ["SUPPORT"],
    }),
  ]);

  await prisma.authSession.deleteMany({
    where: {
      OR: [
        { customerId: demoCustomer.id },
        { adminUserId: { in: demoAdminIds } },
      ],
    },
  });
  console.log("Seed de demonstração concluído:");
  console.log(`  Loja: ${store.name}`);
  console.log(`  Categorias: ${categories.length}`);
  console.log(`  Produtos: ${products.length}`);
  console.log(`  Promoções: ${promotions.length}`);
  console.log(`  Papéis: ${roles.length}`);
  console.log("  Aviso: todos os dados são fictícios.");
}

main()
  .catch((error: unknown) => {
    console.error("Falha no seed de demonstração:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
