import { describe, expect, it } from "vitest";
import {
  applyPercentage,
  formatBRL,
  multiplyCents,
  parseBRLToCents,
  sumCents,
  toCents,
} from "./money";
import { DomainError } from "./errors";

describe("money", () => {
  it("converte reais para centavos", () => {
    expect(parseBRLToCents("12,34")).toBe(1234);
    expect(parseBRLToCents("R$ 1.234,56")).toBe(123456);
    expect(parseBRLToCents("0,99")).toBe(99);
    expect(parseBRLToCents("10")).toBe(1000);
    expect(parseBRLToCents("10.5")).toBe(1050);
  });

  it("rejeita valores inválidos", () => {
    expect(() => parseBRLToCents("")).toThrow(DomainError);
    expect(() => parseBRLToCents("abc")).toThrow(DomainError);
    expect(() => parseBRLToCents("1,234")).toThrow(DomainError);
    expect(() => parseBRLToCents("-1,00")).toThrow(DomainError);
  });

  it("formata centavos em BRL", () => {
    // Intl usa espaço não separável (U+00A0) após "R$"; normalizamos na asserção.
    const normalize = (value: string) => value.replace(/\u00a0/g, " ");
    expect(normalize(formatBRL(1234))).toBe("R$ 12,34");
    expect(normalize(formatBRL(0))).toBe("R$ 0,00");
    expect(normalize(formatBRL(123456))).toBe("R$ 1.234,56");
  });

  it("soma e multiplica centavos", () => {
    expect(sumCents([100, 250, 3])).toBe(353);
    expect(multiplyCents(199, 3)).toBe(597);
    expect(() => multiplyCents(199, 1.5)).toThrow(DomainError);
  });

  it("aplica percentual arredondando", () => {
    expect(applyPercentage(1000, 10)).toBe(100);
    expect(applyPercentage(999, 10)).toBe(100);
    expect(() => applyPercentage(1000, 101)).toThrow(DomainError);
  });

  it("rejeita centavos não inteiros", () => {
    expect(() => toCents(10.5)).toThrow(DomainError);
    expect(() => toCents(-1)).toThrow(DomainError);
  });
});
