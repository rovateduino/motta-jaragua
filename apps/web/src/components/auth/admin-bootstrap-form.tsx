"use client";

import { useActionState } from "react";
import { bootstrapAdminAction } from "@/lib/auth/actions";
import { initialAuthState } from "@/lib/auth/validation";
import { AuthAlert, AuthField, AuthSubmit } from "./form-parts";

export function AdminBootstrapForm() {
  const [state, formAction, pending] = useActionState(
    bootstrapAdminAction,
    initialAuthState,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <AuthAlert tone="error">{state.error}</AuthAlert> : null}
      {state.fieldErrors?.form ? (
        <AuthAlert tone="error">{state.fieldErrors.form}</AuthAlert>
      ) : null}

      <AuthAlert tone="info">
        Este cadastro só funciona enquanto o painel não tiver nenhum administrador.
        A primeira conta recebe o papel ADMIN.
      </AuthAlert>

      <AuthField
        label="Nome completo"
        name="name"
        autoComplete="name"
        placeholder="Nome do responsável"
        error={state.fieldErrors?.name}
      />
      <AuthField
        label="E-mail administrativo"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="voce@mercadomotta.com.br"
        error={state.fieldErrors?.email}
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

      <AuthSubmit pending={pending}>Criar primeiro administrador</AuthSubmit>
    </form>
  );
}
