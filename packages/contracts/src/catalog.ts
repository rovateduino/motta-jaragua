import { z } from "zod";
import { centsSchema, idSchema, productUnitSchema } from "./common";

export const categorySchema = z.object({
  id: idSchema,
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido."),
  icon: z.string().trim().max(16).nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
});
export type Category = z.infer<typeof categorySchema>;

export const promotionSchema = z
  .object({
    id: idSchema,
    productId: idSchema,
    storeId: idSchema,
    promotionalPriceCents: centsSchema,
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    maxQuantityPerOrder: z.number().int().min(1).nullable().optional(),
    active: z.boolean().default(true),
  })
  .refine((value) => value.endsAt.getTime() > value.startsAt.getTime(), {
    message: "O fim da promoção deve ser posterior ao início.",
    path: ["endsAt"],
  });
export type Promotion = z.infer<typeof promotionSchema>;

export const productSummarySchema = z.object({
  id: idSchema,
  sku: z.string().trim().min(1).max(64),
  name: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido."),
  categoryId: idSchema,
  unit: productUnitSchema,
  brand: z.string().trim().max(80).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  basePriceCents: centsSchema,
  promotionalPriceCents: centsSchema.nullable().optional(),
  available: z.boolean(),
  active: z.boolean().default(true),
});
export type ProductSummary = z.infer<typeof productSummarySchema>;

export const productListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Categoria inválida.")
    .optional(),
  onlyPromotions: z.coerce.boolean().optional(),
  sort: z.enum(["relevance", "price_asc", "price_desc", "name"]).default("relevance"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(24),
});
export type ProductListQuery = z.infer<typeof productListQuerySchema>;
