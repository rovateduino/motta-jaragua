import { DomainError } from "./errors";
import { toCents, type Cents } from "./money";

export interface PromotionWindow {
  readonly promotionalPriceCents: Cents;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly active: boolean;
}

export interface PriceInput {
  readonly basePriceCents: Cents;
  readonly promotion?: PromotionWindow | null;
  readonly now?: Date;
}

export function isPromotionActive(
  promotion: PromotionWindow,
  now: Date = new Date(),
): boolean {
  if (!promotion.active) return false;
  if (promotion.endsAt.getTime() <= promotion.startsAt.getTime()) return false;
  const timestamp = now.getTime();
  return timestamp >= promotion.startsAt.getTime() && timestamp < promotion.endsAt.getTime();
}

/**
 * Resolve o preço efetivo. Uma promoção só vale se estiver ativa, dentro da
 * janela e realmente menor que o preço base. O preço do cliente nunca é
 * autoridade final: esta função deve rodar no servidor.
 */
export function resolveEffectivePriceCents({
  basePriceCents,
  promotion,
  now = new Date(),
}: PriceInput): Cents {
  const base = toCents(basePriceCents);

  if (!promotion || !isPromotionActive(promotion, now)) {
    return base;
  }

  const promotional = toCents(promotion.promotionalPriceCents);
  if (promotional >= base) {
    throw new DomainError(
      "INVALID_PRICE",
      "O preço promocional deve ser menor que o preço base.",
    );
  }

  return promotional;
}

export function discountPercentage(basePriceCents: Cents, effectivePriceCents: Cents): number {
  const base = toCents(basePriceCents);
  const effective = toCents(effectivePriceCents);

  if (base === 0) return 0;
  if (effective > base) {
    throw new DomainError("INVALID_PRICE", "O preço efetivo não pode ser maior que o preço base.");
  }

  return Math.round(((base - effective) / base) * 100);
}
