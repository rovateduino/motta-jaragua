export type PaymentMethod = "PIX" | "CARD" | "BOLETO";
export type ExternalPaymentStatus = "PENDING" | "AUTHORIZED" | "PAID" | "FAILED" | "REFUNDED" | "CANCELLED";

export interface PaymentCustomer {
  readonly name: string;
  readonly email: string;
  readonly phone?: string;
  readonly document?: string;
}

export interface CreateChargeInput {
  readonly orderId: string;
  readonly amountCents: number;
  readonly method: PaymentMethod;
  readonly description: string;
  readonly customer: PaymentCustomer;
  readonly idempotencyKey: string;
}

export interface CreateChargeResult {
  readonly providerReference: string;
  readonly status: ExternalPaymentStatus;
  readonly checkoutUrl?: string;
  readonly pixQrCode?: string;
  readonly expiresAt?: Date;
}

export interface PaymentWebhookEvent {
  readonly providerReference: string;
  readonly status: ExternalPaymentStatus;
  readonly amountCents: number;
  readonly raw: unknown;
}

/** Nenhum dado de cartão trafega ou é armazenado pela aplicação. */
export interface PaymentProvider {
  readonly name: string;
  createCharge(input: CreateChargeInput): Promise<CreateChargeResult>;
  getCharge(providerReference: string): Promise<CreateChargeResult>;
  refund(providerReference: string, amountCents?: number): Promise<void>;
  verifyWebhook(payload: string, signature: string | null): boolean;
  parseWebhook(payload: string): PaymentWebhookEvent;
}

export interface EmailMessage {
  readonly to: string;
  readonly subject: string;
  readonly template: string;
  readonly data: Readonly<Record<string, string>>;
}

export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<{ providerReference: string }>;
}

export interface WhatsAppMessage {
  readonly to: string;
  readonly template: string;
  readonly variables: Readonly<Record<string, string>>;
}

export interface WhatsAppProvider {
  readonly name: string;
  sendTemplate(message: WhatsAppMessage): Promise<{ providerReference: string }>;
}

export interface FiscalOrderItem {
  readonly sku: string;
  readonly name: string;
  readonly quantity: number;
  readonly unitPriceCents: number;
}

export interface FiscalOrder {
  readonly orderNumber: string;
  readonly totalCents: number;
  readonly items: readonly FiscalOrderItem[];
}

export interface FiscalProvider {
  readonly name: string;
  issue(order: FiscalOrder): Promise<{ providerReference: string; accessKey?: string }>;
  cancel(providerReference: string, reason: string): Promise<void>;
}

export interface ErpCatalogItem {
  readonly sku: string;
  readonly name: string;
  readonly ean?: string;
  readonly unit: string;
  readonly priceCents: number;
  readonly stockQuantity: number;
}

export interface ErpProvider {
  readonly name: string;
  pullCatalog(since?: Date): Promise<readonly ErpCatalogItem[]>;
  pushOrderStatus(orderNumber: string, status: string): Promise<void>;
}

export interface DeliveryQuoteInput {
  readonly zipCode: string;
  readonly subtotalCents: number;
}

export interface DeliveryQuoteResult {
  readonly available: boolean;
  readonly feeCents?: number;
  readonly estimatedMinutes?: number;
}

export interface DeliveryProvider {
  readonly name: string;
  quote(input: DeliveryQuoteInput): Promise<DeliveryQuoteResult>;
  createDelivery(orderNumber: string, address: string): Promise<{ providerReference: string }>;
}
