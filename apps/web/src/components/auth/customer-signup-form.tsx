"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupCustomerAction } from "@/lib/auth/actions";
import { initialAuthState } from "@/lib/auth/validation";
import { AuthAlert, AuthField, AuthSubmit } from "./form-parts";

export function CustomerSignupForm() {
  const [state, formAction, pending] = useActionState(
    signupCustomerAction,
    initialAuthState,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <AuthAlert tone="error">{state.error}</AuthAlert> : null}
      {state.fieldErrors?.form ? (
        <AuthAlert tone="error">{state.fieldErrors.form}</AuthAlert>
      ) : null}

      <AuthField
        label="Nome completo"
        name="name"
        autoComplete="name"
        placeholder="Como podemos chamar você?"
        error={state.fieldErrors?.name}
      />
      <AuthField
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="voce@exemplo.com"
        error={state.fieldErrors?.email}
      />
      <AuthField
        label="Telefone / WhatsApp (opcional)"
        name="phone"
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        placeholder="(48) 99999-0000"
        required={false}
        error={state.fieldErrors?.phone}
      />
      <AuthField
        label="Senha"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="Mínimo de 10 caracteres"
        minLength={10}
        error={state.fieldErrors?.password}
      />
      <AuthField
        label="Confirmar senha"
        name="passwordConfirmation"
        type="password"
        autoComplete="new-password"
        placeholder="Repita a senha"
        minLength={10}
        error={state.fieldErrors?.passwordConfirmation}
      />

      <div className="space-y-2 rounded-xl bg-motta-gray-50 p-3 text-[11px] leading-relaxed text-motta-gray-700">
        <label className="flex items-start gap-2 font-semibold">
          <input
            type="checkbox"
            name="terms"
            required
            className="mt-0.5 h-4 w-4 shrink-0 accent-motta-red"
          />
          <span>
            Li e aceito os termos de uso e a política de privacidade da loja.
          </span>
        </label>
        {state.fieldErrors?.terms ? (
          <p className="font-semibold text-motta-red">{state.fieldErrors.terms}</p>
        ) : null}
        <label className="flex items-start gap-2 font-semibold">
          <input
            type="checkbox"
            name="marketingConsent"
            className="mt-0.5 h-4 w-4 shrink-0 accent-motta-red"
          />
          <span>Quero receber ofertas e novidades por e-mail.</span>
        </label>
      </div>

      <AuthSubmit pending={pending}>Criar minha conta</AuthSubmit>

      <p className="text-center text-xs leading-relaxed text-motta-gray-500">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-bold text-motta-red hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
