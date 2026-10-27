"use client";

import { useState, type FormEvent } from "react";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@motta/domain";
import { buttonStyles } from "@motta/ui";
import { updateAdminOrderStatus } from "@/lib/admin-actions";
import { Feedback } from "@/components/admin/shared";

export function AdminOrderStatusForm({
  orderNumber,
  currentStatus,
  allowedStatuses,
}: {
  orderNumber: string;
  currentStatus: OrderStatus;
  allowedStatuses: readonly OrderStatus[];
}) {
  const [nextStatus, setNextStatus] = useState<OrderStatus | "">(allowedStatuses[0] ?? "");
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nextStatus) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const result = await updateAdminOrderStatus({ orderNumber, nextStatus, note });
      setFeedback(result);
      if (result.ok) window.location.reload();
    } catch {
      setFeedback({ ok: false, message: "Falha inesperada ao atualizar o pedido." });
    } finally {
      setSubmitting(false);
    }
  }

  if (allowedStatuses.length === 0) {
    return <p className="text-xs text-motta-gray-500">Este pedido está em um status final e não permite novas transições.</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-xs text-motta-gray-700">Status atual: <strong>{ORDER_STATUS_LABELS[currentStatus]}</strong></p>
      <label className="block text-xs font-bold">
        Próximo status
        <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value as OrderStatus)} className="mt-1 h-10 w-full rounded-lg border border-motta-gray-300 bg-white px-2 text-sm">
          {allowedStatuses.map((status) => <option key={status} value={status}>{ORDER_STATUS_LABELS[status]}</option>)}
        </select>
      </label>
      <label className="block text-xs font-bold">
        Observação (opcional)
        <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={2} className="mt-1 w-full rounded-lg border border-motta-gray-300 p-2 text-sm" />
      </label>
      {feedback ? <Feedback tone={feedback.ok ? "success" : "error"}>{feedback.message}</Feedback> : null}
      <button type="submit" disabled={!nextStatus || submitting} className={buttonStyles({ variant: "primary", size: "sm" })}>
        {submitting ? "Atualizando…" : "Registrar transição"}
      </button>
    </form>
  );
}
