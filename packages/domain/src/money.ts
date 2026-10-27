import { DomainError } from "./errors";

/**
 * Valores monetários são sempre inteiros em centavos.
 * Nunca usar ponto flutuante para dinheiro.
 */
export type Cents = number;

function assertIntegerCents(value: number, label = "valor"): void {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new DomainError(
      "INVALID_MONEY",
      `O ${label} deve ser um número inteiro de centavos.`,
    );
  }
}

export function toCents(value: Cents): Cents {
  assertIntegerCents(value);
  if (value < 0) {
    throw new DomainError("INVALID_MONEY", "O valor em centavos não pode ser negativo.");
  }
  return value;
}

/**
 * Converte uma string em reais (ex.: "12,34", "R$ 1.234,56" ou "12.34")
 * para centavos. Aceita apenas até duas casas decimais.
 */
export function parseBRLToCents(input: string): Cents {
  const trimmed = input.trim();
  if (trimmed === "") {
    throw new DomainError("INVALID_MONEY", "Informe um valor monetário.");
  }

  const withoutCurrency = trimmed.replace(/^R\$\s?/i, "").replace(/\s/g, "");
  const normalized = withoutCurrency.includes(",")
    ? withoutCurrency.replace(/\./g, "").replace(",", ".")
    : withoutCurrency;

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new DomainError("INVALID_MONEY", `Valor monetário inválido: "${input}".`);
  }

  const [reaisPart = "0", decimalsPart = ""] = normalized.split(".");
  const reais = Number(reaisPart);
  const decimals = Number(decimalsPart.padEnd(2, "0"));

  assertIntegerCents(reais, "valor em reais");
  assertIntegerCents(decimals, "valor em centavos");

  return toCents(reais * 100 + decimals);
}

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formata centavos como moeda brasileira: 1234 -> "R$ 12,34". */
export function formatBRL(cents: Cents): string {
  return brlFormatter.format(toCents(cents) / 100);
}

export function sumCents(values: readonly Cents[]): Cents {
  return values.reduce((total, value) => total + toCents(value), 0);
}

export function multiplyCents(cents: Cents, quantity: number): Cents {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new DomainError("INVALID_QUANTITY", "A quantidade deve ser um inteiro não negativo.");
  }
  return toCents(cents) * quantity;
}

/** Aplica desconto percentual arredondando para o centavo mais próximo. */
export function applyPercentage(cents: Cents, percentage: number): Cents {
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    throw new DomainError("INVALID_DISCOUNT", "O percentual deve estar entre 0 e 100.");
  }
  return Math.round((toCents(cents) * percentage) / 100);
}
