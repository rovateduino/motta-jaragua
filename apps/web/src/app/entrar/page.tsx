import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentCustomer } from "@/lib/auth/session";
import { safeRedirectPath } from "@/lib/auth/validation";
import { isDemo } from "@/lib/env";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse sua conta do Mercado Motta Jaraguá.",
  robots: { index: false, follow: false },
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const customer = await getCurrentCustomer();
  if (customer) redirect("/conta");

  const { next } = await searchParams;
  const nextPath = safeRedirectPath(
    Array.isArray(next) ? next[0] : next,
    "/conta",
  );

  return (
    <AuthCard
      eyebrow="Conta do cliente"
      title="Entrar na sua conta"
      description="Acompanhe pedidos, salve seus dados e finalize compras com mais agilidade."
      footer={
        <>
          É da equipe Motta?{" "}
          <Link href="/admin/entrar" className="font-bold text-motta-red hover:underline">
            Acessar o painel administrativo
          </Link>
        </>
      }
    >
      {isDemo ? (
        <div className="mb-4 rounded-xl border border-motta-gray-200 bg-motta-gray-50 px-3 py-2 text-[11px] leading-relaxed text-motta-gray-700">
          <strong className="font-black text-motta-ink">Conta demo:</strong>{" "}
          <span className="font-mono">cliente@motta.test</span> /{" "}
          <span className="font-mono">Motta@2026!</span>
        </div>
      ) : null}
      <LoginForm kind="customer" next={nextPath} />
    </AuthCard>
  );
}
