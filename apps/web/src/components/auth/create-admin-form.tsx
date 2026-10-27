"use client";

import { useActionState, useEffect, useRef } from "react";
import { createAdminAction } from "@/lib/auth/actions";
import { initialAuthState } from "@/lib/auth/validation";
import { AuthAlert, AuthField, AuthSubmit } from "./form-parts";

export interface AssignableRole {
  id: string;
  name: string;
  description: string | null;
}

export function CreateAdminForm({ roles }: { roles: AssignableRole[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    createAdminAction,
    initialAuthState,
  );

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {state.error ? <AuthAlert tone="error">{state.error}</AuthAlert> : null}
      {state.success ? <AuthAlert tone="success">{state.success}</AuthAlert> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <AuthField
          label="Nome"
          name="name"
          autoComplete="off"
          placeholder="Nome do colaborador"
          error={state.fieldErrors?.name}
        />
        <AuthField
          label="E-mail"
          name="email"
          type="email"
          autoComplete="off"
          inputMode="email"
          placeholder="colaborador@motta.com.br"
          error={state.fieldErrors?.email}
        />
      </div>
      <AuthField
        label="Senha inicial"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="Mínimo de 10 caracteres"
        minLength={10}
        error={state.fieldErrors?.password}
      />

      <fieldset className="space-y-2">
        <legend className="text-xs font-bold text-motta-ink">Papéis e permissões</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {roles.map((role) => (
            <label
              key={role.id}
              className="flex items-start gap-2 rounded-xl border border-motta-gray-200 bg-white p-3 text-xs leading-relaxed"
            >
              <input
                type="checkbox"
                name="roleIds"
                value={role.id}
                className="mt-0.5 h-4 w-4 shrink-0 accent-motta-red"
              />
              <span>
                <strong className="block font-black text-motta-ink">{role.name}</strong>
                <span className="text-motta-gray-500">
                  {role.description ?? "Sem descrição."}
                </span>
              </span>
            </label>
          ))}
        </div>
        {state.fieldErrors?.roleIds ? (
          <p className="text-[11px] font-semibold text-motta-red">
            {state.fieldErrors.roleIds}
          </p>
        ) : null}
      </fieldset>

      <AuthSubmit pending={pending}>Criar acesso administrativo</AuthSubmit>
    </form>
  );
}
