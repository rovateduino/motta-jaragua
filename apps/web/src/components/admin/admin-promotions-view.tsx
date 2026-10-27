"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { discountPercentage, formatBRL } from "@motta/domain";
import { buttonStyles, Card, CardBody } from "@motta/ui";
import {
  deleteAdminPromotion,
  saveAdminPromotion,
  setAdminPromotionActive,
} from "@/lib/admin-actions";
import type { AdminProductRecord, AdminPromotionRecord } from "@/lib/admin-types";
import {
  AdminPageHeader,
  EmptyState,
  Feedback,
  PromotionStatusBadge,
} from "@/components/admin/shared";
import { formatAdminDate } from "@/lib/admin-format";

type PromotionState = "ACTIVE" | "SCHEDULED" | "EXPIRED" | "INACTIVE";
type FeedbackState = { tone: "success" | "error"; text: string };

const fieldClass =
  "mt-1 h-11 w-full rounded-xl border border-motta-gray-300 bg-white px-3 text-sm text-motta-ink";

function promotionState(promotion: AdminPromotionRecord, now: Date): PromotionState {
  if (!promotion.active) return "INACTIVE";
  if (new Date(promotion.startsAt) > now) return "SCHEDULED";
  if (new Date(promotion.endsAt) <= now) return "EXPIRED";
  return "ACTIVE";
}

function moneyInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function parseMoney(value: string): number {
  const normalized = value.trim().replace(/[^\d,.-]/g, "");
  return Math.round(Number(normalized.includes(",") ? normalized.replace(/\./g, "").replace(",", ".") : normalized) * 100);
}

function asDateInput(iso: string): string {
  return iso.slice(0, 10);
}

function storeDateInput(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "00";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function addDateDays(value: string, days: number): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, (day ?? 1) + days))
    .toISOString()
    .slice(0, 10);
}

function storeDayBoundary(value: string, endOfDay: boolean): Date {
  const [year, month, day] = value.split("-").map(Number);
  const nextDayStart = Date.UTC(year ?? 0, (month ?? 1) - 1, (day ?? 1) + (endOfDay ? 1 : 0), 3);
  return new Date(nextDayStart - (endOfDay ? 1 : 0));
}

function PromotionForm({
  products,
  promotion,
  onCancel,
}: {
  products: readonly AdminProductRecord[];
  promotion?: AdminPromotionRecord;
  onCancel: () => void;
}) {
  const [productId, setProductId] = useState(promotion?.productId ?? products[0]?.id ?? "");
  const [price, setPrice] = useState(promotion ? moneyInput(promotion.promotionalPriceCents) : "");
  const today = storeDateInput(new Date());
  const [startsAt, setStartsAt] = useState(promotion ? asDateInput(promotion.startsAt) : today);
  const [endsAt, setEndsAt] = useState(promotion ? asDateInput(promotion.endsAt) : addDateDays(today, 7));
  const [conditions, setConditions] = useState(promotion?.conditions ?? "");
  const [maxQuantity, setMaxQuantity] = useState(
    promotion?.maxQuantityPerOrderMilli ? String(promotion.maxQuantityPerOrderMilli / 1000) : "",
  );
  const [active, setActive] = useState(promotion?.active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const promotionalPriceCents = parseMoney(price);
    const maxQuantityPerOrderMilli = maxQuantity.trim()
      ? Math.round(Number(maxQuantity.replace(",", ".")) * 1000)
      : null;
    if (!Number.isSafeInteger(promotionalPriceCents) || promotionalPriceCents <= 0) {
      setError("Informe um preço promocional válido.");
      return;
    }
    if (maxQuantityPerOrderMilli !== null && (!Number.isSafeInteger(maxQuantityPerOrderMilli) || maxQuantityPerOrderMilli < 1)) {
      setError("O limite por pedido deve ser maior que zero.");
      return;
    }
    const startDate = storeDayBoundary(startsAt, false);
    const endDate = storeDayBoundary(endsAt, true);
    if (endDate <= startDate) {
      setError("A data final deve ser igual ou posterior à inicial.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await saveAdminPromotion({
        ...(promotion ? { id: promotion.id } : {}),
        productId,
        promotionalPriceCents,
        startsAt: startDate.toISOString(),
        endsAt: endDate.toISOString(),
        conditions,
        maxQuantityPerOrderMilli,
        active,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      window.location.reload();
    } catch {
      setError("Falha inesperada ao salvar a oferta.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <label className="text-xs font-bold">Produto<select value={productId} onChange={(event) => setProductId(event.target.value)} className={fieldClass}>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {formatBRL(product.basePriceCents)}</option>)}</select></label>
      <label className="text-xs font-bold">Preço promocional (R$)<input inputMode="decimal" required value={price} onChange={(event) => setPrice(event.target.value)} className={fieldClass} /></label>
      <label className="text-xs font-bold">Início<input type="date" required value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className={fieldClass} /></label>
      <label className="text-xs font-bold">Fim<input type="date" required value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className={fieldClass} /></label>
      <label className="text-xs font-bold">Limite por pedido (opcional)<input inputMode="decimal" value={maxQuantity} onChange={(event) => setMaxQuantity(event.target.value)} className={fieldClass} placeholder="Sem limite" /></label>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> Oferta ativa</label>
      <label className="text-xs font-bold sm:col-span-2">Condições<textarea value={conditions} onChange={(event) => setConditions(event.target.value)} maxLength={500} rows={2} className="mt-1 w-full rounded-xl border border-motta-gray-300 p-3 text-sm" /></label>
      {error ? <div className="sm:col-span-2"><Feedback tone="error">{error}</Feedback></div> : null}
      <div className="flex gap-2 sm:col-span-2"><button disabled={submitting || products.length === 0} className={buttonStyles({ variant: "primary" })}>{submitting ? "Salvando…" : promotion ? "Salvar oferta" : "Criar oferta"}</button><button type="button" onClick={onCancel} className={buttonStyles({ variant: "outline" })}>Cancelar</button></div>
    </form>
  );
}

const stateLabels: Record<"ALL" | PromotionState, string> = {
  ALL: "Todas", ACTIVE: "Ativas", SCHEDULED: "Agendadas", EXPIRED: "Expiradas", INACTIVE: "Inativas",
};

export function AdminPromotionsView({
  products,
  promotions,
}: {
  products: readonly AdminProductRecord[];
  promotions: readonly AdminPromotionRecord[];
}) {
  const [filter, setFilter] = useState<"ALL" | PromotionState>("ALL");
  const [formMode, setFormMode] = useState<"NONE" | "CREATE" | string>("NONE");
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const now = new Date();
  const editing = promotions.find((promotion) => promotion.id === formMode);
  const rows = promotions
    .map((promotion) => ({ promotion, state: promotionState(promotion, now) }))
    .filter((row) => filter === "ALL" || row.state === filter)
    .sort((a, b) => new Date(a.promotion.endsAt).getTime() - new Date(b.promotion.endsAt).getTime());

  async function toggle(promotion: AdminPromotionRecord) {
    try {
      const result = await setAdminPromotionActive(promotion.id, !promotion.active);
      setFeedback({ tone: result.ok ? "success" : "error", text: result.message });
      if (result.ok) window.location.reload();
    } catch {
      setFeedback({ tone: "error", text: "Falha inesperada ao alterar a oferta." });
    }
  }

  async function remove(promotion: AdminPromotionRecord) {
    if (!window.confirm(`Excluir a oferta de ${promotion.productName}?`)) return;
    try {
      const result = await deleteAdminPromotion(promotion.id);
      setFeedback({ tone: result.ok ? "success" : "error", text: result.message });
      if (result.ok) window.location.reload();
    } catch {
      setFeedback({ tone: "error", text: "Falha inesperada ao excluir a oferta." });
    }
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader eyebrow="Preços" title="Ofertas e promoções" description="Ofertas persistidas no banco aparecem na vitrine conforme a vigência configurada." actions={<button type="button" onClick={() => setFormMode("CREATE")} disabled={products.length === 0} className={buttonStyles({ variant: "primary" })}>Nova oferta</button>} />
      {feedback ? <Feedback tone={feedback.tone}>{feedback.text}</Feedback> : null}
      {formMode !== "NONE" ? <Card><CardBody className="space-y-4"><h2 className="text-lg font-extrabold">{editing ? "Editar oferta" : "Nova oferta"}</h2><PromotionForm key={formMode} products={products} promotion={editing} onCancel={() => setFormMode("NONE")} /></CardBody></Card> : null}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar ofertas por estado">{(["ALL", "ACTIVE", "SCHEDULED", "EXPIRED", "INACTIVE"] as const).map((state) => <button key={state} type="button" aria-pressed={filter === state} onClick={() => setFilter(state)} className={filter === state ? buttonStyles({ variant: "dark", size: "sm" }) : buttonStyles({ variant: "outline", size: "sm" })}>{stateLabels[state]}</button>)}</div>
      {rows.length === 0 ? <EmptyState title="Nenhuma oferta encontrada" description="Crie uma oferta ou altere o filtro selecionado." /> : <div className="space-y-2">{rows.map(({ promotion, state }) => {
        const discount = promotion.basePriceCents > promotion.promotionalPriceCents ? discountPercentage(promotion.basePriceCents, promotion.promotionalPriceCents) : 0;
        return <Card key={promotion.id}><CardBody className="flex flex-wrap items-center gap-3 p-4">
          <span aria-hidden="true" className="text-2xl">{promotion.emoji}</span>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{promotion.productName}</h2><PromotionStatusBadge state={state} />{discount ? <span className="rounded bg-motta-yellow px-2 text-xs font-black">-{discount}%</span> : null}</div><p className="text-xs text-motta-gray-500">{promotion.sku} · {formatAdminDate(promotion.startsAt)} a {formatAdminDate(promotion.endsAt)}</p><p className="text-sm font-bold">{formatBRL(promotion.promotionalPriceCents)} <span className="text-xs text-motta-gray-500 line-through">{formatBRL(promotion.basePriceCents)}</span></p><p className="text-xs">{promotion.conditions}</p></div>
          <div className="flex flex-wrap gap-1"><Link href={`/produto/${promotion.slug}`} className={buttonStyles({ variant: "ghost", size: "sm" })}>Ver loja</Link><button type="button" onClick={() => setFormMode(promotion.id)} className={buttonStyles({ variant: "outline", size: "sm" })}>Editar</button><button type="button" onClick={() => void toggle(promotion)} className={buttonStyles({ variant: "ghost", size: "sm" })}>{promotion.active ? "Desativar" : "Ativar"}</button><button type="button" onClick={() => void remove(promotion)} className={buttonStyles({ variant: "ghost", size: "sm" })}>Excluir</button></div>
        </CardBody></Card>;
      })}</div>}
    </div>
  );
}
