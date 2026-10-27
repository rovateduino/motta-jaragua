import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Webhook de confirmação de pagamento.
 *
 * Fase 5 — infraestrutura base: a rota recebe o POST, valida a assinatura HMAC
 * e responde. A gravação de `Payment`/`Order` chega quando o provedor de
 * pagamento for escolhido (docs/FASE-5-PLANEJAMENTO.md, seção 1.3).
 *
 * Contrato esperado do provedor:
 * - header `x-webhook-signature` (ou `x-signature`) com o hash, aceitando os
 *   formatos `sha256=<hex>`, `ts=...,v1=<hex>` ou apenas o hex;
 * - hash = HMAC-SHA256 do corpo bruto, assinado com `PAYMENT_WEBHOOK_SECRET`.
 *
 * Respostas:
 * - 200 assinatura válida;
 * - 401 assinatura ausente ou inválida;
 * - 503 segredo ainda não configurado (o provedor reenvia quando a variável
 *   existir, então o evento não é perdido em produção).
 */

export const runtime = "nodejs";

const SIGNATURE_HEADERS = ["x-webhook-signature", "x-signature"] as const;

function readSignature(request: NextRequest): string | null {
  for (const header of SIGNATURE_HEADERS) {
    const raw = request.headers.get(header);
    if (!raw) continue;

    const parts = raw.split(",").map((part) => part.trim());
    for (const part of parts) {
      const separator = part.indexOf("=");
      if (separator === -1) {
        if (part) return part;
        continue;
      }
      const key = part.slice(0, separator).toLowerCase();
      const value = part.slice(separator + 1).trim();
      if (!value) continue;
      if (parts.length === 1 || key === "v1" || key === "sha256" || key === "signature") {
        return value;
      }
    }
  }
  return null;
}

function isValidSignature(body: string, secret: string, signature: string): boolean {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(signature.toLowerCase(), "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) {
    console.error(
      "[webhook] PAYMENT_WEBHOOK_SECRET não configurado; recusando o evento até a credencial existir.",
    );
    return NextResponse.json(
      { ok: false, error: "Webhook não configurado." },
      { status: 503 },
    );
  }

  const signature = readSignature(request);
  const body = await request.text();

  if (!signature || !isValidSignature(body, secret, signature)) {
    console.warn("[webhook] Assinatura ausente ou inválida; evento recusado.");
    return NextResponse.json(
      { ok: false, error: "Assinatura inválida." },
      { status: 401 },
    );
  }

  // Etapa 1: apenas validação. Próximo passo é idempotência por
  // Payment.providerReference + transação com OutboxEvent.
  console.log(`[webhook] Assinatura válida (${body.length} bytes recebidos).`);
  return NextResponse.json({ ok: true });
}
