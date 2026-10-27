export type DomainErrorCode =
  | "INVALID_MONEY"
  | "INVALID_QUANTITY"
  | "PROMOTION_NOT_ACTIVE"
  | "INVALID_PRICE"
  | "INVALID_ORDER_TRANSITION"
  | "INVALID_DISCOUNT"
  | "INVALID_DELIVERY_FEE";

export class DomainError extends Error {
  readonly code: DomainErrorCode;

  constructor(code: DomainErrorCode, message: string) {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }
}
