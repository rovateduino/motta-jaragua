"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@motta/db";
import {
  assertTransition,
  canTransition,
  DomainError,
  isTerminal,
  ORDER_STATUSES,
} from "@motta/domain";
import { requireAdminAction } from "@/lib/auth/session";

export type AdminActionResult =
  | { readonly ok: true; readonly message: string }
  | { readonly ok: false; readonly message: string };

class AdminActionError extends Error {}

const productInputSchema = z.object({
  id: z.string().optional(),
  sku: z.string().trim().min(1).max(64),
  name: z.string().trim().min(2).max(160),
  brand: z.string().trim().max(80),
  description: z.string().trim().max(2000),
  categoryId: z.string().min(1),
  unit: z.enum(["UNIT", "KG", "G", "L", "ML", "PACK"]),
  basePriceCents: z.number().int().positive().max(100_000_000),
  stockQuantityMilli: z.number().int().nonnegative().max(1_000_000_000),
  imageUrl: z
    .string()
    .trim()
    .max(2048)
    .refine((value) => value === "" || /^https?:\/\/\S+$/i.test(value), {
      message: "A URL da imagem deve começar com http:// ou https://.",
    }),
  active: z.boolean(),
});

const promotionInputSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1),
  promotionalPriceCents: z.number().int().positive().max(100_000_000),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  conditions: z.string().trim().max(500),
  maxQuantityPerOrderMilli: z.number().int().positive().nullable(),
  active: z.boolean(),
}).refine((value) => new Date(value.endsAt) > new Date(value.startsAt), {
  message: "A data final deve ser posterior à data inicial.",
});

const settingsInputSchema = z.object({
  storeId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  addressLine: z.string().trim().min(2).max(160),
  district: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  zipCode: z.string().trim().regex(/^\d{5}-?\d{3}$/),
  phone: z.string().trim().max(20),
  deliveryEnabled: z.boolean(),
  pickupEnabled: z.boolean(),
  deliveryFeeCents: z.number().int().nonnegative(),
  freeShippingThresholdCents: z.number().int().nonnegative(),
  minimumOrderCents: z.number().int().nonnegative(),
});

const statusInputSchema = z.object({
  orderNumber: z.string().min(4).max(32),
  nextStatus: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(500).optional(),
});

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function revalidateCatalog(): void {
  for (const path of ["/", "/catalogo", "/ofertas", "/categoria/[slug]", "/produto/[slug]"]) {
    revalidatePath(path, "page");
  }
  revalidatePath("/painel");
  revalidatePath("/painel/produtos");
  revalidatePath("/painel/ofertas");
}

function actionFailure(error: unknown, fallback: string): AdminActionResult {
  console.error(fallback, error);
  const isSafeDomainError =
    error instanceof DomainError && error.code === "INVALID_ORDER_TRANSITION";
  return {
    ok: false,
    message: error instanceof AdminActionError || isSafeDomainError ? error.message : fallback,
  };
}

export async function saveAdminProduct(input: unknown): Promise<AdminActionResult> {
  const admin = await requireAdminAction("products.write");
  const parsed = productInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados do produto inválidos." };
  }
  const data = parsed.data;

  try {
    const store = await prisma.store.findFirst({
      where: { active: true },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (!store) return { ok: false, message: "Não há uma loja ativa configurada." };

    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
      select: { id: true },
    });
    if (!category) return { ok: false, message: "O departamento selecionado não existe." };

    const computedSlug = `${slugify(data.name)}-${slugify(data.sku)}`;
    await prisma.$transaction(async (transaction) => {
      if (data.id) {
        const before = await transaction.product.findUnique({
          where: { id: data.id },
          include: {
            prices: { where: { storeId: store.id }, select: { basePriceCents: true } },
            inventory: { where: { storeId: store.id }, select: { id: true, onHand: true, reserved: true } },
          },
        });
        if (!before) throw new AdminActionError("Produto não encontrado.");
        const inventory = before.inventory[0];
        if (!inventory) throw new AdminActionError("O produto não possui estoque cadastrado para esta loja.");
        if (data.stockQuantityMilli < inventory.reserved) {
          throw new AdminActionError("O estoque não pode ficar abaixo da quantidade reservada.");
        }
        if (data.unit !== before.unit && inventory.reserved > 0) {
          throw new AdminActionError("A unidade não pode ser alterada enquanto houver estoque reservado.");
        }

        // O slug é a URL pública do produto (já indexada por buscador e
        // divulgada em links): uma edição de preço ou estoque não pode mexer
        // nele. Só recalcula quando nome ou SKU realmente mudam.
        const slug =
          slugify(data.name) === slugify(before.name) &&
          slugify(data.sku) === slugify(before.sku)
            ? before.slug
            : computedSlug;

        await transaction.product.update({
          where: { id: data.id },
          data: {
            sku: data.sku,
            slug,
            name: data.name,
            brand: data.brand || null,
            description: data.description || null,
            imageUrl: data.imageUrl || null,
            categoryId: data.categoryId,
            unit: data.unit,
            active: data.active,
          },
        });
        await transaction.price.update({
          where: { storeId_productId: { storeId: store.id, productId: data.id } },
          data: { basePriceCents: data.basePriceCents, active: true },
        });
        const changed = await transaction.inventory.updateMany({
          where: {
            id: inventory.id,
            onHand: inventory.onHand,
            reserved: { lte: data.stockQuantityMilli },
          },
          data: { onHand: data.stockQuantityMilli },
        });
        if (changed.count !== 1) {
          throw new AdminActionError("O estoque foi alterado por outra operação. Atualize a página e tente novamente.");
        }
        const delta = data.stockQuantityMilli - inventory.onHand;
        if (delta !== 0) {
          await transaction.inventoryMovement.create({
            data: {
              inventoryId: inventory.id,
              delta,
              reason: "ADJUSTMENT",
              actorAdminId: admin.id,
              note: "Ajuste realizado ao editar o produto.",
            },
          });
        }
        await transaction.auditLog.create({
          data: {
            actorType: "ADMIN",
            actorAdminId: admin.id,
            action: "product.updated",
            entityType: "Product",
            entityId: data.id,
            before: {
              sku: before.sku,
              name: before.name,
              active: before.active,
              imageUrl: before.imageUrl,
              basePriceCents: before.prices[0]?.basePriceCents ?? null,
              stockQuantityMilli: inventory.onHand,
            },
            after: {
              sku: data.sku,
              name: data.name,
              active: data.active,
              imageUrl: data.imageUrl || null,
              basePriceCents: data.basePriceCents,
              stockQuantityMilli: data.stockQuantityMilli,
            },
          },
        });
        return;
      }

      const created = await transaction.product.create({
        data: {
          sku: data.sku,
          slug: computedSlug,
          name: data.name,
          brand: data.brand || null,
          description: data.description || null,
          imageUrl: data.imageUrl || null,
          categoryId: data.categoryId,
          unit: data.unit,
          active: data.active,
          prices: {
            create: { storeId: store.id, basePriceCents: data.basePriceCents },
          },
          inventory: {
            create: { storeId: store.id, onHand: data.stockQuantityMilli },
          },
        },
        select: { id: true, inventory: { select: { id: true } } },
      });
      if (data.stockQuantityMilli > 0) {
        const inventory = created.inventory[0];
        if (!inventory) throw new AdminActionError("Não foi possível localizar o estoque inicial do produto.");
        await transaction.inventoryMovement.create({
          data: {
            inventoryId: inventory.id,
            delta: data.stockQuantityMilli,
            reason: "ADJUSTMENT",
            actorAdminId: admin.id,
            note: "Estoque inicial cadastrado no painel.",
          },
        });
      }
      await transaction.auditLog.create({
        data: {
          actorType: "ADMIN",
          actorAdminId: admin.id,
          action: "product.created",
          entityType: "Product",
          entityId: created.id,
          after: {
            sku: data.sku,
            name: data.name,
            active: data.active,
            imageUrl: data.imageUrl || null,
            basePriceCents: data.basePriceCents,
            stockQuantityMilli: data.stockQuantityMilli,
          },
        },
      });
    });
    revalidateCatalog();
    return { ok: true, message: data.id ? "Produto atualizado no banco." : "Produto criado no banco." };
  } catch (error) {
    return actionFailure(error, "Não foi possível salvar o produto.");
  }
}

export async function setAdminProductActive(
  productId: string,
  active: boolean,
): Promise<AdminActionResult> {
  const admin = await requireAdminAction("products.write");
  try {
    const updated = await prisma.$transaction(async (transaction) => {
      const product = await transaction.product.update({
        where: { id: productId },
        data: { active },
        select: { id: true, name: true, active: true },
      });
      await transaction.auditLog.create({
        data: {
          actorType: "ADMIN",
          actorAdminId: admin.id,
          action: active ? "product.activated" : "product.deactivated",
          entityType: "Product",
          entityId: product.id,
          after: { name: product.name, active: product.active },
        },
      });
      return product;
    });
    revalidateCatalog();
    return { ok: true, message: `${updated.name} ${active ? "ativado" : "desativado"}.` };
  } catch (error) {
    return actionFailure(error, "Não foi possível alterar o produto.");
  }
}

/**
 * Exclusão de um produto com as regras de integridade (sem reserva e sem
 * histórico de pedidos) e auditoria, tudo na mesma transação.
 *
 * É a base da exclusão individual e da exclusão em massa: a segunda reaproveita
 * esta função por produto, de forma que cada item é atômico isoladamente.
 */
async function deleteProductRecord(adminId: string, productId: string) {
  return prisma.$transaction(async (transaction) => {
    const product = await transaction.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        sku: true,
        inventory: { select: { reserved: true } },
        _count: { select: { orderItems: true } },
      },
    });
    if (!product) throw new AdminActionError("Produto não encontrado.");
    if (product.inventory.some((inventory) => inventory.reserved > 0)) {
      throw new AdminActionError(
        `"${product.name}" tem estoque reservado e não pode ser excluído.`,
      );
    }
    if (product._count.orderItems > 0) {
      throw new AdminActionError(
        `"${product.name}" possui histórico de pedidos; desative-o em vez de excluir.`,
      );
    }
    await transaction.auditLog.create({
      data: {
        actorType: "ADMIN",
        actorAdminId: adminId,
        action: "product.deleted",
        entityType: "Product",
        entityId: product.id,
        before: { name: product.name, sku: product.sku },
      },
    });
    await transaction.product.delete({ where: { id: product.id } });
    return product;
  });
}

export async function deleteAdminProduct(productId: string): Promise<AdminActionResult> {
  const admin = await requireAdminAction("products.write");
  try {
    const product = await deleteProductRecord(admin.id, productId);
    revalidateCatalog();
    return { ok: true, message: `${product.name} foi excluído.` };
  } catch (error) {
    return actionFailure(error, "Não foi possível excluir o produto.");
  }
}

/**
 * Exclusão em massa. Cada produto é excluído na própria transação, então um
 * item bloqueado (reserva ou histórico de pedidos) não impede a exclusão dos
 * demais; a resposta informa quantos saíram e o motivo dos que ficaram.
 */
export async function deleteProductsAction(ids: string[]): Promise<AdminActionResult> {
  const admin = await requireAdminAction("products.write");
  const parsed = z
    .array(z.string().trim().min(1))
    .min(1)
    .max(200)
    .safeParse(ids);
  if (!parsed.success) {
    return { ok: false, message: "Selecione ao menos um produto para excluir." };
  }

  const uniqueIds = [...new Set(parsed.data)];
  const failures: string[] = [];
  let deleted = 0;

  for (const id of uniqueIds) {
    try {
      await deleteProductRecord(admin.id, id);
      deleted += 1;
    } catch (error) {
      failures.push(
        error instanceof AdminActionError
          ? error.message
          : "Falha inesperada ao excluir um dos produtos.",
      );
    }
  }

  if (deleted === 0) {
    return {
      ok: false,
      message: failures[0] ?? "Nenhum produto foi excluído.",
    };
  }

  revalidateCatalog();

  if (failures.length === 0) {
    return {
      ok: true,
      message: `${deleted} ${deleted === 1 ? "produto excluído" : "produtos excluídos"}.`,
    };
  }

  const detail = failures.slice(0, 3).join(" ");
  const rest = failures.length > 3 ? ` (+${failures.length - 3} outro(s))` : "";
  return {
    ok: false,
    message: `${deleted} de ${uniqueIds.length} excluídos. ${detail}${rest}`,
  };
}

export async function saveAdminPromotion(input: unknown): Promise<AdminActionResult> {
  const admin = await requireAdminAction("promotions.write");
  const parsed = promotionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados da oferta inválidos." };
  }
  const data = parsed.data;
  try {
    const store = await prisma.store.findFirst({
      where: { active: true },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (!store) return { ok: false, message: "Não há uma loja ativa configurada." };
    const [product, price] = await Promise.all([
      prisma.product.findUnique({ where: { id: data.productId }, select: { id: true, name: true, active: true } }),
      prisma.price.findUnique({
        where: { storeId_productId: { storeId: store.id, productId: data.productId } },
        select: { basePriceCents: true },
      }),
    ]);
    if (!product || !price || !product.active) {
      return { ok: false, message: "O produto não possui preço configurado nesta loja." };
    }
    if (data.promotionalPriceCents >= price.basePriceCents) {
      return { ok: false, message: "O preço promocional deve ser menor que o preço base." };
    }

    const promotionData = {
      storeId: store.id,
      productId: product.id,
      promotionalPriceCents: data.promotionalPriceCents,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      conditions: data.conditions || null,
      maxQuantityPerOrder: data.maxQuantityPerOrderMilli,
      active: data.active,
    };
    await prisma.$transaction(async (transaction) => {
      if (data.id) {
        const existing = await transaction.promotion.findFirst({
          where: { id: data.id, storeId: store.id },
          select: { id: true },
        });
        if (!existing) throw new AdminActionError("Oferta não encontrada nesta loja.");
      }
      const saved = data.id
        ? await transaction.promotion.update({ where: { id: data.id }, data: promotionData })
        : await transaction.promotion.create({ data: promotionData });
      await transaction.auditLog.create({
        data: {
          actorType: "ADMIN",
          actorAdminId: admin.id,
          action: data.id ? "promotion.updated" : "promotion.created",
          entityType: "Promotion",
          entityId: saved.id,
          after: {
            productId: product.id,
            productName: product.name,
            promotionalPriceCents: data.promotionalPriceCents,
            startsAt: data.startsAt,
            endsAt: data.endsAt,
            active: data.active,
          },
        },
      });
    });
    revalidateCatalog();
    return { ok: true, message: data.id ? "Oferta atualizada no banco." : "Oferta criada no banco." };
  } catch (error) {
    return actionFailure(error, "Não foi possível salvar a oferta.");
  }
}

export async function setAdminPromotionActive(
  promotionId: string,
  active: boolean,
): Promise<AdminActionResult> {
  const admin = await requireAdminAction("promotions.write");
  try {
    const store = await prisma.store.findFirst({
      where: { active: true },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (!store) return { ok: false, message: "Não há uma loja ativa configurada." };
    await prisma.$transaction(async (transaction) => {
      const promotion = await transaction.promotion.findUnique({
        where: { id: promotionId, storeId: store.id },
        select: { id: true, endsAt: true, active: true, product: { select: { name: true } } },
      });
      if (!promotion) throw new AdminActionError("Oferta não encontrada.");
      if (active && promotion.endsAt <= new Date()) {
        throw new AdminActionError("Uma oferta expirada não pode ser reativada.");
      }
      const updated = await transaction.promotion.update({
        where: { id: promotionId },
        data: { active },
        select: { id: true, active: true },
      });
      await transaction.auditLog.create({
        data: {
          actorType: "ADMIN",
          actorAdminId: admin.id,
          action: active ? "promotion.activated" : "promotion.deactivated",
          entityType: "Promotion",
          entityId: updated.id,
          after: { productName: promotion.product.name, active: updated.active },
        },
      });
    });
    revalidateCatalog();
    return { ok: true, message: `Oferta ${active ? "ativada" : "desativada"}.` };
  } catch (error) {
    return actionFailure(error, "Não foi possível alterar a oferta.");
  }
}

export async function deleteAdminPromotion(promotionId: string): Promise<AdminActionResult> {
  const admin = await requireAdminAction("promotions.write");
  try {
    const store = await prisma.store.findFirst({
      where: { active: true },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (!store) return { ok: false, message: "Não há uma loja ativa configurada." };
    await prisma.$transaction(async (transaction) => {
      const promotion = await transaction.promotion.findUnique({
        where: { id: promotionId, storeId: store.id },
        select: { id: true, product: { select: { name: true, sku: true } } },
      });
      if (!promotion) throw new Error("Oferta não encontrada.");
      await transaction.auditLog.create({
        data: {
          actorType: "ADMIN",
          actorAdminId: admin.id,
          action: "promotion.deleted",
          entityType: "Promotion",
          entityId: promotion.id,
          before: { productName: promotion.product.name, sku: promotion.product.sku },
        },
      });
      await transaction.promotion.delete({ where: { id: promotion.id } });
    });
    revalidateCatalog();
    return { ok: true, message: "Oferta excluída." };
  } catch (error) {
    return actionFailure(error, "Não foi possível excluir a oferta.");
  }
}

export async function updateAdminOrderStatus(input: unknown): Promise<AdminActionResult> {
  const admin = await requireAdminAction("orders.update");
  const parsed = statusInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados da transição inválidos." };
  }
  const { orderNumber, nextStatus, note } = parsed.data;
  try {
    await prisma.$transaction(async (transaction) => {
      const order = await transaction.order.findUnique({
        where: { orderNumber },
        select: {
          id: true,
          status: true,
          storeId: true,
          items: { select: { productId: true, quantity: true, productNameSnapshot: true } },
        },
      });
      if (!order) throw new AdminActionError("Pedido não encontrado.");
      assertTransition(order.status, nextStatus);

      const changed = await transaction.order.updateMany({
        where: { id: order.id, status: order.status },
        data: {
          status: nextStatus,
          ...(nextStatus === "CONFIRMED" ? { confirmedAt: new Date() } : {}),
          ...(nextStatus === "COMPLETED" ? { completedAt: new Date() } : {}),
          ...(nextStatus === "CANCELLED" ? { cancelledAt: new Date() } : {}),
        },
      });
      if (changed.count !== 1) {
        throw new AdminActionError("O pedido foi atualizado por outra operação. Recarregue a página.");
      }
      if (nextStatus === "COMPLETED" || nextStatus === "CANCELLED") {
        for (const item of order.items) {
          if (!item.productId) continue;
          const inventory = await transaction.inventory.findUnique({
            where: {
              storeId_productId: {
                storeId: order.storeId,
                productId: item.productId,
              },
            },
            select: { id: true },
          });
          if (!inventory) {
            throw new AdminActionError(`Estoque não encontrado para ${item.productNameSnapshot}.`);
          }

          const completed = nextStatus === "COMPLETED";
          // `updatedAt` recebe um Date como parâmetro (em vez de NOW()) para ser
          // compatível com PostgreSQL (produção/Neon) e SQLite (E2E local).
          const affected = completed
            ? await transaction.$executeRaw`
                UPDATE "Inventory"
                SET "onHand" = "onHand" - ${item.quantity},
                    "reserved" = "reserved" - ${item.quantity},
                    "updatedAt" = ${new Date()}
                WHERE "id" = ${inventory.id}
                  AND "onHand" >= ${item.quantity}
                  AND "reserved" >= ${item.quantity}
              `
            : await transaction.$executeRaw`
                UPDATE "Inventory"
                SET "reserved" = "reserved" - ${item.quantity},
                    "updatedAt" = ${new Date()}
                WHERE "id" = ${inventory.id}
                  AND "reserved" >= ${item.quantity}
              `;
          if (affected !== 1) {
            throw new AdminActionError(`Não foi possível finalizar a reserva de estoque para ${item.productNameSnapshot}.`);
          }
          await transaction.inventoryMovement.create({
            data: {
              inventoryId: inventory.id,
              delta: completed ? -item.quantity : item.quantity,
              reason: completed ? "SALE" : "RELEASE",
              reference: orderNumber,
              actorAdminId: admin.id,
              note: completed
                ? "Baixa de estoque ao concluir o pedido."
                : "Liberação de reserva ao cancelar o pedido.",
            },
          });
        }
      }
      await transaction.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: nextStatus,
          changedByAdminId: admin.id,
          note: note || null,
        },
      });
      await transaction.auditLog.create({
        data: {
          actorType: "ADMIN",
          actorAdminId: admin.id,
          action: "order.status.updated",
          entityType: "Order",
          entityId: order.id,
          before: { status: order.status },
          after: { status: nextStatus, orderNumber, note: note || null },
        },
      });
    });
    revalidatePath("/painel");
    revalidatePath("/painel/pedidos");
    revalidatePath(`/painel/pedidos/${orderNumber}`);
    revalidatePath("/pedidos");
    revalidatePath(`/pedidos/${orderNumber}`);
    return { ok: true, message: "Status do pedido atualizado." };
  } catch (error) {
    return actionFailure(error, "Não foi possível atualizar o status.");
  }
}

/**
 * Exclusão lógica (soft delete) de um pedido.
 *
 * O registro, os itens, o histórico de status e os documentos fiscais continuam
 * no banco; `deletedAt` apenas tira o pedido da fila operacional. Para não
 * esconder pedidos em andamento, a exclusão cancela antes os pedidos que
 * aceitam essa transição, liberando a reserva de estoque. Pedidos que já
 * passaram para a entrega não podem ser cancelados e precisam ser finalizados
 * pelo fluxo normal.
 */
async function softDeleteOrderRecord(
  adminId: string,
  storeId: string,
  orderId: string,
) {
  return prisma.$transaction(async (transaction) => {
    const order = await transaction.order.findFirst({
      where: { id: orderId, storeId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        deletedAt: true,
        items: {
          select: { productId: true, quantity: true, productNameSnapshot: true },
        },
      },
    });
    if (!order) throw new AdminActionError("Pedido não encontrado.");
    if (order.deletedAt) {
      throw new AdminActionError(`O pedido ${order.orderNumber} já foi excluído.`);
    }

    let finalStatus = order.status;

    if (!isTerminal(order.status)) {
      if (!canTransition(order.status, "CANCELLED")) {
        throw new AdminActionError(
          `O pedido ${order.orderNumber} já saiu para entrega e não pode ser excluído. Finalize a entrega antes.`,
        );
      }

      const cancelled = await transaction.order.updateMany({
        where: { id: order.id, status: order.status, deletedAt: null },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      if (cancelled.count !== 1) {
        throw new AdminActionError(
          `O pedido ${order.orderNumber} foi atualizado por outra operação. Recarregue a página.`,
        );
      }

      // Mesma liberação de reserva usada ao cancelar pelo detalhe do pedido.
      for (const item of order.items) {
        if (!item.productId) continue;
        const inventory = await transaction.inventory.findUnique({
          where: {
            storeId_productId: {
              storeId,
              productId: item.productId,
            },
          },
          select: { id: true },
        });
        if (!inventory) {
          throw new AdminActionError(
            `Estoque não encontrado para ${item.productNameSnapshot}.`,
          );
        }

        const affected = await transaction.$executeRaw`
          UPDATE "Inventory"
          SET "reserved" = "reserved" - ${item.quantity},
              "updatedAt" = ${new Date()}
          WHERE "id" = ${inventory.id}
            AND "reserved" >= ${item.quantity}
        `;
        if (affected !== 1) {
          throw new AdminActionError(
            `Não foi possível liberar a reserva de ${item.productNameSnapshot}.`,
          );
        }
        await transaction.inventoryMovement.create({
          data: {
            inventoryId: inventory.id,
            delta: item.quantity,
            reason: "RELEASE",
            reference: order.orderNumber,
            actorAdminId: adminId,
            note: "Liberação de reserva ao excluir o pedido.",
          },
        });
      }

      await transaction.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: "CANCELLED",
          changedByAdminId: adminId,
          note: "Cancelado automaticamente pela exclusão em massa.",
        },
      });

      finalStatus = "CANCELLED";
    }

    const deletedAt = new Date();
    const changed = await transaction.order.updateMany({
      where: { id: order.id, deletedAt: null },
      data: { deletedAt },
    });
    if (changed.count !== 1) {
      throw new AdminActionError(
        `O pedido ${order.orderNumber} foi atualizado por outra operação. Recarregue a página.`,
      );
    }

    await transaction.auditLog.create({
      data: {
        actorType: "ADMIN",
        actorAdminId: adminId,
        action: "order.deleted",
        entityType: "Order",
        entityId: order.id,
        before: { orderNumber: order.orderNumber, status: order.status },
        after: {
          status: finalStatus,
          deletedAt: deletedAt.toISOString(),
          softDelete: true,
        },
      },
    });

    return order;
  });
}

/**
 * Exclusão em massa de pedidos (soft delete). Cada pedido roda na própria
 * transação, então um pedido em andamento não impede a exclusão dos demais; a
 * resposta informa quantos saíram e o motivo dos que ficaram.
 */
export async function deleteOrdersAction(ids: string[]): Promise<AdminActionResult> {
  const admin = await requireAdminAction("orders.update");
  const parsed = z
    .array(z.string().trim().min(1))
    .min(1)
    .max(200)
    .safeParse(ids);
  if (!parsed.success) {
    return { ok: false, message: "Selecione ao menos um pedido para excluir." };
  }

  const store = await prisma.store.findFirst({
    where: { active: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!store) return { ok: false, message: "Não há uma loja ativa configurada." };

  const uniqueIds = [...new Set(parsed.data)];
  const failures: string[] = [];
  let deleted = 0;

  for (const id of uniqueIds) {
    try {
      await softDeleteOrderRecord(admin.id, store.id, id);
      deleted += 1;
    } catch (error) {
      failures.push(
        error instanceof AdminActionError
          ? error.message
          : "Falha inesperada ao excluir um dos pedidos.",
      );
    }
  }

  if (deleted === 0) {
    return {
      ok: false,
      message: failures[0] ?? "Nenhum pedido foi excluído.",
    };
  }

  revalidatePath("/painel");
  revalidatePath("/painel/pedidos");
  revalidatePath("/painel/entregas");

  if (failures.length === 0) {
    return {
      ok: true,
      message: `${deleted} ${deleted === 1 ? "pedido excluído" : "pedidos excluídos"} da fila. O histórico foi preservado.`,
    };
  }

  const detail = failures.slice(0, 3).join(" ");
  const rest = failures.length > 3 ? ` (+${failures.length - 3} outro(s))` : "";
  return {
    ok: false,
    message: `${deleted} de ${uniqueIds.length} excluídos. ${detail}${rest}`,
  };
}

export async function saveAdminStoreSettings(
  input: unknown,
): Promise<AdminActionResult> {
  const admin = await requireAdminAction("settings.write");
  const parsed = settingsInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Configurações inválidas." };
  }
  const data = parsed.data;
  try {
    await prisma.$transaction(async (transaction) => {
    const activeStore = await transaction.store.findFirst({
      where: { id: data.storeId, active: true },
      select: { id: true },
    });
    if (!activeStore) throw new AdminActionError("A loja selecionada não está ativa.");
    const store = await transaction.store.update({
        where: { id: data.storeId },
        data: {
          name: data.name,
          addressLine: data.addressLine,
          district: data.district,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          phone: data.phone || null,
        },
      });
      const settings: Array<[string, string | boolean | number]> = [
        ["store.name", data.name],
        ["delivery.enabled", data.deliveryEnabled],
        ["pickup.enabled", data.pickupEnabled],
        ["delivery.feeCents", data.deliveryFeeCents],
        ["delivery.freeAboveCents", data.freeShippingThresholdCents],
        ["order.minimumCents", data.minimumOrderCents],
      ];
      for (const [key, value] of settings) {
        await transaction.setting.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        });
      }
      await transaction.auditLog.create({
        data: {
          actorType: "ADMIN",
          actorAdminId: admin.id,
          action: "store.settings.updated",
          entityType: "Store",
          entityId: store.id,
          after: {
            name: store.name,
            city: store.city,
            state: store.state,
            deliveryEnabled: data.deliveryEnabled,
            pickupEnabled: data.pickupEnabled,
            deliveryFeeCents: data.deliveryFeeCents,
            freeShippingThresholdCents: data.freeShippingThresholdCents,
            minimumOrderCents: data.minimumOrderCents,
          },
        },
      });
    });
    revalidatePath("/");
    revalidatePath("/checkout");
    revalidatePath("/painel/configuracoes");
    return { ok: true, message: "Configurações atualizadas no banco." };
  } catch (error) {
    return actionFailure(error, "Não foi possível salvar as configurações.");
  }
}
