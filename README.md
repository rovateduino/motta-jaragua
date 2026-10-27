# Mercado Motta Jaraguá

Plataforma de e-commerce do **Mercado Motta Jaraguá** — loja virtual responsiva, operação de supermercado e painel administrativo.

> **Ambiente de demonstração.** O catálogo, os pedidos e as operações do painel persistem no banco configurado; use somente dados fictícios. Não há cobrança nem integração de entrega.

## Status

**Fases 1 a 4 concluídas.** A loja e o painel usam PostgreSQL/Prisma para catálogo,
ofertas, pedidos, estoque, configurações e indicadores. O carrinho continua local
ao navegador; pagamentos e integrações operacionais são escopo da Fase 5.

| Fase | Escopo | Status |
|---|---|---|
| 1 — Fundação | Monorepo, CI, design tokens, app shell, domínio, contratos, schema, seeds, adapters | ✅ |
| 2 — Loja demo | Catálogo, busca, ofertas com vigência, carrinho, checkout e pedidos demo | ✅ |
| 3 — Admin demo | Dashboard, pedidos, produtos/estoque, ofertas, clientes, entregas, relatórios e configurações | ✅ |
| 4 — Núcleo real | Catálogo, checkout e painel administrativo persistidos no PostgreSQL, autenticação e RBAC | ✅ |
| 5 — Integrações | Pagamento/Pix, WhatsApp, e-mail, fiscal, ERP, entrega | ⏳ |
| 6 — Go-live | Segurança, acessibilidade, observabilidade, LGPD | ⏳ |

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript estrito**
- **Tailwind CSS 3.4** com design tokens do Mercado Motta
- **PostgreSQL** + **Prisma ORM**
- **Zod** para contratos compartilhados
- **Vitest** para testes de domínio, contratos e loja
- **Playwright** para os fluxos E2E críticos
- **ESLint 9** (flat config) + **GitHub Actions**

## Estrutura

```text
motta-jaragua/
  apps/
    web/                        # Next.js: loja e painel administrativo /painel
  packages/
    domain/                     # regras puras: dinheiro, preço, carrinho, status
    contracts/                  # DTOs e validações Zod
    db/                         # schema Prisma, migration inicial, seeds
    integrations/               # interfaces e adapters bloqueados no demo
    ui/                         # design system Motta
  tests/e2e/                    # Playwright: loja, painel e responsividade
  docs/
    adr/                        # decisões arquiteturais
    FASE-1.md                   # entrega da fundação
    FASE-2.md                   # entrega da loja demo
    FASE-3.md                   # entrega do admin demo
    FASE-4.md                   # núcleo real e painel conectado ao PostgreSQL
    PLANO-UPGRADES.md           # auditoria e plano de dependências
  playwright.config.ts          # projetos desktop (1440) e mobile (390)
  .github/workflows/ci.yml      # lint, typecheck, test e build
```

## Requisitos

- Node.js **>= 20.9** (testado com Node 24)
- npm **>= 10**
- Google Chrome instalado para rodar o E2E local (ou Chromium via Playwright)
- Um PostgreSQL gerenciado (Neon, Supabase ou equivalente) para aplicar migrations e seeds

## Começando

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# edite .env e informe DATABASE_URL (pooled) e DIRECT_URL (direct)

# 3. Validar o schema e aplicar a migration inicial
npm run db:validate
npm run db:migrate

# 4. Popular dados fictícios de demonstração (não cria acessos administrativos)
npm run db:seed

# 5. Rodar a loja
npm run dev
```

A loja estará em `http://localhost:3000`.

No primeiro acesso ao painel, abra `http://localhost:3000/admin/cadastro` e crie o
administrador inicial. O seed **não** cria mais contas administrativas demo.

### Banco de dados necessário

O banco PostgreSQL é necessário para autenticação, catálogo, checkout e painel.
Configure `DATABASE_URL` e `DIRECT_URL`, aplique as migrations e rode o seed antes
de iniciar o fluxo completo. O carrinho do cliente permanece no navegador, mas o
checkout recalcula preços/estoque no servidor e grava o pedido no banco.

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o Next.js em desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Sobe o build de produção |
| `npm run lint` | ESLint na aplicação web |
| `npm run typecheck` | TypeScript em todos os workspaces |
| `npm test` | Vitest em domínio, contratos e loja |
| `npm run test:e2e` | Playwright: compra, ofertas, admin e responsividade |
| `npm run test:e2e:ui` | Playwright em modo interativo |
| `npm run db:validate` | Valida o schema Prisma |
| `npm run db:generate` | Gera o Prisma Client |
| `npm run db:migrate` | Aplica migrations (`prisma migrate deploy`) |
| `npm run db:migrate:dev` | Cria/aplica migrations em desenvolvimento |
| `npm run db:seed` | Popula dados fictícios de demonstração (sem acessos administrativos) |
| `npm run db:disable-demo-admins` | Desativa as contas administrativas demo no banco do `.env` |
| `npm run db:studio` | Abre o Prisma Studio |

## Variáveis de ambiente

Copie `.env.example` para `.env`. Nomes principais:

| Variável | Uso |
|---|---|
| `APP_MODE` | `demo` ou `production`. No demo, avisos e proteções são ativados |
| `DATABASE_URL` | Conexão PostgreSQL **pooled** (aplicação em runtime) |
| `DIRECT_URL` | Conexão PostgreSQL **direct** (migrations e introspecção do Prisma) |
| `NEXT_PUBLIC_APP_URL` | URL pública da aplicação |
| `PAYMENT_*` | Pagamento/Pix (Fase 5) |
| `WHATSAPP_*` | WhatsApp (Fase 5) |
| `EMAIL_*` | E-mail transacional (Fase 5) |
| `FISCAL_*` | NFC-e (Fase 5) |
| `ERP_*` | ERP/POS (Fase 5) |

**Nunca comite o `.env`.** O `.gitignore` bloqueia arquivos de ambiente.

## Banco de dados

- Dinheiro é armazenado em **centavos inteiros** (`Int`), nunca em ponto flutuante.
- Quantidades são **inteiros em milésimos da unidade de venda** (`1 un = 1000`;
  `500 g = 500` quando a unidade é o kg).
- Estoque, preço e janelas são **por loja** (multi-loja desde o início).
- Pedidos guardam **snapshot** de nome, unidade e preço dos itens.
- O schema já contempla auditoria, idempotência, outbox, notificações e documento fiscal.
- A migration inicial está em `packages/db/prisma/migrations/0001_init`.
- Os comandos de banco rodam a partir de `packages/db`, mas o `.env` fica na raiz.
  O `packages/db/prisma.config.ts` carrega esse arquivo automaticamente; em
  CI/Vercel, onde não existe `.env`, as variáveis vêm do ambiente da plataforma.
  Não é preciso usar `dotenv` na mão para `db:validate`, `db:migrate` ou `db:seed`.
- O seed **não cria contas de administrador**. O primeiro acesso é feito em
  `/admin/cadastro` (disponível apenas enquanto houver zero administradores).
- As contas do seed antigo (`admin@motta.test` e `atendimento@motta.test`) devem
  ser desativadas em bancos que já receberam aquele seed:
  `npm run db:disable-demo-admins` (carrega o `.env` da raiz). Com
  `APP_MODE=production`, o login desses e-mails também é bloqueado pelo código,
  como segunda barreira. Antes de ativar o modo produção, crie um administrador
  real e desative as contas demo — o cadastro inicial (`/admin/cadastro`) só
  abre quando não existe nenhum administrador.
- No Neon, `DATABASE_URL` usa o hostname com `-pooler` e `pgbouncer=true`; o Prisma
  usa `DIRECT_URL` (sem `-pooler`) para aplicar migrations. Ambas exigem
  `sslmode=require`.
- `npm run db:migrate` executa `prisma migrate deploy`, adequado a ambientes
  gerenciados; `db:migrate:dev` fica restrito ao desenvolvimento local.
- Banco demo Neon provisionado: migration `0001_init` aplicada e seed idempotente
  executado (1 loja, 10 categorias, 26 produtos, 5 promoções e 9 janelas de
  entrega). A loja e o painel consomem o banco em runtime a partir da Fase 4.

## Modo demonstração

- `APP_MODE=demo` ativa o banner de demonstração e metadados `noindex`.
- Integrações externas usam adapters que **falham explicitamente** com
  `IntegrationNotConfiguredError`; nada aparenta funcionar sem credenciais.
- Seeds usam apenas produtos, preços e estoques fictícios.
- O carrinho é salvo no navegador; contas, sessões, pedidos e dados do painel são
  persistidos no PostgreSQL.
- O painel `/painel` exige autenticação e aplica permissões RBAC nas páginas e
  server actions.
- Produtos, preços, estoque e ofertas alterados no painel refletem na loja pública
  por meio das leituras do banco e revalidação de rotas.
- O checkout cria pedidos com número `MOTTA-XXXXXX`, reserva estoque em transação
  e os mostra em `/pedidos` e no painel.
- Pedidos concluídos baixam a reserva e o estoque; cancelamentos liberam a reserva.

## Decisões arquiteturais

- [ADR 0001 — Next.js 15 como framework da loja](docs/adr/0001-nextjs.md)
- Monólito modular: domínio e contratos isolados, adapters para integrações.
- Sem microsserviços nesta fase.

## Limitações conhecidas

- Pagamentos/Pix, entrega, e-mail, WhatsApp, NFC-e e ERP ainda não estão integrados;
  pedido registrado não significa pedido pago nem entregue.
- A operação administrativa seleciona a primeira loja ativa; uma gestão multi-loja
  com escopo por usuário ainda não está disponível.
- O carrinho continua local ao dispositivo e não é sincronizado entre sessões.
- O checkout reserva estoque; integrações de pagamento e expiração automática de
  reservas ainda dependem da Fase 5.
- As cores da loja são configuráveis, porém o tema público ainda é fixo.
- A suíte E2E usa o Chrome instalado; em CI sem Chrome é preciso instalar o
  Chromium (`npx playwright install chromium`) e ajustar o `channel`.
- Integrações externas estão bloqueadas por adapters que falham explicitamente.
- Permanecem as vulnerabilidades de dependências registradas na Fase 2; upgrades
  major não foram tratados.

## Próxima etapa

A **Fase 5** conectará pagamentos/Pix, entrega, notificações, emissão fiscal e ERP.
Antes do go-live, a Fase 6 ainda precisa cobrir hardening de segurança,
acessibilidade, observabilidade e LGPD.
