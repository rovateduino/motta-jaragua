import { DomainError } from "./errors";
import { toCents, type Cents } from "./money";
import { calculateLineSubtotalCents } from "./quantity";

export interface CartLineInput {
  readonly productId: string;
  readonly unitPriceCents: Cents;
  /** Quantidade inteira na escala informada (padrão: milésimos). */
  readonly quantity: number;
  /** Escala da quantidade. Use 1 para unidades inteiras legadas. */
  readonly quantityScale?: number;
  readonly availableQuantity?: number;
  readonly maxQuantityPerOrder?: number;
}

export interface CartLineTotals {
  readonly productId: string;
  readonly unitPriceCents: Cents;
  readonly quantity: number;
  readonly quantityScale: number;
  readonly subtotalCents: Cents;
}

export interface CartTotalsInput {
  readonly lines: readonly CartLineInput[];
  readonly deliveryFeeCents?: Cents;
  readonly discountCents?: Cents;
}

export interface CartTotals {
  readonly lines: readonly CartLineTotals[];
  /** Quantidade total convertida para unidades de venda (pode ser fracionária). */
  readonly itemCount: number;
  /** Quantidade de linhas/produtos distintos no carrinho. */
  readonly lineCount: number;
  readonly subtotalCents: Cents;
  readonly discountCents: Cents;
  readonly deliveryFeeCents: Cents;
  readonly totalCents: Cents;
}

function assertQuantity(quantity: number, productId: string): void {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new DomainError(
      "INVALID_QUANTITY",
      `A quantidade do produto ${productId} deve ser um inteiro maior que zero.`,
    );
  }
}

function assertAvailability(line: CartLineInput): void {
  if (line.availableQuantity !== undefined && line.quantity > line.availableQuantity) {
    throw new DomainError(
      "INVALID_QUANTITY",
      `Estoque insuficiente para o produto ${line.productId}.`,
    );
  }

  if (line.maxQuantityPerOrder !== undefined && line.quantity > line.maxQuantityPerOrder) {
    throw new DomainError(
      "INVALID_QUANTITY",
      `A quantidade máxima por pedido do produto ${line.productId} foi excedida.`,
    );
  }
}

/**
 * Calcula subtotais, desconto, frete e total no servidor.
 * O cliente pode exibir, mas nunca define o valor final.
 */
export function calculateCartTotals({
  lines,
  deliveryFeeCents = 0,
  discountCents = 0,
}: CartTotalsInput): CartTotals {
  const normalizedFee = toCents(deliveryFeeCents);
  const normalizedDiscount = toCents(discountCents);

  const totals = lines.map((line) => {
    assertQuantity(line.quantity, line.productId);
    assertAvailability(line);

    const quantityScale = line.quantityScale ?? 1;
    const unitPriceCents = toCents(line.unitPriceCents);
    return {
      productId: line.productId,
      unitPriceCents,
      quantity: line.quantity,
      quantityScale,
      subtotalCents: calculateLineSubtotalCents(
        unitPriceCents,
        line.quantity,
        quantityScale,
      ),
    } satisfies CartLineTotals;
  });

  const subtotalCents = totals.reduce((sum, line) => sum + line.subtotalCents, 0);
  const itemCount = totals.reduce(
    (count, line) => count + line.quantity / line.quantityScale,
    0,
  );

  if (normalizedDiscount > subtotalCents + normalizedFee) {
    throw new DomainError(
      "INVALID_DISCOUNT",
      "O desconto não pode ser maior que o valor da compra com frete.",
    );
  }

  const totalCents = subtotalCents + normalizedFee - normalizedDiscount;

  return {
    lines: totals,
    itemCount,
    lineCount: totals.length,
    subtotalCents,
    discountCents: normalizedDiscount,
    deliveryFeeCents: normalizedFee,
    totalCents,
  };
}
