import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthAlert } from "@/components/auth/form-parts";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentAdmin } from "@/lib/auth/session";
import { safeRedirectPath } from "@/lib/auth/validation";
import { isDemo } from "@/lib/env";

export const metadata: Metadata = {
  title: "Entrar no painel",
  description: "Acesso restrito à equipe administrativa do Mercado Motta Jaraguá.",
  robots: { index: false, follow: false },
};

interface AdminLoginPageProps {
  searchParams: Promise<{
    next?: string | string[];
    cadastro?: string | string[];
  }>;
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/painel");

  const params = await searchParams;
  const nextPath = safeRedirectPath(
    Array.isArray(params.next) ? params.next[0] : params.next,
    "/painel",
    "/painel",
  );
  const signupClosed =
    (Array.isArray(params.cadastro) ? params.cadastro[0] : params.cadastro) ===
    "fechado";

  return (
    <AuthCard
      eyebrow="Acesso administrativo"
      title="Entrar no painel"
      description="Use suas credenciais de colaborador. Cada acesso é registrado e limitado pelas permissões do seu papel."
      footer={
        <>
          Voltar para a{" "}
          <Link href="/" className="font-bold text-motta-red hover:underline">
            loja
          </Link>
          {" · "}
          <Link href="/entrar" className="font-bold text-motta-red hover:underline">
            Sou cliente
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        {signupClosed ? (
          <AuthAlert tone="info">
            O cadastro inicial já foi concluído. Solicite um convite a um administrador.
          </AuthAlert>
        ) : null}

        {isDemo ? (
          <div className="rounded-xl border border-motta-gray-200 bg-motta-gray-50 px-3 py-2.5 text-[11px] leading-relaxed text-motta-gray-700">
            <strong className="block font-black text-motta-ink">Contas demo</strong>
            <span className="font-mono">admin@motta.test</span> /{" "}
            <span className="font-mono">Motta@2026!</span> — acesso completo
            <br />
            <span className="font-mono">atendimento@motta.test</span> /{" "}
            <span className="font-mono">Motta@2026!</span> — perfil SUPPORT
          </div>
        ) : null}

        <LoginForm kind="admin" next={nextPath} />
      </div>
    </AuthCard>
  );
}
