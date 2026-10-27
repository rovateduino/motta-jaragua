/**
 * Configuração da CLI do Prisma para o pacote @motta/db.
 *
 * O `.env` vive na raiz do monorepo, mas os scripts de banco rodam a partir de
 * `packages/db` (cwd do workspace). Sem este arquivo, a CLI procurava
 * `packages/db/.env` e falhava com "Environment variable not found".
 *
 * - Local: carrega o `.env` da raiz automaticamente.
 * - CI/Vercel: o `.env` não existe, então nada é carregado e as variáveis vêm
 *   do ambiente da plataforma.
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

const packageDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(packageDir, "../..");

loadEnv({ path: resolve(rootDir, ".env") });

export default defineConfig({
  schema: resolve(packageDir, "prisma/schema.prisma"),
  migrations: {
    // Executado com cwd = packages/db (mesmo diretório deste arquivo).
    seed: "tsx prisma/seed.ts",
  },
});
