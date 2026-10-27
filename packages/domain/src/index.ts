export {
  DomainError,
  type DomainErrorCode,
} from "./errors";
export {
  applyPercentage,
  formatBRL,
  multiplyCents,
  parseBRLToCents,
  sumCents,
  toCents,
  type Cents,
} from "./money";
export {
  discountPercentage,
  isPromotionActive,
  resolveEffectivePriceCents,
  type PriceInput,
  type PromotionWindow,
} from "./pricing";
export {
  calculateCartTotals,
  type CartLineInput,
  type CartLineTotals,
  type CartTotals,
  type CartTotalsInput,
} from "./cart";
export {
  assertQuantityMilli,
  calculateLineSubtotalCents,
  clampQuantityMilli,
  formatQuantity,
  formatUnitPriceSuffix,
  QUANTITY_SCALE,
  type ClampQuantityOptions,
  type SaleUnit,
} from "./quantity";
export {
  normalizeSearchText,
  rankProducts,
  searchScore,
  type CatalogSort,
  type SearchableProduct,
} from "./search";
export {
  assertTransition,
  canTransition,
  isTerminal,
  nextStatuses,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "./order-status";
