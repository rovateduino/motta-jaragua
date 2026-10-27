/**
 * Script de setup do banco de dados SQLite para testes E2E locais.
 *
 * O que faz:
 * 1. Remove test.db antigo (se existir)
 * 2. Gera o Prisma Client com o schema SQLite (schema.sqlite.prisma)
 * 3. Roda prisma db push para criar as tabelas no SQLite
 * 4. Roda o seed (adaptado p/ SQLite: remove skipDuplicates, não suportado no SQLite)
 * 5. Limpa o arquivo temporário de seed
 *
 * Uso: npx tsx scripts/setup-test-db.ts
 *
 * Após os testes, o Prisma Client fica configurado para SQLite.
 * Para voltar ao PostgreSQL (Neon), rode:
 *   npm run db:generate -w @motta/db
 *
 * @motta/db/test.db é ignorado pelo git (.gitignore linha 26).
 */
import { execSync } from "child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { join, resolve } from "path";

const root = resolve(process.cwd());
const prismaDir = join(root, "packages/db/prisma");
const dbPath = join(prismaDir, "test.db");
const schemaSqlite = join(prismaDir, "schema.sqlite.prisma");
const seedSource = join(prismaDir, "seed.ts");
const seedSqliteTemp = join(prismaDir, "seed.sqlite.temp.ts");
// Prisma no Windows exige forward slashes na URL file://
const databaseUrl = `file:${dbPath.replace(/\\/g, "/")}`;

function run(command: string): void {
  console.log(`> ${command}`);
  execSync(command, {
    cwd: join(root, "packages/db"),
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      DIRECT_URL: databaseUrl,
    },
  });
}

async function main(): Promise<void> {
  // 1. Remove banco antigo para garantir estado limpo
  if (existsSync(dbPath)) {
    unlinkSync(dbPath);
    console.log("🗑  test.db existente removido.");
  }

  // 2. Gera Prisma Client com schema SQLite
  console.log("📦 Gerando Prisma Client (SQLite)...");
  run(`npx prisma generate --schema "${schemaSqlite}"`);

  // 3. Push do schema (cria tabelas no SQLite)
  console.log("🏗  Push do schema para SQLite...");
  run(`npx prisma db push --schema "${schemaSqlite}"`);

  // 4. Cria seed adaptado p/ SQLite (skipDuplicates não existe em createMany do SQLite)
  console.log("📝 Preparando seed adaptado para SQLite...");
  const seedCode = existingSeedCode();
  const adapted = seedCode.replace(/skipDuplicates: true(,)?\r?\n/g, "");
  writeFileSync(seedSqliteTemp, adapted);

  // 5. Roda o seed adaptado
  console.log("🌱 Rodando seed (SQLite)...");
  run(`npx tsx "${seedSqliteTemp}"`);

  // 6. Remove o temp file
  if (existsSync(seedSqliteTemp)) {
    unlinkSync(seedSqliteTemp);
  }

  console.log(`\n✅ Banco de teste SQLite pronto: ${dbPath}`);
  console.log("   Variáveis injetadas: DATABASE_URL e DIRECT_URL apontando para o SQLite.");
}

function existingSeedCode(): string {
  return readFileSync(seedSource, "utf8");
}

main().catch((error: unknown) => {
  console.error("❌ Falha no setup do banco de teste SQLite:", error);
  process.exitCode = 1;
});
