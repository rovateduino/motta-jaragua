import { DomainError } from "./errors";
import { toCents, type Cents } from "./money";

/**
 * Quantidades são inteiras em milésimos da unidade de venda.
 * 1 unidade = 1000; 500 g = 500 (quando a unidade de venda é o kg).
 */
export const QUANTITY_SCALE = 1000;

export type SaleUnit = "UNIT" | "KG" | "G" | "L" | "ML" | "PACK";

const quantityFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 3,
});

const unitLabels: Record<SaleUnit, { singular: string; plural: string; priceSuffix: string }> = {
  UNIT: { singular: "un", plural: "un", priceSuffix: "por unidade" },
  KG: { singular: "kg", plural: "kg", priceSuffix: "por kg" },
  G: { singular: "g", plural: "g", priceSuffix: "por g" },
  L: { singular: "L", plural: "L", priceSuffix: "por litro" },
  ML: { singular: "ml", plural: "ml", priceSuffix: "por ml" },
  PACK: { singular: "pacote", plural: "pacotes", priceSuffix: "por pacote" },
};

export function assertQuantityMilli(quantity: number, productId?: string): void {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new DomainError(
      "INVALID_QUANTITY",
      productId
        ? `A quantidade do produto ${productId} deve ser um inteiro não negativo em milésimos.`
        : "A quantidade deve ser um inteiro não negativo em milésimos.",
    );
  }
}

/** Formata a quantidade para exibição: 1500 -> "1,5 kg"; 2000 -> "2 un". */
export function formatQuantity(quantityMilli: number, unit: SaleUnit): string {
  assertQuantityMilli(quantityMilli);
  const value = quantityMilli / QUANTITY_SCALE;
  const labels = unitLabels[unit];
  const label = value === 1 ? labels.singular : labels.plural;
  return `${quantityFormatter.format(value)} ${label}`;
}

/** Rótulo do preço unitário: "por unidade", "por kg" etc. */
export function formatUnitPriceSuffix(unit: SaleUnit): string {
  return unitLabels[unit].priceSuffix;
}

/**
 * Subtotal de uma linha, arredondado ao centavo mais próximo (meio para cima).
 * Usa aritmética inteira para não introduzir erro de ponto flutuante.
 */
export function calculateLineSubtotalCents(
  unitPriceCents: Cents,
  quantityMilli: number,
  scale: number = QUANTITY_SCALE,
): Cents {
  assertQuantityMilli(quantityMilli);
  if (!Number.isInteger(scale) || scale <= 0) {
    throw new DomainError(
      "INVALID_QUANTITY",
      "A escala de quantidade deve ser um inteiro positivo.",
    );
  }
  return toCents(
    Math.floor((toCents(unitPriceCents) * quantityMilli + scale / 2) / scale),
  );
}

export interface ClampQuantityOptions {
  readonly min: number;
  readonly max: number;
  readonly step: number;
}

/** Ajusta a quantidade ao passo, mínimo e máximo permitidos. */
export function clampQuantityMilli(
  quantityMilli: number,
  { min, max, step }: ClampQuantityOptions,
): number {
  for (const [label, value] of [
    ["mínimo", min],
    ["máximo", max],
    ["passo", step],
  ] as const) {
    if (!Number.isInteger(value) || value <= 0) {
      throw new DomainError(
        "INVALID_QUANTITY",
        `O ${label} de quantidade deve ser um inteiro positivo em milésimos.`,
      );
    }
  }

  if (max < min) return 0;

  const numeric = Number.isFinite(quantityMilli) ? quantityMilli : min;
  const stepped = Math.round(numeric / step) * step;
  return Math.min(max, Math.max(min, stepped));
}
