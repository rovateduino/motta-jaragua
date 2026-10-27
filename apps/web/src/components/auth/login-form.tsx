"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  loginAdminAction,
  loginCustomerAction,
} from "@/lib/auth/actions";
import { initialAuthState } from "@/lib/auth/validation";
import { AuthAlert, AuthField, AuthSubmit } from "./form-parts";

export function LoginForm({
  kind,
  next,
}: {
  kind: "customer" | "admin";
  next?: string;
}) {
  const action = kind === "admin" ? loginAdminAction : loginCustomerAction;
  const [state, formAction, pending] = useActionState(action, initialAuthState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      {state.error ? <AuthAlert tone="error">{state.error}</AuthAlert> : null}

      <AuthField
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="voce@exemplo.com"
      />
      <AuthField
        label="Senha"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="Sua senha"
      />

      <AuthSubmit pending={pending}>
        {kind === "admin" ? "Entrar no painel" : "Entrar na minha conta"}
      </AuthSubmit>

      <p className="text-center text-xs leading-relaxed text-motta-gray-500">
        {kind === "admin" ? (
          <>
            Acesso restrito à equipe do mercado.{" "}
            <Link href="/admin/cadastro" className="font-bold text-motta-red hover:underline">
              Primeiro acesso administrativo
            </Link>
          </>
        ) : (
          <>
            Ainda não tem conta?{" "}
            <Link href="/cadastro" className="font-bold text-motta-red hover:underline">
              Criar conta
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
