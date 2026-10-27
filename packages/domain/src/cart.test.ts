import { describe, expect, it } from "vitest";
import { calculateCartTotals } from "./cart";
import { DomainError } from "./errors";

describe("cart", () => {
  it("calcula subtotais, frete e total", () => {
    const totals = calculateCartTotals({
      lines: [
        { productId: "arroz", unitPriceCents: 2490, quantity: 2 },
        { productId: "feijao", unitPriceCents: 890, quantity: 3 },
      ],
      deliveryFeeCents: 990,
      discountCents: 500,
    });

    expect(totals.itemCount).toBe(5);
    expect(totals.lineCount).toBe(2);
    expect(totals.subtotalCents).toBe(2490 * 2 + 890 * 3);
    expect(totals.deliveryFeeCents).toBe(990);
    expect(totals.discountCents).toBe(500);
    expect(totals.totalCents).toBe(2490 * 2 + 890 * 3 + 990 - 500);
    expect(totals.lines).toHaveLength(2);
  });

  it("calcula linhas com quantidade em milésimos", () => {
    const totals = calculateCartTotals({
      lines: [
        {
          productId: "picanha",
          unitPriceCents: 7990,
          quantity: 500,
          quantityScale: 1000,
          availableQuantity: 18000,
        },
        {
          productId: "arroz",
          unitPriceCents: 2190,
          quantity: 2000,
          quantityScale: 1000,
          maxQuantityPerOrder: 5000,
        },
      ],
    });

    expect(totals.lineCount).toBe(2);
    expect(totals.itemCount).toBe(2.5);
    expect(totals.lines[0]?.subtotalCents).toBe(3995);
    expect(totals.lines[1]?.subtotalCents).toBe(4380);
    expect(totals.subtotalCents).toBe(8375);
  });

  it("aceita carrinho vazio", () => {
    const totals = calculateCartTotals({ lines: [] });
    expect(totals.itemCount).toBe(0);
    expect(totals.lineCount).toBe(0);
    expect(totals.subtotalCents).toBe(0);
    expect(totals.totalCents).toBe(0);
  });

  it("rejeita quantidade inválida", () => {
    expect(() =>
      calculateCartTotals({
        lines: [{ productId: "x", unitPriceCents: 100, quantity: 0 }],
      }),
    ).toThrow(DomainError);

    expect(() =>
      calculateCartTotals({
        lines: [{ productId: "x", unitPriceCents: 100, quantity: 1.5 }],
      }),
    ).toThrow(DomainError);
  });

  it("rejeita estoque insuficiente", () => {
    expect(() =>
      calculateCartTotals({
        lines: [{ productId: "x", unitPriceCents: 100, quantity: 3, availableQuantity: 2 }],
      }),
    ).toThrow(DomainError);
  });

  it("rejeita limite por pedido excedido", () => {
    expect(() =>
      calculateCartTotals({
        lines: [{ productId: "x", unitPriceCents: 100, quantity: 3, maxQuantityPerOrder: 2 }],
      }),
    ).toThrow(DomainError);
  });

  it("rejeita desconto maior que a compra", () => {
    expect(() =>
      calculateCartTotals({
        lines: [{ productId: "x", unitPriceCents: 100, quantity: 1 }],
        discountCents: 101,
      }),
    ).toThrow(DomainError);
  });

  it("rejeita frete negativo", () => {
    expect(() =>
      calculateCartTotals({
        lines: [{ productId: "x", unitPriceCents: 100, quantity: 1 }],
        deliveryFeeCents: -1,
      }),
    ).toThrow(DomainError);
  });
});
