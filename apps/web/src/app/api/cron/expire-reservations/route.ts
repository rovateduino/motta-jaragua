import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@motta/db";

export const dynamic = "force-dynamic";

/** Reserva válida por 30 minutos; depois disso o pedido não pago é cancelado. */
const RESERVATION_TTL_MS = 30 * 60 * 1000;
const MAX_ORDERS_PER_RUN = 100;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    return request.headers.get("authorization") === `Bearer ${secret}`;
  }
  // Sem segredo configurado, a rota só fica aberta fora de produção (dev/E2E).
  return process.env.NODE_ENV !== "production";
}

/**
 * Cancela um pedido RECEIVED antigo e libera a reserva de estoque.
 *
 * A transação relê o pedido com guarda de status/data, então execuções
 * concorrentes do cron não cancelam nem liberam estoque duas vezes.
 */
async function expireOrder(orderId: string): Promise<"expired" | "skipped"> {
  return prisma.$transaction(async (transaction) => {
    const now = new Date();
    const cutoff = new Date(now.getTime() - RESERVATION_TTL_MS);

    const order = await transaction.order.findFirst({
      where: {
        id: orderId,
        status: "RECEIVED",
        paymentStatus: "PENDING",
        deletedAt: null,
        createdAt: { lt: cutoff },
      },
      select: {
        id: true,
        orderNumber: true,
        storeId: true,
        createdAt: true,
        items: {
          select: {
            productId: true,
            quantity: true,
            productNameSnapshot: true,
          },
        },
      },
    });
    if (!order) return "skipped";

    const changed = await transaction.order.updateMany({
      where: {
        id: order.id,
        status: "RECEIVED",
        paymentStatus: "PENDING",
        deletedAt: null,
      },
      data: { status: "CANCELLED", cancelledAt: now },
    });
    if (changed.count !== 1) return "skipped";

    let releasedItems = 0;

    for (const item of order.items) {
      if (!item.productId) continue;

      const inventory = await transaction.inventory.findUnique({
        where: {
          storeId_productId: {
            storeId: order.storeId,
            productId: item.productId,
          },
        },
        select: { id: true, reserved: true },
      });
      if (!inventory) {
        console.error(
          `Reserva expirada sem estoque encontrado: pedido ${order.orderNumber}, produto ${item.productNameSnapshot}.`,
        );
        continue;
      }

      // Libera no máximo o que está reservado. Se o dado já estiver
      // inconsistente (reserved < quantidade), não deixa o valor negativo.
      const release = Math.min(inventory.reserved, item.quantity);
      if (release <= 0) continue;

      const affected = await transaction.$executeRaw`
        UPDATE "Inventory"
        SET "reserved" = "reserved" - ${release},
            "updatedAt" = ${now}
        WHERE "id" = ${inventory.id}
          AND "reserved" >= ${release}
      `;
      if (affected !== 1) continue;

      await transaction.inventoryMovement.create({
        data: {
          inventoryId: inventory.id,
          delta: release,
          reason: "RELEASE",
          reference: order.orderNumber,
          note: "Liberação automática por expiração da reserva (30 minutos).",
        },
      });
      releasedItems += 1;
    }

    await transaction.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: "RECEIVED",
        toStatus: "CANCELLED",
        note: "Cancelado automaticamente: reserva expirada após 30 minutos sem pagamento.",
      },
    });

    await transaction.auditLog.create({
      data: {
        actorType: "SYSTEM",
        action: "order.reservation_expired",
        entityType: "Order",
        entityId: order.id,
        before: {
          status: "RECEIVED",
          paymentStatus: "PENDING",
          createdAt: order.createdAt.toISOString(),
        },
        after: {
          status: "CANCELLED",
          cancelledAt: now.toISOString(),
          reason: "RESERVATION_EXPIRED",
          releasedItems,
        },
      },
    });

    return "expired";
  });
}

/**
 * Cron de expiração de reservas — GET /api/cron/expire-reservations.
 *
 * O plano Hobby da Vercel permite apenas um Cron Job por dia, então o
 * `vercel.json` agenda uma execução diária de segurança (03:00 UTC). A rotina
 * de 10 em 10 minutos em produção é disparada por um serviço externo
 * (cron-job.org), que envia o mesmo `Authorization: Bearer $CRON_SECRET`.
 *
 * Em produção, sem o segredo configurado, responde 503 em vez de expor a rota.
 */
export async function GET(request: Request): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: "Não autorizado." },
      { status: 401 },
    );
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() - RESERVATION_TTL_MS);

  try {
    const candidates = await prisma.order.findMany({
      where: {
        status: "RECEIVED",
        paymentStatus: "PENDING",
        deletedAt: null,
        createdAt: { lt: cutoff },
      },
      orderBy: { createdAt: "asc" },
      take: MAX_ORDERS_PER_RUN,
      select: { id: true },
    });

    let expired = 0;
    let skipped = 0;
    const failures: string[] = [];

    for (const candidate of candidates) {
      try {
        const result = await expireOrder(candidate.id);
        if (result === "expired") expired += 1;
        else skipped += 1;
      } catch (error) {
        console.error(
          `Falha ao expirar a reserva do pedido ${candidate.id}`,
          error,
        );
        failures.push(candidate.id);
      }
    }

    if (expired > 0) {
      revalidatePath("/painel");
      revalidatePath("/painel/pedidos");
      revalidatePath("/painel/entregas");
      revalidatePath("/pedidos");
    }

    return NextResponse.json({
      ok: true,
      checkedAt: now.toISOString(),
      cutoff: cutoff.toISOString(),
      candidates: candidates.length,
      expired,
      skipped,
      failures,
    });
  } catch (error) {
    console.error("Falha ao executar a expiração de reservas", error);
    return NextResponse.json(
      { ok: false, error: "Não foi possível expirar as reservas." },
      { status: 500 },
    );
  }
}
