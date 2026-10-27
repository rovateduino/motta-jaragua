/**
 * Cria os acessos administrativos usados APENAS pelos testes E2E.
 *
 * Por que existe: o seed de demonstração não cria mais contas de administrador
 * (risco de segurança). Os testes automatizados, porém, precisam de um ADMIN e
 * de um SUPPORT conhecidos, então o `scripts/setup-test-db.ts` chama este
 * arquivo logo depois do seed.
 *
 * Trava de segurança: só executa quando `DATABASE_URL` aponta para um arquivo
 * SQLite (`file:`), ou seja, o banco temporário dos testes. Nunca toca no
 * PostgreSQL/Neon.
 *
 * Uso: npx tsx scripts/seed-test-admins.ts (com DATABASE_URL de teste)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Hash Argon2id da senha fictícia "Motta@2026!" — exclusiva do ambiente de teste. */
const TEST_PASSWORD_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$yLkKDZEvdowPNZZvxrXfNg$OWFLnkZ5C1/mAhmrdPmDxYlq5vXDjf9Q0SJvSpY5kx4";

const testAdmins = [
  { name: "Administrador Motta", email: "admin@motta.test", role: "ADMIN" },
  { name: "Atendimento Motta", email: "atendimento@motta.test", role: "SUPPORT" },
] as const;

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  if (!databaseUrl.startsWith("file:")) {
    throw new Error(
      "Este script cria contas demo e só pode rodar no SQLite de teste (DATABASE_URL iniciando com file:).",
    );
  }

  for (const admin of testAdmins) {
    const row = await prisma.adminUser.upsert({
      where: { email: admin.email },
      update: {
        name: admin.name,
        passwordHash: TEST_PASSWORD_HASH,
        active: true,
      },
      create: {
        name: admin.name,
        email: admin.email,
        passwordHash: TEST_PASSWORD_HASH,
        active: true,
      },
    });

    const role = await prisma.role.findUnique({
      where: { name: admin.role },
      select: { id: true },
    });
    if (!role) {
      throw new Error(`Papel ${admin.role} não encontrado. Rode o seed antes deste script.`);
    }

    await prisma.adminUserRole.deleteMany({ where: { adminUserId: row.id } });
    await prisma.adminUserRole.create({
      data: { adminUserId: row.id, roleId: role.id },
    });
  }

  console.log(`Acessos de teste criados: ${testAdmins.map((admin) => admin.email).join(", ")}`);
}

main()
  .catch((error: unknown) => {
    console.error("Falha ao criar os acessos de teste:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
