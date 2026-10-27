import { z } from "zod";
import {
  centsSchema,
  fulfillmentTypeSchema,
  idSchema,
  substitutionPreferenceSchema,
} from "./common";

export const addressSchema = z.object({
  recipient: z.string().trim().min(2, "Informe o nome de quem recebe.").max(120),
  phone: z
    .string()
    .trim()
    .min(10, "Telefone inválido.")
    .max(20)
    .regex(/^[0-9()+\-\s]+$/, "Telefone inválido."),
  zipCode: z
    .string()
    .trim()
    .regex(/^\d{5}-?\d{3}$/, "CEP deve ter 8 dígitos."),
  street: z.string().trim().min(2, "Informe a rua.").max(160),
  number: z.string().trim().min(1, "Informe o número.").max(20),
  complement: z.string().trim().max(80).optional(),
  district: z.string().trim().min(2, "Informe o bairro.").max(80),
  city: z.string().trim().min(2, "Informe a cidade.").max(80),
  state: z
    .string()
    .trim()
    .length(2, "Use a sigla do estado (ex.: SC).")
    .transform((value) => value.toUpperCase()),
});
export type Address = z.infer<typeof addressSchema>;

export const cartLineSchema = z.object({
  productId: idSchema,
  quantity: z.number().int("Quantidade deve ser inteira.").min(1, "Quantidade mínima é 1."),
});
export type CartLine = z.infer<typeof cartLineSchema>;

export const checkoutQuoteRequestSchema = z
  .object({
    storeId: idSchema,
    fulfillmentType: fulfillmentTypeSchema,
    items: z.array(cartLineSchema).min(1, "O carrinho está vazio."),
    address: addressSchema.optional(),
    deliverySlotId: idSchema.optional(),
    substitutionPreference: substitutionPreferenceSchema.default("CONTACT_BEFORE"),
    couponCode: z.string().trim().max(40).optional(),
  })
  .superRefine((value, context) => {
    if (value.fulfillmentType === "DELIVERY" && !value.address) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["address"],
        message: "Endereço é obrigatório para entrega.",
      });
    }
    if (value.fulfillmentType === "PICKUP" && !value.deliverySlotId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deliverySlotId"],
        message: "Escolha uma janela de retirada.",
      });
    }
  });
export type CheckoutQuoteRequest = z.infer<typeof checkoutQuoteRequestSchema>;

export const checkoutQuoteResponseSchema = z.object({
  subtotalCents: centsSchema,
  discountCents: centsSchema,
  deliveryFeeCents: centsSchema,
  totalCents: centsSchema,
  itemCount: z.number().int().min(0),
  coverage: z.enum(["AVAILABLE", "UNAVAILABLE", "PENDING"]),
  warnings: z.array(z.string()),
});
export type CheckoutQuoteResponse = z.infer<typeof checkoutQuoteResponseSchema>;

export const createOrderRequestSchema = checkoutQuoteRequestSchema.and(
  z.object({
    contactName: z.string().trim().min(2).max(120),
    contactPhone: z.string().trim().min(10).max(20),
    contactEmail: z.string().trim().email().optional(),
    notes: z.string().trim().max(500).optional(),
    idempotencyKey: z.string().trim().min(8).max(120),
  }),
);
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;
