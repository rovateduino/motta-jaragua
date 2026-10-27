import { describe, expect, it } from "vitest";
import { discountPercentage, isPromotionActive, resolveEffectivePriceCents } from "./pricing";
import { DomainError } from "./errors";

const now = new Date("2026-10-24T12:00:00.000Z");

function promotion(overrides: Partial<Parameters<typeof isPromotionActive>[0]> = {}) {
  return {
    promotionalPriceCents: 899,
    startsAt: new Date("2026-10-01T00:00:00.000Z"),
    endsAt: new Date("2026-10-31T23:59:59.000Z"),
    active: true,
    ...overrides,
  };
}

describe("pricing", () => {
  it("considera promoção ativa dentro da janela", () => {
    expect(isPromotionActive(promotion(), now)).toBe(true);
  });

  it("considera promoção inativa fora da janela ou desativada", () => {
    expect(isPromotionActive(promotion({ endsAt: new Date("2026-10-23T00:00:00.000Z") }), now)).toBe(false);
    expect(isPromotionActive(promotion({ startsAt: new Date("2026-10-25T00:00:00.000Z") }), now)).toBe(false);
    expect(isPromotionActive(promotion({ active: false }), now)).toBe(false);
  });

  it("rejeita janela invertida", () => {
    expect(
      isPromotionActive(
        promotion({
          startsAt: new Date("2026-10-30T00:00:00.000Z"),
          endsAt: new Date("2026-10-01T00:00:00.000Z"),
        }),
        now,
      ),
    ).toBe(false);
  });

  it("resolve o menor preço vigente", () => {
    expect(resolveEffectivePriceCents({ basePriceCents: 1099, promotion: promotion(), now })).toBe(899);
    expect(resolveEffectivePriceCents({ basePriceCents: 1099, now })).toBe(1099);
  });

  it("ignora promoção expirada", () => {
    expect(
      resolveEffectivePriceCents({
        basePriceCents: 1099,
        promotion: promotion({ endsAt: new Date("2026-10-23T00:00:00.000Z") }),
        now,
      }),
    ).toBe(1099);
  });

  it("rejeita promoção maior ou igual ao preço base", () => {
    expect(() =>
      resolveEffectivePriceCents({
        basePriceCents: 500,
        promotion: promotion({ promotionalPriceCents: 500 }),
        now,
      }),
    ).toThrow(DomainError);
  });

  it("calcula percentual de desconto", () => {
    expect(discountPercentage(1000, 800)).toBe(20);
    expect(discountPercentage(0, 0)).toBe(0);
    expect(() => discountPercentage(1000, 1200)).toThrow(DomainError);
  });
});
