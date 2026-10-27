"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@motta/db";
import {
  calculateLineSubtotalCents,
  formatBRL,
  isPromotionActive,
  resolveEffectivePriceCents,
  type PromotionWindow,
} from "@motta/domain";
import { getCurrentCustomer } from "@/lib/auth/session";
import { generateOrderNumber, getStoreSettings, isUniqueViolation } from "./orders-db";

/**
 * Server action do checkout.
 *
 * O navegador envia apenas o produto e a quantidade; preço, disponibilidade,
 * frete e pedido mínimo são recalculados aqui. A criação do pedido roda em uma
 * transação Prisma que reserva estoque (`Inventory.reserved`) de forma
 * condicional, evitando que dois clientes levem o mesmo último item.
 */

const checkoutInputSchema = z.object({
  fulfillmentType: z.enum(["DELIVERY", "PICKUP"]),
  substitutionPreference: z.enum([
    "CONTACT_BEFORE",
    "ACCEPT_EQUIVALENT",
    "DO_NOT_SUBSTITUTE",
    "REMOVE_ITEM",
  ]),
  contactName: z.string().trim().min(2).max(120),
  contactPhone: z.string().trim().min(10).max(20),
  contactEmail: z.union([z.literal(""), z.string().trim().email().max(160)]).optional(),
  address: z
    .object({
      recipient: z.string().trim().min(2).max(120),
      phone: z.string().trim().min(10).max(20),
      zipCode: z.string().trim().regex(/^\d{5}-?\d{3}$/),
      street: z.string().trim().min(2).max(160),
      number: z.string().trim().min(1).max(20),
      complement: z.string().trim().max(80).optional(),
      district: z.string().trim().min(2).max(80),
      city: z.string().trim().min(2).max(80),
      state: z.string().trim().length(2),
    })
    .optional(),
  deliverySlotId: z.string().trim().min(1).optional(),
  notes: z.string().trim().max(280).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().trim().min(1),
        quantityMilli: z.number().int().min(1),
      }),
    )
    .min(1),
});

export type CheckoutInput = z.input<typeof checkoutInputSchema>;

export type CreateOrderResult =
  | { readonly ok: true; readonly orderNumber: string; readonly totalCents: number }
  | { readonly ok: false; readonly message: string };

/** Falha de negócio esperada: vira mensagem amigável, não erro 500. */
class CheckoutError extends Error {}

interface PromotionRow extends PromotionWindow {
  readonly promotionalPriceCents: number;
}

/** Melhor promoção vigente: ativa, dentro da janela e abaixo do preço base. */
function pickActivePromotion(
  promotions: readonly PromotionRow[],
  basePriceCents: number,
  now: Date,
): PromotionRow | null {
  let best: PromotionRow | null = null;

  for (const promotion of promotions) {
    if (
      promotion.promotionalPriceCents <= 0 ||
      promotion.promotionalPriceCents >= basePriceCents
    ) {
      continue;
    }
    if (!isPromotionActive(promotion, now)) continue;
    if (!best || promotion.promotionalPriceCents < best.promotionalPriceCents) {
      best = promotion;
    }
  }

  return best;
}

export async function createOrderAction(input: unknown): Promise<CreateOrderResult> {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return { ok: false, message: "Entre na sua conta para finalizar o pedido." };
  }

  const parsed = checkoutInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Confira os dados do pedido e tente novamente." };
  }
  const data = parsed.data;

  const settings = await getStoreSettings();
  if (!settings) {
    return {
      ok: false,
      message: "Não foi possível carregar as regras da loja. Tente novamente.",
    };
  }

  if (data.fulfillmentType === "DELIVERY") {
    if (!settings.deliveryEnabled) {
      return { ok: false, message: "A entrega está desativada nesta loja." };
    }
    if (!data.address) {
      return { ok: false, message: "Informe o endereço de entrega." };
    }
  } else {
    if (!settings.pickupEnabled) {
      return { ok: false, message: "A retirada na loja está desativada." };
    }
    if (!data.deliverySlotId) {
      return { ok: false, message: "Escolha uma janela de retirada." };
    }
  }

  const email = data.contactEmail?.trim();
  const notes = data.notes?.trim();

  try {
    const created = await prisma.$transaction(async (transaction) => {
      const now = new Date();
      const productIds = [...new Set(data.items.map((item) => item.productId))];

      const products = await transaction.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          slug: true,
          unit: true,
          active: true,
          prices: {
            where: { storeId: settings.storeId, active: true },
            select: { basePriceCents: true },
            take: 1,
          },
          inventory: {
            where: { storeId: settings.storeId },
            select: { id: true },
            take: 1,
          },
          promotions: {
            where: { storeId: settings.storeId },
            select: {
              promotionalPriceCents: true,
              startsAt: true,
              endsAt: true,
              active: true,
            },
          },
        },
      });

      const productsById = new Map(products.map((product) => [product.id, product]));

      const lines = data.items.map((item) => {
        const product = productsById.get(item.productId);
        if (!product) {
          throw new CheckoutError("Um dos produtos do carrinho não está mais disponível.");
        }
        if (!product.active) {
          throw new CheckoutError(`O produto ${product.name} está indisponível.`);
        }

        const basePriceCents = product.prices[0]?.basePriceCents;
        if (basePriceCents === undefined) {
          throw new CheckoutError(`O produto ${product.name} está sem preço definido.`);
        }

        const inventoryId = product.inventory[0]?.id;
        if (!inventoryId) {
          throw new CheckoutError(`O produto ${product.name} não possui estoque cadastrado.`);
        }

        const promotion = pickActivePromotion(product.promotions, basePriceCents, now);
        const unitPriceCents = resolveEffectivePriceCents({
          basePriceCents,
          promotion,
          now,
        });

        return {
          productId: product.id,
          inventoryId,
          name: product.name,
          unit: product.unit,
          unitPriceCents,
          quantityMilli: item.quantityMilli,
          subtotalCents: calculateLineSubtotalCents(unitPriceCents, item.quantityMilli),
        };
      });

      const subtotalCents = lines.reduce((total, line) => total + line.subtotalCents, 0);

      if (subtotalCents < settings.minimumOrderCents) {
        throw new CheckoutError(
          `O pedido mínimo é de ${formatBRL(settings.minimumOrderCents)}.`,
        );
      }

      const deliveryFeeCents =
        data.fulfillmentType === "DELIVERY"
          ? settings.freeShippingThresholdCents > 0 &&
            subtotalCents >= settings.freeShippingThresholdCents
            ? 0
            : settings.deliveryFeeCents
          : 0;
      const totalCents = subtotalCents + deliveryFeeCents;

      if (data.fulfillmentType === "PICKUP" && data.deliverySlotId) {
        const slot = await transaction.deliverySlot.findFirst({
          where: { id: data.deliverySlotId, storeId: settings.storeId, active: true },
          select: { id: true },
        });
        if (!slot) {
          throw new CheckoutError("A janela de retirada escolhida não está disponível.");
        }
      }

      // Reserva condicional: só avança se ainda houver estoque livre. O UPDATE
      // com guarda em `onHand - reserved` é a barreira contra venda duplicada.
      for (const line of lines) {
        // `updatedAt` recebe um Date como parâmetro (em vez de NOW()) para ser
        // compatível com PostgreSQL (produção/Neon) e SQLite (E2E local).
        const affected = await transaction.$executeRaw`
          UPDATE "Inventory"
          SET "reserved" = "reserved" + ${line.quantityMilli},
              "updatedAt" = ${new Date()}
          WHERE "id" = ${line.inventoryId}
            AND "onHand" - "reserved" >= ${line.quantityMilli}
        `;

        if (affected !== 1) {
          throw new CheckoutError(`Estoque insuficiente para ${line.name}.`);
        }
      }

      let createdOrderNumber: string | null = null;

      for (let attempt = 0; attempt < 8 && createdOrderNumber === null; attempt += 1) {
        const candidate = generateOrderNumber();
        try {
          await transaction.order.create({
            data: {
              orderNumber: candidate,
              customerId: customer.id,
              storeId: settings.storeId,
              fulfillmentType: data.fulfillmentType,
              substitutionPreference: data.substitutionPreference,
              contactName: data.contactName,
              contactPhone: data.contactPhone,
              ...(email ? { contactEmail: email } : {}),
              ...(notes ? { notes } : {}),
              ...(data.address ? { addressSnapshot: { ...data.address } } : {}),
              ...(data.fulfillmentType === "PICKUP" && data.deliverySlotId
                ? { deliverySlotId: data.deliverySlotId }
                : {}),
              subtotalCents,
              deliveryFeeCents,
              totalCents,
              items: {
                create: lines.map((line) => ({
                  productId: line.productId,
                  productNameSnapshot: line.name,
                  unitSnapshot: line.unit,
                  unitPriceCents: line.unitPriceCents,
                  quantity: line.quantityMilli,
                  subtotalCents: line.subtotalCents,
                })),
              },
              statusHistory: {
                create: { toStatus: "RECEIVED", note: "Pedido criado no checkout." },
              },
            },
          });
          createdOrderNumber = candidate;
        } catch (error) {
          if (!isUniqueViolation(error)) throw error;
        }
      }

      if (createdOrderNumber === null) {
        throw new CheckoutError("Não foi possível gerar o número do pedido. Tente novamente.");
      }

      for (const line of lines) {
        await transaction.inventoryMovement.create({
          data: {
            inventoryId: line.inventoryId,
            delta: -line.quantityMilli,
            reason: "RESERVATION",
            reference: createdOrderNumber,
            note: "Reserva de estoque do checkout.",
          },
        });
      }

      return { orderNumber: createdOrderNumber, totalCents };
    });

    revalidatePath("/pedidos");
    revalidatePath("/painel/pedidos");

    return { ok: true, orderNumber: created.orderNumber, totalCents: created.totalCents };
  } catch (error) {
    if (error instanceof CheckoutError) {
      return { ok: false, message: error.message };
    }
    console.error("Falha ao criar o pedido no banco:", error);
    return {
      ok: false,
      message: "Não foi possível registrar o pedido agora. Tente novamente.",
    };
  }
}
