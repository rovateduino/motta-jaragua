import { describe, expect, it } from "vitest";
import { addressSchema, checkoutQuoteRequestSchema, productSummarySchema } from "./index";

const address = {
  recipient: "Cliente de Demonstração",
  phone: "(48) 99999-0000",
  zipCode: "89254-000",
  street: "Rua Demonstrativa",
  number: "100",
  district: "Centro",
  city: "Jaraguá do Sul",
  state: "sc",
};

describe("contracts de checkout", () => {
  it("valida entrega com endereço", () => {
    const result = checkoutQuoteRequestSchema.safeParse({
      storeId: "store-demo",
      fulfillmentType: "DELIVERY",
      items: [{ productId: "p1", quantity: 2 }],
      address,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.address?.state).toBe("SC");
      expect(result.data.substitutionPreference).toBe("CONTACT_BEFORE");
    }
  });

  it("exige endereço para entrega", () => {
    const result = checkoutQuoteRequestSchema.safeParse({
      storeId: "store-demo",
      fulfillmentType: "DELIVERY",
      items: [{ productId: "p1", quantity: 1 }],
    });

    expect(result.success).toBe(false);
  });

  it("exige janela para retirada", () => {
    const result = checkoutQuoteRequestSchema.safeParse({
      storeId: "store-demo",
      fulfillmentType: "PICKUP",
      items: [{ productId: "p1", quantity: 1 }],
    });

    expect(result.success).toBe(false);
  });

  it("rejeita carrinho vazio", () => {
    const result = checkoutQuoteRequestSchema.safeParse({
      storeId: "store-demo",
      fulfillmentType: "PICKUP",
      items: [],
      deliverySlotId: "slot-1",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita CEP inválido", () => {
    expect(addressSchema.safeParse({ ...address, zipCode: "123" }).success).toBe(false);
  });
});

describe("contracts de catálogo", () => {
  it("valida produto com preço em centavos", () => {
    const result = productSummarySchema.safeParse({
      id: "p1",
      sku: "ARR-001",
      name: "Arroz Tipo 1 5kg",
      slug: "arroz-tipo-1-5kg",
      categoryId: "mercearia",
      unit: "UNIT",
      basePriceCents: 2490,
      available: true,
    });

    expect(result.success).toBe(true);
  });

  it("rejeita preço fracionado", () => {
    const result = productSummarySchema.safeParse({
      id: "p1",
      sku: "ARR-001",
      name: "Arroz Tipo 1 5kg",
      slug: "arroz-tipo-1-5kg",
      categoryId: "mercearia",
      unit: "UNIT",
      basePriceCents: 24.9,
      available: true,
    });

    expect(result.success).toBe(false);
  });
});
