import { describe, expect, it } from "vitest";
import {
  assertTransition,
  canTransition,
  isTerminal,
  nextStatuses,
  ORDER_STATUSES,
  type OrderStatus,
} from "./order-status";
import { DomainError } from "./errors";

describe("order status", () => {
  it("permite o fluxo de entrega", () => {
    const flow: OrderStatus[] = [
      "RECEIVED",
      "CONFIRMED",
      "SEPARATING",
      "OUT_FOR_DELIVERY",
      "COMPLETED",
    ];

    for (let index = 0; index < flow.length - 1; index += 1) {
      expect(canTransition(flow[index]!, flow[index + 1]!)).toBe(true);
    }
  });

  it("permite o fluxo de retirada", () => {
    const flow: OrderStatus[] = [
      "RECEIVED",
      "CONFIRMED",
      "SEPARATING",
      "READY_FOR_PICKUP",
      "COMPLETED",
    ];

    for (let index = 0; index < flow.length - 1; index += 1) {
      expect(canTransition(flow[index]!, flow[index + 1]!)).toBe(true);
    }
  });

  it("permite ida e volta para substituição", () => {
    expect(canTransition("SEPARATING", "AWAITING_SUBSTITUTION")).toBe(true);
    expect(canTransition("AWAITING_SUBSTITUTION", "SEPARATING")).toBe(true);
  });

  it("bloqueia saltos e retrocessos indevidos", () => {
    expect(canTransition("RECEIVED", "COMPLETED")).toBe(false);
    expect(canTransition("COMPLETED", "SEPARATING")).toBe(false);
    expect(canTransition("REFUNDED", "RECEIVED")).toBe(false);
    expect(() => assertTransition("RECEIVED", "COMPLETED")).toThrow(DomainError);
  });

  it("permite reembolso após conclusão ou cancelamento", () => {
    expect(canTransition("COMPLETED", "REFUNDED")).toBe(true);
    expect(canTransition("CANCELLED", "REFUNDED")).toBe(true);
  });

  it("não permite cancelar pedido já entregue", () => {
    expect(canTransition("OUT_FOR_DELIVERY", "CANCELLED")).toBe(false);
    expect(canTransition("COMPLETED", "CANCELLED")).toBe(false);
  });

  it("marca estados terminais corretamente", () => {
    expect(isTerminal("COMPLETED")).toBe(true);
    expect(isTerminal("CANCELLED")).toBe(true);
    expect(isTerminal("REFUNDED")).toBe(true);
    expect(isTerminal("SEPARATING")).toBe(false);
  });

  it("tem transições declaradas para todos os estados", () => {
    for (const status of ORDER_STATUSES) {
      expect(Array.isArray(nextStatuses(status))).toBe(true);
    }
  });
});
