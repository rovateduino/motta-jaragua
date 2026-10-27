"use client";

import type { ReactNode } from "react";
import {
  AlertTriangleIcon,
  Badge,
  Card,
  CardBody,
  ChartIcon,
  ClipboardListIcon,
  ClockIcon,
  cn,
  PackageIcon,
  UsersIcon,
  WalletIcon,
} from "@motta/ui";
import { formatBRL } from "@motta/domain";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@motta/domain";

import type { PromotionState } from "@/lib/admin-types";
export type { PromotionState } from "@/lib/admin-types";

const promotionStateLabels: Record<PromotionState, string> = {
  ACTIVE: "Ativa",
  SCHEDULED: "Agendada",
  EXPIRED: "Expirada",
  INACTIVE: "Inativa",
};

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-motta-red">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-motta-ink sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-motta-gray-500">
          {description}
        </p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

/**
 * Os ícones são resolvidos no próprio Client Component a partir de uma string
 * para que o `StatCard` possa ser renderizado por Server Components sem tentar
 * serializar funções através da fronteira Server → Client.
 */
const statCardIcons = {
  clipboard: ClipboardListIcon,
  wallet: WalletIcon,
  alert: AlertTriangleIcon,
  users: UsersIcon,
  package: PackageIcon,
  chart: ChartIcon,
  clock: ClockIcon,
} as const;

export type StatCardIconName = keyof typeof statCardIcons;

export function StatCard({
  label,
  value,
  detail,
  iconName,
  tone = "default",
}: {
  label: string;
  value: string;
  detail?: string;
  iconName: StatCardIconName;
  tone?: "default" | "danger" | "success" | "offer";
}) {
  const tones = {
    default: "bg-motta-gray-100 text-motta-gray-700",
    danger: "bg-red-100 text-motta-red",
    success: "bg-green-100 text-green-700",
    offer: "bg-motta-yellow/40 text-motta-ink",
  } as const;

  const Icon = statCardIcons[iconName];

  return (
    <Card>
      <CardBody className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            tones[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-motta-gray-500">
            {label}
          </p>
          <p className="mt-0.5 text-2xl font-black tracking-tight text-motta-ink">
            {value}
          </p>
          {detail ? (
            <p className="mt-0.5 text-[11px] leading-relaxed text-motta-gray-500">
              {detail}
            </p>
          ) : null}
        </div>
      </CardBody>
    </Card>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const variant =
    status === "CANCELLED" || status === "REFUNDED"
      ? "danger"
      : status === "COMPLETED"
        ? "success"
        : status === "RECEIVED"
          ? "neutral"
          : "offer";
  return <Badge variant={variant}>{ORDER_STATUS_LABELS[status]}</Badge>;
}

export function PromotionStatusBadge({ state }: { state: PromotionState }) {
  const variant =
    state === "ACTIVE"
      ? "success"
      : state === "SCHEDULED"
        ? "offer"
        : state === "EXPIRED"
          ? "danger"
          : "neutral";
  return <Badge variant={variant}>{promotionStateLabels[state]}</Badge>;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card>
      <CardBody className="px-6 py-10 text-center">
        <h2 className="text-lg font-black text-motta-ink">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-motta-gray-500">
          {description}
        </p>
        {action ? <div className="mt-5 flex justify-center gap-2">{action}</div> : null}
      </CardBody>
    </Card>
  );
}

export function Feedback({
  tone,
  children,
}: {
  tone: "success" | "error";
  children: ReactNode;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg px-3 py-2 text-xs font-semibold leading-relaxed",
        tone === "error"
          ? "bg-red-50 text-motta-red-dark"
          : "bg-green-50 text-green-800",
      )}
    >
      {children}
    </p>
  );
}

export function StockBar({
  quantityMilli,
  lowThreshold = 10000,
}: {
  quantityMilli: number;
  lowThreshold?: number;
}) {
  const percentage = Math.min(100, Math.max(2, (quantityMilli / 60000) * 100));
  return (
    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-motta-gray-200">
      <div
        className={cn(
          "h-full rounded-full",
          quantityMilli === 0
            ? "bg-motta-red"
            : quantityMilli <= lowThreshold
              ? "bg-amber-500"
              : "bg-green-600",
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export function money(cents: number): string {
  return formatBRL(cents);
}
