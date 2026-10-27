import { z } from "zod";
import {
  centsSchema,
  fulfillmentTypeSchema,
  idSchema,
  orderStatusSchema,
  substitutionPreferenceSchema,
} from "./common";

export const orderItemSchema = z.object({
  id: idSchema,
  productId: idSchema.nullable(),
  productNameSnapshot: z.string().trim().min(1),
  unitSnapshot: z.string().trim().min(1),
  unitPriceCents: centsSchema,
  quantity: z.number().int().min(1),
  subtotalCents: centsSchema,
});
export type OrderItem = z.infer<typeof orderItemSchema>;

export const orderSummarySchema = z.object({
  id: idSchema,
  orderNumber: z.string().trim().min(4),
  status: orderStatusSchema,
  fulfillmentType: fulfillmentTypeSchema,
  substitutionPreference: substitutionPreferenceSchema,
  subtotalCents: centsSchema,
  discountCents: centsSchema,
  deliveryFeeCents: centsSchema,
  totalCents: centsSchema,
  createdAt: z.coerce.date(),
});
export type OrderSummary = z.infer<typeof orderSummarySchema>;

export const orderStatusTransitionSchema = z.object({
  to: orderStatusSchema,
  note: z.string().trim().max(500).optional(),
});
export type OrderStatusTransition = z.infer<typeof orderStatusTransitionSchema>;
