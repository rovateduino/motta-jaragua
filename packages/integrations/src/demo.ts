/**
 * Adapters de demonstração.
 *
 * Eles NÃO simulam sucesso: qualquer chamada falha explicitamente com
 * IntegrationNotConfiguredError. Isso evita que o sistema aparente uma
 * integração funcional sem credenciais e teste reais.
 */
import { IntegrationNotConfiguredError } from "./errors";
import type {
  CreateChargeInput,
  CreateChargeResult,
  DeliveryProvider,
  DeliveryQuoteInput,
  DeliveryQuoteResult,
  EmailMessage,
  EmailProvider,
  ErpCatalogItem,
  ErpProvider,
  FiscalOrder,
  FiscalProvider,
  PaymentProvider,
  PaymentWebhookEvent,
  WhatsAppMessage,
  WhatsAppProvider,
} from "./types";

export class UnconfiguredPaymentProvider implements PaymentProvider {
  readonly name = "payment-demo";

  private fail(): never {
    throw new IntegrationNotConfiguredError("Pagamento/Pix", [
      "PAYMENT_PROVIDER",
      "PAYMENT_API_KEY",
      "PAYMENT_WEBHOOK_SECRET",
    ]);
  }

  async createCharge(_input: CreateChargeInput): Promise<CreateChargeResult> {
    return this.fail();
  }

  async getCharge(_reference: string): Promise<CreateChargeResult> {
    return this.fail();
  }

  async refund(_reference: string, _amountCents?: number): Promise<void> {
    this.fail();
  }

  verifyWebhook(_payload: string, _signature: string | null): boolean {
    return this.fail();
  }

  parseWebhook(_payload: string): PaymentWebhookEvent {
    return this.fail();
  }
}

export class UnconfiguredEmailProvider implements EmailProvider {
  readonly name = "email-demo";

  async send(_message: EmailMessage): Promise<{ providerReference: string }> {
    throw new IntegrationNotConfiguredError("E-mail transacional", [
      "EMAIL_PROVIDER",
      "EMAIL_API_KEY",
      "EMAIL_FROM",
    ]);
  }
}

export class UnconfiguredWhatsAppProvider implements WhatsAppProvider {
  readonly name = "whatsapp-demo";

  async sendTemplate(_message: WhatsAppMessage): Promise<{ providerReference: string }> {
    throw new IntegrationNotConfiguredError("WhatsApp", [
      "WHATSAPP_PROVIDER",
      "WHATSAPP_API_TOKEN",
      "WHATSAPP_PHONE_NUMBER_ID",
    ]);
  }
}

export class UnconfiguredFiscalProvider implements FiscalProvider {
  readonly name = "fiscal-demo";

  async issue(_order: FiscalOrder): Promise<{ providerReference: string; accessKey?: string }> {
    throw new IntegrationNotConfiguredError("Emissão fiscal (NFC-e)", [
      "FISCAL_PROVIDER",
      "FISCAL_API_KEY",
    ]);
  }

  async cancel(_reference: string, _reason: string): Promise<void> {
    throw new IntegrationNotConfiguredError("Emissão fiscal (NFC-e)", [
      "FISCAL_PROVIDER",
      "FISCAL_API_KEY",
    ]);
  }
}

export class UnconfiguredErpProvider implements ErpProvider {
  readonly name = "erp-demo";

  async pullCatalog(_since?: Date): Promise<readonly ErpCatalogItem[]> {
    throw new IntegrationNotConfiguredError("ERP/POS", ["ERP_PROVIDER", "ERP_API_KEY"]);
  }

  async pushOrderStatus(_orderNumber: string, _status: string): Promise<void> {
    throw new IntegrationNotConfiguredError("ERP/POS", ["ERP_PROVIDER", "ERP_API_KEY"]);
  }
}

export class UnconfiguredDeliveryProvider implements DeliveryProvider {
  readonly name = "delivery-demo";

  async quote(_input: DeliveryQuoteInput): Promise<DeliveryQuoteResult> {
    throw new IntegrationNotConfiguredError("Entrega/logística", []);
  }

  async createDelivery(
    _orderNumber: string,
    _address: string,
  ): Promise<{ providerReference: string }> {
    throw new IntegrationNotConfiguredError("Entrega/logística", []);
  }
}
