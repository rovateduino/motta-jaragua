import { DomainError } from "./errors";

export const ORDER_STATUSES = [
  "RECEIVED",
  "CONFIRMED",
  "SEPARATING",
  "AWAITING_SUBSTITUTION",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  RECEIVED: "Recebido",
  CONFIRMED: "Confirmado",
  SEPARATING: "Em separação",
  AWAITING_SUBSTITUTION: "Aguardando substituição",
  READY_FOR_PICKUP: "Pronto para retirada",
  OUT_FOR_DELIVERY: "Saiu para entrega",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  RECEIVED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SEPARATING", "CANCELLED"],
  SEPARATING: [
    "AWAITING_SUBSTITUTION",
    "READY_FOR_PICKUP",
    "OUT_FOR_DELIVERY",
    "CANCELLED",
  ],
  AWAITING_SUBSTITUTION: [
    "SEPARATING",
    "READY_FOR_PICKUP",
    "OUT_FOR_DELIVERY",
    "CANCELLED",
  ],
  READY_FOR_PICKUP: ["COMPLETED", "CANCELLED"],
  OUT_FOR_DELIVERY: ["COMPLETED"],
  COMPLETED: ["REFUNDED"],
  CANCELLED: ["REFUNDED"],
  REFUNDED: [],
};

const TERMINAL_STATUSES: readonly OrderStatus[] = ["COMPLETED", "CANCELLED", "REFUNDED"];

export function nextStatuses(status: OrderStatus): readonly OrderStatus[] {
  return TRANSITIONS[status];
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw new DomainError(
      "INVALID_ORDER_TRANSITION",
      `Transição de pedido inválida: ${ORDER_STATUS_LABELS[from]} -> ${ORDER_STATUS_LABELS[to]}.`,
    );
  }
}

export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}
