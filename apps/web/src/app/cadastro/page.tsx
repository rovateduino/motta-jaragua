import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { CustomerSignupForm } from "@/components/auth/customer-signup-form";
import { getCurrentCustomer } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Crie sua conta no Mercado Motta Jaraguá.",
  robots: { index: false, follow: false },
};

export default async function SignupPage() {
  const customer = await getCurrentCustomer();
  if (customer) redirect("/conta");

  return (
    <AuthCard
      eyebrow="Nova conta"
      title="Criar conta de cliente"
      description="É rápido e gratuito. Seus dados ficam protegidos e você acompanha cada pedido."
    >
      <CustomerSignupForm />
    </AuthCard>
  );
}
