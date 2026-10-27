import { describe, expect, it } from "vitest";
import {
  calculateLineSubtotalCents,
  clampQuantityMilli,
  formatQuantity,
  formatUnitPriceSuffix,
} from "./quantity";

describe("quantidade em milésimos", () => {
  it("formata unidades e pesos", () => {
    expect(formatQuantity(1000, "UNIT")).toBe("1 un");
    expect(formatQuantity(3000, "UNIT")).toBe("3 un");
    expect(formatQuantity(500, "KG")).toBe("0,5 kg");
    expect(formatQuantity(1250, "KG")).toBe("1,25 kg");
    expect(formatQuantity(1000, "L")).toBe("1 L");
  });

  it("expõe o sufixo do preço unitário", () => {
    expect(formatUnitPriceSuffix("UNIT")).toBe("por unidade");
    expect(formatUnitPriceSuffix("KG")).toBe("por kg");
    expect(formatUnitPriceSuffix("PACK")).toBe("por pacote");
  });

  it("calcula subtotal proporcional arredondando ao centavo", () => {
    expect(calculateLineSubtotalCents(599, 500)).toBe(300);
    expect(calculateLineSubtotalCents(7990, 500)).toBe(3995);
    expect(calculateLineSubtotalCents(1290, 250)).toBe(323);
    expect(calculateLineSubtotalCents(2490, 1000)).toBe(2490);
  });

  it("ajusta ao passo, mínimo e máximo", () => {
    expect(clampQuantityMilli(520, { min: 500, max: 3000, step: 500 })).toBe(500);
    expect(clampQuantityMilli(700, { min: 500, max: 3000, step: 500 })).toBe(500);
    expect(clampQuantityMilli(800, { min: 500, max: 3000, step: 500 })).toBe(1000);
    expect(clampQuantityMilli(9000, { min: 500, max: 3000, step: 500 })).toBe(3000);
    expect(clampQuantityMilli(1000, { min: 1000, max: 500, step: 1000 })).toBe(0);
  });

  it("rejeita quantidade inválida", () => {
    expect(() => formatQuantity(-1, "UNIT")).toThrow();
    expect(() => clampQuantityMilli(1000, { min: 0, max: 3000, step: 500 })).toThrow();
    expect(() => calculateLineSubtotalCents(100, 1.5)).toThrow();
  });
});
