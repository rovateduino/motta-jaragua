import "server-only";

import { prisma } from "@motta/db";
import type { OutboxEvent } from "@prisma/client";

/**
 * Worker da outbox: consome `OutboxEvent` pendentes.
 *
 * Fase 5 — infraestrutura base: por enquanto cada evento é apenas logado e
 * marcado como PROCESSED. O efeito real (e-mail, WhatsApp, emissão NFC-e) será
 * ligado por tipo de evento quando os provedores forem escolhidos
 * (docs/FASE-5-PLANEJAMENTO.md, seções 2 a 4).
 *
 * Uso: um job agendado (cron da hospedagem ou rotina do servidor) chama
 * `processPendingOutbox()` periodicamente. As escritas usam guarda de status
 * (`status: PENDING`) para que duas execuções simultâneas não dupliquem
 * nem reprocessem o mesmo evento.
 */

/** Máximo de eventos por execução, para não segurar a request/rotina. */
const BATCH_SIZE = 25;
/** Tentativas antes de mover o evento para FAILED. */
const MAX_ATTEMPTS = 5;
/** Espera base entre tentativas: 1 min, 2 min, 3 min... (linear). */
const RETRY_DELAY_MS = 60_000;

/**
 * Processa os eventos PENDING vencidos e devolve quantos foram concluídos.
 *
 * Em falha: incrementa `attempts`, reagenda `availableAt` com espera crescente
 * e grava `lastError`; ao atingir `MAX_ATTEMPTS` o evento vira FAILED para não
 * ficar em reprocessamento infinito.
 */
export async function processPendingOutbox(): Promise<number> {
  const events = await prisma.outboxEvent.findMany({
    where: { status: "PENDING", availableAt: { lte: new Date() } },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
  });

  let processed = 0;

  for (const event of events) {
    try {
      await handleEvent(event);
      await markAsProcessed(event);
      processed += 1;
    } catch (error) {
      await recordFailure(event, error);
    }
  }

  return processed;
}

/** Processamento de um evento. Hoje: apenas log, sem efeito externo. */
async function handleEvent(event: OutboxEvent): Promise<void> {
  console.log(`Evento processado: ${event.type}`);
}

async function markAsProcessed(event: OutboxEvent): Promise<void> {
  // A guarda em PENDING evita que uma segunda execução simultânea marque
  // duas vezes o mesmo evento.
  await prisma.outboxEvent.updateMany({
    where: { id: event.id, status: "PENDING" },
    data: { status: "PROCESSED", processedAt: new Date() },
  });
}

async function recordFailure(event: OutboxEvent, error: unknown): Promise<void> {
  const attempts = event.attempts + 1;
  const exhausted = attempts >= MAX_ATTEMPTS;
  const message = error instanceof Error ? error.message : String(error);

  await prisma.outboxEvent.updateMany({
    where: { id: event.id, status: "PENDING" },
    data: {
      attempts,
      status: exhausted ? "FAILED" : "PENDING",
      availableAt: new Date(Date.now() + RETRY_DELAY_MS * attempts),
      lastError: message.slice(0, 1000),
    },
  });

  console.error(
    `[outbox] Falha ao processar ${event.type} (${event.id}), ` +
      `tentativa ${attempts}/${MAX_ATTEMPTS}: ${message}`,
  );
}
