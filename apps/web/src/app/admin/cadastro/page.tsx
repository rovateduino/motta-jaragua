import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@motta/db";
import { AdminBootstrapForm } from "@/components/auth/admin-bootstrap-form";
import { AuthCard } from "@/components/auth/auth-card";
import { getCurrentAdmin } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Primeiro acesso administrativo",
  description: "Cadastro do primeiro administrador do Mercado Motta Jaraguá.",
  robots: { index: false, follow: false },
};

export default async function AdminBootstrapPage() {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/painel");

  const adminCount = await prisma.adminUser.count();
  if (adminCount > 0) redirect("/admin/entrar?cadastro=fechado");

  return (
    <AuthCard
      eyebrow="Configuração inicial"
      title="Criar primeiro administrador"
      description="Esta tela fica disponível apenas enquanto o painel não possui nenhum acesso administrativo."
      footer={
        <>
          Já possui acesso?{" "}
          <Link href="/admin/entrar" className="font-bold text-motta-red hover:underline">
            Entrar no painel
          </Link>
        </>
      }
    >
      <AdminBootstrapForm />
    </AuthCard>
  );
}
