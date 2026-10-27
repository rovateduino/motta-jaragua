import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(5, "Informe um e-mail válido.")
  .max(254, "E-mail muito longo.")
  .email("Informe um e-mail válido.");

const passwordSchema = z
  .string()
  .min(10, "Use pelo menos 10 caracteres.")
  .max(128, "A senha deve ter no máximo 128 caracteres.")
  .regex(/[A-Za-z]/, "Inclua ao menos uma letra.")
  .regex(/\d/, "Inclua ao menos um número.");

export const customerLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe a senha.").max(128),
});

export const adminLoginSchema = customerLoginSchema;

export const customerSignupSchema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome.").max(120),
    email: emailSchema,
    phone: z
      .string()
      .trim()
      .max(20)
      .regex(/^[0-9()+\-\s]*$/, "Telefone inválido.")
      .optional()
      .transform((value) => value || undefined),
    password: passwordSchema,
    passwordConfirmation: z.string().min(1, "Confirme a senha."),
    marketingConsent: z.boolean(),
    terms: z.literal(true, {
      error: "É necessário aceitar os termos para criar a conta.",
    }),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    message: "As senhas não conferem.",
    path: ["passwordConfirmation"],
  });

export const adminBootstrapSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome.").max(120),
    email: emailSchema,
    password: passwordSchema,
    passwordConfirmation: z.string().min(1, "Confirme a senha."),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    message: "As senhas não conferem.",
    path: ["passwordConfirmation"],
  });

export const createAdminSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(120),
  email: emailSchema,
  password: passwordSchema,
  roleIds: z.array(z.string().min(1)).min(1, "Selecione ao menos um papel."),
});

export const adminIdsSchema = z
  .array(z.string().trim().min(1))
  .min(1)
  .max(200);

export const updateAdminRolesSchema = z.object({
  id: z.string().trim().min(1),
  roleIds: z.array(z.string().min(1)).min(1, "Selecione ao menos um papel."),
});

export const setAdminActiveSchema = z.object({
  id: z.string().trim().min(1),
  active: z.boolean(),
});

export type AuthActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
};

export const initialAuthState: AuthActionState = {};

export function fieldErrorsFromZod(
  error: z.ZodError,
): Record<string, string> {
  const flattened = z.flattenError(error);
  const errors: Record<string, string> = {};

  for (const [key, messages] of Object.entries(flattened.fieldErrors)) {
    const message = Array.isArray(messages) ? messages[0] : undefined;
    if (message) errors[key] = message;
  }

  for (const message of flattened.formErrors) {
    errors.form = message;
  }

  return errors;
}

export function safeRedirectPath(
  value: unknown,
  fallback: string,
  allowedPrefix?: string,
): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  if (allowedPrefix && !value.startsWith(allowedPrefix)) {
    return fallback;
  }

  return value;
}
