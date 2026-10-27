/**
 * Desativa as contas demo de administrador e encerra as sessões abertas.
 *
 * Contexto: o seed antigo criava `admin@motta.test` e `atendimento@motta.test`
 * com senha pública. O seed não as cria mais, mas bancos que já rodaram o seed
 * (produção/Neon, por exemplo) ainda guardam o hash. Este script corrige isso
 * sem apagar o registro, apenas marcando `active = false` e derrubando sessões.
 *
 * Uso (carregando o .env da raiz):
 *   npx dotenv -e .env -- npx tsx scripts/disable-demo-admins.ts
 *
 * Ou, se as variáveis já estiverem no ambiente:
 *   npx tsx scripts/disable-demo-admins.ts
 *
 * O script é idempotente: pode ser executado quantas vezes for necessário.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_ADMIN_EMAILS = ["admin@motta.test", "atendimento@motta.test"] as const;

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL não definida. Rode com o .env da raiz: npx dotenv -e .env -- npx tsx scripts/disable-demo-admins.ts",
    );
  }

  const results: string[] = [];

  for (const email of DEMO_ADMIN_EMAILS) {
    const admin = await prisma.adminUser.findUnique({
      where: { email },
      select: { id: true, active: true },
    });

    if (!admin) {
      results.push(`${email}: não encontrada neste banco`);
      continue;
    }

    if (admin.active) {
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: { active: false },
      });
    }

    const sessions = await prisma.authSession.deleteMany({
      where: { adminUserId: admin.id },
    });

    results.push(
      `${email}: ${admin.active ? "desativada" : "já estava desativada"} · sessões encerradas: ${sessions.count}`,
    );
  }

  console.log("Contas demo de administrador:");
  for (const line of results) {
    console.log(`  ${line}`);
  }
  console.log("Concluído. O histórico e o hash permanecem no banco apenas para auditoria.");
}

main()
  .catch((error: unknown) => {
    console.error("Falha ao desativar as contas demo:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
