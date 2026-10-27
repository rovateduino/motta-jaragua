import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentCustomer } from "@/lib/auth/session";
import { safeRedirectPath } from "@/lib/auth/validation";

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
      <LoginForm kind="customer" next={nextPath} />
    </AuthCard>
  );
}
