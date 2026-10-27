"use client";

import type { ReactNode } from "react";
import { Button, Input } from "@motta/ui";

export function AuthField({
  label,
  name,
  type = "text",
  autoComplete,
  placeholder,
  error,
  required = true,
  inputMode,
  minLength,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  inputMode?: "text" | "email" | "tel" | "numeric";
  minLength?: number;
}) {
  const errorId = `${name}-error`;

  return (
    <label className="block text-xs font-bold text-motta-ink">
      {label}
      <span className="mt-1 block">
        <Input
          name={name}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required={required}
          inputMode={inputMode}
          minLength={minLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
      </span>
      {error ? (
        <span id={errorId} className="mt-1 block text-[11px] font-semibold text-motta-red">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function AuthAlert({
  tone,
  children,
}: {
  tone: "error" | "success" | "info";
  children: ReactNode;
}) {
  const styles = {
    error: "border-red-200 bg-red-50 text-motta-red-dark",
    success: "border-green-200 bg-green-50 text-green-800",
    info: "border-amber-200 bg-amber-50 text-amber-900",
  } as const;

  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl border px-3 py-2.5 text-xs font-semibold leading-relaxed ${styles[tone]}`}
    >
      {children}
    </p>
  );
}

export function AuthSubmit({
  pending,
  children,
}: {
  pending: boolean;
  children: ReactNode;
}) {
  return (
    <Button type="submit" fullWidth disabled={pending}>
      {pending ? "Processando..." : children}
    </Button>
  );
}
