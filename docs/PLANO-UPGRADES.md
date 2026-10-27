# Plano de upgrades de dependências

**Data:** 25/10/2026
**Escopo:** vulnerabilidades de produção reportadas por `npm audit --omit=dev`
**Modo:** demonstração (`APP_MODE=demo`)
**Status:** plano apenas. Nenhuma dependência foi instalada, removida ou atualizada.

## Resumo executivo

O `npm audit --omit=dev` executado em 25/10/2026 encontrou **5 vulnerabilidades:
1 moderada, 4 altas e 0 críticas**. Elas vêm de **duas cadeias de correção**:

1. **Prisma:** `prisma@6.19.3` → `@prisma/config@6.19.3` → `deepmerge-ts@7.1.5`.
2. **Next.js/PostCSS:** `next@15.5.28` → `postcss@8.4.31` aninhado.

Não existe correção não-disruptiva dentro das versões atuais: o próprio npm indica
`npm audit fix --force` e upgrades major para `prisma@7.10.1` e `next@16.4.3`.
Zod não aparece como vulnerabilidade de produção no relatório atual. O
`npm audit fix --dry-run --omit=dev` foi executado somente para simulação e
**não alterou** `package.json`, `package-lock.json` nem `node_modules`.

## Comandos executados

```bash
npm audit --omit=dev
npm audit --omit=dev --json
npm audit fix --dry-run --omit=dev
npm ls --depth=0
npm ls deepmerge-ts @prisma/config postcss --all
npm view next@16 version
npm view prisma@7 version
npm view postcss version
npm view deepmerge-ts version
npm view @prisma/adapter-pg@7.10.1 peerDependencies
npm view @prisma/adapter-pg@7.10.1 dependencies
npm view prisma@7.10.1 engines
npm view next@16.4.3 engines
```

## Vulnerabilidades encontradas

| Pacote | Versão atual | Versão corrigida | Severidade | Tipo | Caminho | Correção indicada |
|---|---:|---:|---|---|---|---|
| `deepmerge-ts` | 7.1.5 | >= 8.0.0 (atual 8.0.2) | Alta | Transitiva | `@prisma/config@6.19.3` → `prisma@6.19.3` | Prisma 7.10.1 |
| `@prisma/config` | 6.19.3 | 7.10.1 | Alta | Transitiva | `prisma@6.19.3` | Prisma 7.10.1 |
| `prisma` | 6.19.3 | 7.10.1 | Alta | Direta (CLI) | `packages/db` | Major para 7.10.1 |
| `postcss` (aninhado) | 8.4.31 | >= 8.5.23 (atual 8.5.31) | Alta | Transitiva | `next@15.5.28` | Next 16.4.3 |
| `next` | 15.5.28 | 16.4.3 | Moderada | Direta | `apps/web` | Major para 16.4.3 |

### Advisories e impacto

| Advisory | Pacote | Efeito |
|---|---|---|
| [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx) | `deepmerge-ts` | Exaustão de pilha ao mesclar grafos recursivos (CWE-674). Afeta o carregamento de configuração da CLI do Prisma, não o bundle do navegador. |
| [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93) | `postcss` | XSS por `</style>` não escapado na serialização de CSS (CWE-79). |
| [GHSA-6g55-p6wh-862q](https://github.com/advisories/GHSA-6g55-p6wh-862q) | `postcss` | Leitura arbitrária de arquivos via `sourceMappingURL` (CWE-22/CWE-200). |
| [GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp) | `postcss` | Correção incompleta do advisory anterior; leitura de `.map` quando `from` não é definido. |
| [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849) | `postcss` | Path traversal no carregamento automático de source maps (CWE-22). |

### Exposição atual no projeto

- O CSS é local e confiável; a aplicação não processa CSS nem source maps enviados
  por usuários. O risco de exploração direta é baixo hoje, mas o pacote vulnerável
  ainda é distribuído com o Next.
- `deepmerge-ts` está na cadeia da CLI do Prisma, não no cliente do navegador.
- Ainda assim, as correções devem entrar antes de produção, porque a Fase 4
  passará a expor validação de entrada e persistência real.

## Avaliação de risco por upgrade

### Patch/minor seguro

| Pacote | De | Para | Risco | Observação |
|---|---:|---:|---|---|
| `postcss` direto (dev) | 8.5.6 | 8.5.31 | Baixo | Patch dentro de 8.5.x. Não elimina o advisory do PostCSS aninhado no Next 15; é higiene independente. |

Nenhum outro upgrade corretivo é patch/minor. O npm só oferece correção para os
cinco achados via major.

### Major com risco controlado

| Pacote | De | Para | Risco | Motivo |
|---|---:|---:|---|---|
| `next` | 15.5.28 | 16.4.3 | Médio | Turbopack padrão, remoção de APIs síncronas e `next lint`. O projeto já usa `params`/`searchParams` assíncronos, ESLint direto e não tem middleware nem webpack customizado. |
| `prisma` + `@prisma/client` | 6.19.3 | 7.10.1 | Alto | Exige gerador `prisma-client`, `output` explícito, `prisma.config.ts`, carregamento explícito de `.env` e driver adapter. |

## Riscos de breaking changes

### Prisma 6 → 7

- O gerador `prisma-client-js` entra em desuso; o alvo é `prisma-client`.
- O campo `output` passa a ser obrigatório e o client deixa de ser gerado dentro de
  `node_modules`.
- Imports mudam de `@prisma/client` para o caminho gerado, por exemplo
  `packages/db/src/generated/prisma/client`.
- `url`, `directUrl` e `shadowDatabaseUrl` da datasource passam a ser configurados
  em `prisma.config.ts` (ou `prisma7.config.ts` no Prisma 7.10+).
- A CLI deixa de carregar `.env` automaticamente; é necessário `dotenv/config` ou
  carregamento explícito.
- Driver adapter passa a ser obrigatório: para PostgreSQL, `@prisma/adapter-pg` e
  `pg`, com `new PrismaClient({ adapter })`.
- Seed, schema, migrations e geração passam a ser configurados no Prisma Config; a
  chave `prisma` do `package.json` já está depreciada e será removida.
- `migrate dev`/`db push` não rodam mais `generate` automaticamente.
- Os defaults de pool/timeout mudam para os do driver `pg`.
- Node exigido: `^20.19 || ^22.12 || >=24.0`; o ambiente atual usa Node 24.22.0.

**Mitigação:** manter a URL pooled (`DATABASE_URL`) no adapter de runtime e usar a
direct (`DIRECT_URL`) no `prisma.config.ts` para migrations. Validar `migrate
status`, reaplicar o seed idempotente e comparar as contagens antes/depois.

### Next.js 15 → 16

- Turbopack passa a ser o padrão em `dev` e `build`.
- Acesso síncrono a `params`, `searchParams`, `cookies`, `headers` e `draftMode` é
  removido. O projeto já usa os dois primeiros como `Promise`; não há middleware.
- `next lint` foi removido e `next build` não executa mais lint. O projeto já usa
  `eslint .`, então o impacto é baixo.
- `middleware.ts` vira `proxy.ts`; não há middleware neste projeto.
- `experimental.turbopack` vira `turbopack` no topo; não há configuração customizada.
- `next.config.ts` continua suportado; `images.remotePatterns` vazio e headers
  estáticos não exigem mudança.
- `eslint-config-next` deve acompanhar a versão do Next. ESLint 9 atual é
  compatível; não é necessário subir para ESLint 10.
- React 19.2.9 atual satisfaz o peer dependency do Next 16; não é necessário subir
  React nesta etapa.

## Ordem sugerida de upgrade

Cada etapa deve ser um commit isolado, com o lockfile versionado e sem
`npm audit fix --force`.

### Etapa 0 — Linha de base

```bash
git switch -c chore/dependency-upgrades
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

### Etapa 1 — PostCSS direto (seguro, opcional)

```bash
npm install -D postcss@8.5.31 -w @motta/web
```

Validar build e Tailwind. Esta etapa **não zera** o audit, pois o PostCSS 8.4.31
aninhado no Next 15 continua vulnerável.

### Etapa 2 — Prisma 7 (início da Fase 4)

Executar **antes** de escrever a camada de persistência da Fase 4, para evitar
retrabalho.

```bash
npm install @prisma/client@7.10.1 @prisma/adapter-pg@7.10.1 pg@8.23.1 -w @motta/db
npm install -D prisma@7.10.1 @types/pg -w @motta/db
```

- Criar `packages/db/prisma.config.ts` ou `prisma7.config.ts` com `dotenv/config`,
  schema, migrations, seed e `DIRECT_URL` para a CLI.
- Trocar o generator para `prisma-client` com `output` explícito.
- Atualizar `packages/db/src/client.ts` para o client gerado + `PrismaPg`.
- Atualizar imports do seed e tipagens `Prisma.*`.
- Remover a configuração `prisma` do `package.json`.
- Garantir `db:generate` explícito no build/CI.
- Rodar `db:validate`, `db:migrate`, `db:seed` duas vezes, conferir contagens,
  testes, build e E2E.

Essa etapa elimina 3 achados altos da cadeia Prisma/deepmerge.

Novas dependências justificadas: `@prisma/adapter-pg` é o adapter oficial
PostgreSQL exigido pelo Prisma 7; `pg` é o driver subjacente; `@types/pg` é apenas
desenvolvimento.

### Etapa 3 — Next 16 (depois da Fase 4, antes da Fase 5)

```bash
npm install next@16.4.3 eslint-config-next@16.4.3 -w @motta/web
```

- Rodar o codemod oficial e revisar cada alteração.
- Confirmar Turbopack no build.
- Verificar `next.config.ts`, ESLint e headers.
- Rodar build de produção, E2E desktop/mobile e smoke das rotas públicas/admin.

Essa etapa elimina os 2 achados restantes (Next/PostCSS). Recomenda-se
fazê-la após estabilizar a Fase 4 para não misturar migração de framework com API,
auth e persistência; não deve ser postergada para depois do início da Fase 5.

### Etapa 5 — Fechamento

```bash
npm audit --omit=dev
npm audit
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Esperado após as etapas 2–3: **0 vulnerabilidades de produção**. O `npm audit`
completo ainda pode listar achados de ferramentas de desenvolvimento; esses devem
ser tratados separadamente, sem forçar quebra de toolchain.

## O que adiar

| Item | Quando | Motivo |
|---|---|---|
| Prisma 7 | Início da Fase 4 | É pré-requisito da persistência real; adiar para depois da Fase 4 geraria retrabalho. |
| Next 16 | Fim da Fase 4 / antes da Fase 5 | Reduz conflito com a implementação de API/auth e ainda corrige o audit antes das integrações. |
| PostCSS direto 8.5.31 | Pode ser imediato | Patch seguro, mas não substitui o Next 16. |
| Tailwind 4 | Depois da Fase 5 ou manutenção dedicada | Não está no audit; migração de config/plugins é grande e fora do escopo. |
| React 19.3 / TypeScript 7 / ESLint 10 | Manutenção futura | Não são necessários para corrigir os achados; aumentam o risco sem ganho imediato. |
| Prisma 8 | Não planejar agora | O alvo corrigido é 7.10.1; 8 está fora do escopo e sem necessidade. |

## Critérios de aceite

- `npm audit --omit=dev` sem vulnerabilidades high/critical após as etapas 2–3.
- Uma única versão de `prisma`, `@prisma/client` e `postcss` no lockfile,
  salvo o PostCSS interno do Next enquanto ele não for atualizado.
- `npm run db:migrate` e `npm run db:seed` continuam funcionando no Neon com
  `DATABASE_URL` pooled e `DIRECT_URL` direct.
- Build, lint, typecheck, testes unitários e E2E passam em desktop e mobile.
- Nenhum `npm audit fix --force` é executado.
- Nenhuma mudança de lógica de loja, carrinho, checkout ou painel fora do
  necessário para compatibilidade dos upgrades.
