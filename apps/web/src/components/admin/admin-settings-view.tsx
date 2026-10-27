"use client";

import { useState, type FormEvent } from "react";
import { buttonStyles, Card, CardBody } from "@motta/ui";
import { saveAdminStoreSettings } from "@/lib/admin-actions";
import type { AdminStoreSettings } from "@/lib/admin-types";
import { AdminPageHeader, Feedback } from "@/components/admin/shared";

const fieldClass =
  "mt-1 h-11 w-full rounded-xl border border-motta-gray-300 bg-white px-3 text-sm text-motta-ink";

function moneyInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function parseMoney(value: string): number {
  const normalized = value.trim().replace(/[^\d,.-]/g, "");
  return Math.round(Number(normalized.includes(",") ? normalized.replace(/\./g, "").replace(",", ".") : normalized) * 100);
}

export function AdminSettingsView({ settings }: { settings: AdminStoreSettings | null }) {
  const [name, setName] = useState(settings?.name ?? "");
  const [addressLine, setAddressLine] = useState(settings?.addressLine ?? "");
  const [district, setDistrict] = useState(settings?.district ?? "");
  const [city, setCity] = useState(settings?.city ?? "");
  const [state, setState] = useState(settings?.state ?? "");
  const [zipCode, setZipCode] = useState(settings?.zipCode ?? "");
  const [phone, setPhone] = useState(settings?.phone ?? "");
  const [deliveryEnabled, setDeliveryEnabled] = useState(settings?.deliveryEnabled ?? true);
  const [pickupEnabled, setPickupEnabled] = useState(settings?.pickupEnabled ?? true);
  const [deliveryFee, setDeliveryFee] = useState(moneyInput(settings?.deliveryFeeCents ?? 0));
  const [freeShipping, setFreeShipping] = useState(moneyInput(settings?.freeShippingThresholdCents ?? 0));
  const [minimumOrder, setMinimumOrder] = useState(moneyInput(settings?.minimumOrderCents ?? 0));
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;
    const deliveryFeeCents = parseMoney(deliveryFee);
    const freeShippingThresholdCents = parseMoney(freeShipping);
    const minimumOrderCents = parseMoney(minimumOrder);
    if ([deliveryFeeCents, freeShippingThresholdCents, minimumOrderCents].some((value) => !Number.isSafeInteger(value) || value < 0)) {
      setFeedback({ ok: false, message: "Confira os valores monetários informados." });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      const result = await saveAdminStoreSettings({
        storeId: settings.storeId,
        name,
        addressLine,
        district,
        city,
        state,
        zipCode,
        phone,
        deliveryEnabled,
        pickupEnabled,
        deliveryFeeCents,
        freeShippingThresholdCents,
        minimumOrderCents,
      });
      setFeedback(result);
      if (result.ok) window.location.reload();
    } catch {
      setFeedback({ ok: false, message: "Falha inesperada ao salvar configurações." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader eyebrow="Ajustes" title="Configurações" description="Dados da loja e regras do checkout persistidos no PostgreSQL." />
      {feedback ? <Feedback tone={feedback.ok ? "success" : "error"}>{feedback.message}</Feedback> : null}
      {!settings ? <Card><CardBody><p className="text-sm text-motta-gray-700">Nenhuma loja ativa foi encontrada no banco.</p></CardBody></Card> : (
        <form onSubmit={submit} className="space-y-4">
          <Card><CardBody className="grid gap-3 sm:grid-cols-2">
            <h2 className="text-lg font-extrabold sm:col-span-2">Dados da loja</h2>
            <label className="text-xs font-bold">Nome<input required value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} /></label>
            <label className="text-xs font-bold">Telefone<input value={phone} onChange={(event) => setPhone(event.target.value)} className={fieldClass} /></label>
            <label className="text-xs font-bold sm:col-span-2">Endereço<input required value={addressLine} onChange={(event) => setAddressLine(event.target.value)} className={fieldClass} /></label>
            <label className="text-xs font-bold">Bairro<input required value={district} onChange={(event) => setDistrict(event.target.value)} className={fieldClass} /></label>
            <label className="text-xs font-bold">Cidade<input required value={city} onChange={(event) => setCity(event.target.value)} className={fieldClass} /></label>
            <label className="text-xs font-bold">UF<input required maxLength={2} value={state} onChange={(event) => setState(event.target.value.toUpperCase())} className={fieldClass} /></label>
            <label className="text-xs font-bold">CEP<input required value={zipCode} onChange={(event) => setZipCode(event.target.value)} className={fieldClass} /></label>
          </CardBody></Card>
          <Card><CardBody className="grid gap-3 sm:grid-cols-3">
            <h2 className="text-lg font-extrabold sm:col-span-3">Regras de pedidos e entrega</h2>
            <label className="text-xs font-bold">Pedido mínimo (R$)<input inputMode="decimal" value={minimumOrder} onChange={(event) => setMinimumOrder(event.target.value)} className={fieldClass} /></label>
            <label className="text-xs font-bold">Taxa de entrega (R$)<input inputMode="decimal" value={deliveryFee} onChange={(event) => setDeliveryFee(event.target.value)} className={fieldClass} /></label>
            <label className="text-xs font-bold">Frete grátis a partir de (R$)<input inputMode="decimal" value={freeShipping} onChange={(event) => setFreeShipping(event.target.value)} className={fieldClass} /></label>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={deliveryEnabled} onChange={(event) => setDeliveryEnabled(event.target.checked)} /> Entrega habilitada</label>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={pickupEnabled} onChange={(event) => setPickupEnabled(event.target.checked)} /> Retirada habilitada</label>
          </CardBody></Card>
          <button type="submit" disabled={submitting} className={buttonStyles({ variant: "primary" })}>{submitting ? "Salvando…" : "Salvar configurações"}</button>
        </form>
      )}
    </div>
  );
}
