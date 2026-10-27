import { z } from "zod";

export const idSchema = z.string().trim().min(1, "Identificador obrigatório.");

/** Valores monetários sempre em centavos inteiros. */
export const centsSchema = z
  .number()
  .int("O valor deve ser inteiro em centavos.")
  .min(0, "O valor não pode ser negativo.");

export const productUnitSchema = z.enum(["UNIT", "KG", "G", "L", "ML", "PACK"]);
export type ProductUnit = z.infer<typeof productUnitSchema>;

export const orderStatusSchema = z.enum([
  "RECEIVED",
  "CONFIRMED",
  "SEPARATING",
  "AWAITING_SUBSTITUTION",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
]);
export type OrderStatusContract = z.infer<typeof orderStatusSchema>;

export const fulfillmentTypeSchema = z.enum(["DELIVERY", "PICKUP"]);
export type FulfillmentType = z.infer<typeof fulfillmentTypeSchema>;

export const substitutionPreferenceSchema = z.enum([
  "DO_NOT_SUBSTITUTE",
  "CONTACT_BEFORE",
  "ACCEPT_EQUIVALENT",
  "REMOVE_ITEM",
]);
export type SubstitutionPreference = z.infer<typeof substitutionPreferenceSchema>;

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type Pagination = z.infer<typeof paginationSchema>;
