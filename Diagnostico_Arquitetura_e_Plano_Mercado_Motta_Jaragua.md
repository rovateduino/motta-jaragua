# Mercado Motta Jaraguá — Diagnóstico, Arquitetura e Plano de Execução

**Versão:** 1.0
**Data:** 24/10/2026
**Status:** Aguardando autorização para implementação
**Documento de referência:** `Arquitetura_Mercado_Motta_Jaragua_Prompt_VSCode.docx` (v1.0)
**Escopo:** e-commerce responsivo para supermercado regional, painel administrativo integrado, catálogo, ofertas, carrinho, checkout, pedidos, gestão operacional e integrações planejadas.

---

## Sumário

1. [Diagnóstico do workspace](#1-diagnóstico-do-workspace)
2. [Viabilidade no ambiente atual](#2-viabilidade-no-ambiente-atual)
3. [Escopo implementável vs. dependente de terceiros](#3-escopo-implementável-vs-dependente-de-terceiros)
4. [Arquitetura recomendada](#4-arquitetura-recomendada)
5. [Estrutura de frontend, backend, banco, admin e integrações](#5-estrutura-de-frontend-backend-banco-admin-e-integrações)
6. [Integrações prioritárias e informações necessárias](#6-integrações-prioritárias-e-informações-necessárias)
7. [Preservação, prevenção de regressões e validação](#7-preservação-prevenção-de-regressões-e-validação)
8. [Plano de implementação por fases](#8-plano-de-implementação-por-fases)
9. [Riscos técnicos](#9-riscos-técnicos)
10. [Decisões necessárias para iniciar](#10-decisões-necessárias-para-iniciar)

---

## 1. Diagnóstico do workspace

A inspeção foi realizada em modo somente leitura: **nenhum arquivo do projeto foi criado, alterado ou excluído e nenhuma dependência foi instalada** durante a auditoria.

### 1.1 Conteúdo encontrado

| Item | Situação |
|---|---|
| Código-fonte | **Inexistente** — sem `package.json`, `src/`, rotas, componentes ou testes |
| Versionamento | **Inexistente** — a pasta não é um repositório Git |
| Banco de dados | **Inexistente** — sem schema, migrations ou seeds |
| Integrações | **Inexistentes** — nenhuma credencial, SDK ou adapter |
| Documentação | Presente: `Arquitetura_Mercado_Motta_Jaragua_Prompt_VSCode.docx` (v1.0) |
| Imagens promocionais | **Ausentes** no workspace; existem apenas referências textuais à paleta e ao layout |
| Pastas vizinhas | `HUB-TRAINING`, `The Honest Bowl` e `Paginas Index` — projetos não relacionados, não devem ser reaproveitados |

### 1.2 Conclusão da auditoria

O projeto é **greenfield** (novo, sem código legado). Isso significa:

- **Não há risco de regressão de código**, pois não existe implementação anterior a preservar.
- **Também não há protótipo em arquivo** para comparar fidelidade visual; a baseline é o DOCX + as imagens que forem fornecidas.
- O DOCX já contém escopo funcional, identidade visual, entidades de domínio, API sugerida, papéis, critérios de aceite e fases. Ele é a **fonte de verdade inicial** deste plano.

### 1.3 Ambiente local identificado

| Ferramenta | Versão | Situação |
|---|---|---|
| Node.js | v24.22.0 | Disponível |
| npm | 11.19.1 | Disponível |
| Git | 2.56.0 | Disponível |
| Python | 3.11.1 | Disponível |
| Docker | — | **Não disponível** |
| pnpm / yarn | — | **Não disponíveis** |
| Cliente PostgreSQL (`psql`) | — | **Não disponível** |

---

## 2. Viabilidade no ambiente atual

**Sim, é possível desenvolver o produto de software completo** com os recursos disponíveis: loja, painel administrativo, API, banco, autenticação/RBAC, carrinho, checkout demonstrativo, pedidos, estoque, promoções, relatórios, testes automatizados, build e execução local.

**Ressalvas honestas:**

1. **Não há Docker nem PostgreSQL local.** É necessário decidir entre:
   - instalar PostgreSQL nativo na máquina (requer autorização do usuário); ou
   - usar um PostgreSQL gerenciado de desenvolvimento (Neon/Supabase), que exige conta e credenciais.
2. **Integrações reais não podem ser declaradas funcionais** sem conta, credenciais, ambiente sandbox e teste ponta a ponta.
3. **Não há imagens oficiais.** A Fase 1 usará placeholders/ilustrações licenciadas, claramente marcadas como demonstração.
4. **Emissão fiscal (NFC-e)** não está no DOCX, mas é requisito legal para venda real no Brasil e precisa entrar no escopo antes do go-live.

---

## 3. Escopo implementável vs. dependente de terceiros

### 3.1 Implementável e testável diretamente no projeto

- Design system Motta (vermelho/branco/preto), header, hero, departamentos, cards, busca, filtros, ofertas, carrinho, checkout demo e acompanhamento demo.
- Painel administrativo com as 8 áreas, CRUD, transições de status, auditoria e relatórios derivados do banco.
- API REST `/api/v1`, schema, migrations, seeds fictícios, validação com Zod, testes unitários/integração e Playwright nos fluxos críticos.
- Autenticação, RBAC, rate limit, cabeçalhos de segurança, proteção contra adulteração de preço/estoque e concorrência de estoque.
- Responsividade (360–1440 px), acessibilidade AA, estados de loading/erro/vazio.
- Modo demonstração explícito, separado do modo de produção.

### 3.2 Dependente de decisão, conta ou credencial

| Item | Dependência |
|---|---|
| Pagamento/Pix, webhooks e conciliação | Conta no provedor, CNPJ, credenciais sandbox, segredo de webhook |
| WhatsApp oficial | Número comercial, Meta Business/WABA ou BSP, templates aprovados, opt-in |
| E-mail transacional | Domínio, provedor (Resend/SES), remetente, templates |
| Emissão fiscal (NFC-e) | Regime tributário, certificado A1, CSC, contador, emissor ou ERP |
| Cobertura/taxas/janelas de entrega | Regras comerciais e logísticas do mercado |
| ERP/POS | Acesso, documentação, mapeamento de SKU, definição de sistema mestre |
| Catálogo e fotos oficiais | Planilha de produtos, imagens licenciadas, preços confirmados |
| Domínio, hospedagem e monitoramento | Contratação e credenciais |
| Política LGPD e termos de uso | Revisão jurídica e definição de canal do titular |

---

## 4. Arquitetura recomendada

**Monólito modular**, não microsserviços. Um supermercado regional tem time pequeno; a complexidade operacional de microsserviços não se paga nesta fase. Os módulos possuem fronteiras claras (domínio, serviços, repositórios, adapters), permitindo extrair serviços depois, se necessário.

### 4.1 Stack recomendada

| Camada | Tecnologia |
|---|---|
| Frontend | **Next.js 15 + React 19 + TypeScript estrito** (App Router), loja e `/admin` no mesmo deploy com layouts e RBAC separados |
| Estilo | **Tailwind CSS + design tokens Motta**, componentes próprios acessíveis |
| Estado | **TanStack Query** (dados remotos) + **Zustand** (carrinho/UI) |
| Banco | **PostgreSQL + Prisma** (migrations versionadas, seeds, transações) |
| Contratos | **Zod** compartilhado entre UI, API e jobs |
| Autenticação | Sessão em cookie `HttpOnly/Secure/SameSite`, Argon2id, RBAC server-side, CSRF nas mutações, auditoria |
| Jobs / Outbox | `pg-boss` ou cron para expiração de promoções, e-mails, sync ERP e webhooks |
| Imagens | Cloudflare R2/S3; banco guarda URL e metadados |
| Deploy | Vercel/Cloudflare para o app, Neon/Supabase para Postgres, Sentry + logs estruturados |
| Ambientes | `local`, `staging`, `production` e preview por PR |

> **Desvio consciente do DOCX:** o documento sugere React + Vite. Recomenda-se Next.js porque catálogo de supermercado se beneficia muito de SSR/ISR, SEO local, dados estruturados (`Product`/`Offer`), sitemap e Core Web Vitals. Caso se prefira aderência literal ao DOCX, usa-se Vite + Fastify, com perda de SEO orgânico.

### 4.2 Decisões de modelagem importantes

- Dinheiro em **centavos inteiros**; nunca `float`.
- **Snapshot de preço/nome/unidade** em `OrderItem`; o pedido não muda se o catálogo mudar.
- **Estoque por loja** (`Inventory`: `onHand`, `reserved`, `reorderPoint`); reserva com transação e TTL, nunca confiando no browser.
- **Idempotência** em criação de pedido, pagamento e webhooks.
- **`OrderStatusHistory` + `AuditLog`** para toda transição e ajuste sensível.
- **`APP_MODE=demo|production`** bloqueando cobrança/envio real no modo demo, com banner visível.
- **Multi-loja desde o início** (`Store`, preço e estoque por loja), mesmo que apenas Jaraguá esteja ativa.

---

## 5. Estrutura de frontend, backend, banco, admin e integrações

### 5.1 Organização do repositório

```text
motta/
  apps/
    web/                    # Next.js: route groups (store) e (admin)
    worker/                 # jobs, outbox, sync ERP, notificações
  packages/
    domain/                 # entidades e regras puras (preço, carrinho, estoque, status)
    contracts/              # DTOs Zod compartilhados
    db/                     # schema Prisma, migrations, seeds
    ui/                     # design system Motta
    integrations/           # adapters: payment, whatsapp, email, erp, delivery, fiscal
  tests/
    e2e/                    # Playwright
```

### 5.2 Frontend da loja

Route group `(store)` com:

- Home, departamentos, busca, filtros, ofertas, página de produto, carrinho, checkout, conta e pedidos.
- Mobile-first, navegação inferior e leitura de preços priorizada.
- Páginas renderizadas no servidor (SSR/ISR) para SEO e performance.

### 5.3 Painel administrativo

Route group `(admin)` com guard de sessão + papel no middleware **e** em cada server action/route handler.

Áreas:

1. Dashboard
2. Pedidos
3. Produtos e estoque
4. Ofertas e preços
5. Clientes
6. Entregas
7. Relatórios
8. Configurações
9. Usuários, papéis e auditoria

### 5.4 Backend

- Route handlers/server actions em `/api/v1` chamando casos de uso do pacote `domain`.
- Nenhuma regra de preço, frete ou estoque no cliente.
- Erros padronizados, paginação, limites e logs estruturados.

### 5.5 Banco de dados

Entidades do DOCX mais:

- `InventoryMovement`
- `OrderStatusHistory`
- `Address`
- `Payment`
- `DeliverySlot`
- `AdminUser` / `Role` / `Permission`
- `AuditLog`
- `IdempotencyKey`
- `OutboxEvent`
- `Notification`
- `FiscalDocument`

### 5.6 Integrações

Interfaces + adapters com implementação `mock` (demo) e real:

- `PaymentProvider`
- `WhatsAppProvider`
- `EmailProvider`
- `FiscalProvider`
- `ErpProvider`
- `DeliveryProvider`

Nenhuma integração é marcada como funcional sem teste real documentado.

---

## 6. Integrações prioritárias e informações necessárias

| Prioridade | Integração | Informações necessárias |
|---|---|---|
| **P0** | **Pagamento/Pix** (Mercado Pago, Pagar.me, Asaas) | CNPJ, titular e conta bancária, provedor escolhido, taxas/prazos, política de cancelamento/reembolso, credenciais sandbox e segredo de webhook |
| **P0** | **Fiscal / NFC-e** | Regime tributário, certificado A1, CSC/token, contador responsável, ERP ou emissor (Focus/Nuvem Fiscal) |
| **P0** | **Catálogo e ERP/POS** | Sistema atual e fornecedor, contrato/API, SKU/EAN, mapeamento, **quem é mestre de preço e estoque**, frequência de sync, tratamento de divergência e produtos pesáveis |
| **P1** | **WhatsApp** | Número comercial oficial, opt-in, Meta Cloud API ou BSP (evitar API não oficial por risco de banimento), templates aprovados |
| **P1** | **E-mail transacional** | Domínio, provedor (Resend/SES), remetente, templates, política de opt-out |
| **P1** | **Entrega/retirada** | Bairros/CEPs atendidos, taxas, pedido mínimo, janelas e capacidade, frota própria ou app, seguro, política de tentativa falha |
| **P2** | **Logística/rotas, analytics, push/PWA** | Endereço oficial, horários, IDs GA4/Meta, consentimento |

### 6.1 Informações institucionais pendentes

- Endereço oficial, horários e telefone.
- Catálogo com fotos licenciadas e preços confirmados.
- Política de substituição de itens indisponíveis.
- Política de privacidade, termos de uso e canal LGPD.
- Quem terá acesso administrativo e fluxo de aprovação de preço/oferta.

---

## 7. Preservação, prevenção de regressões e validação

Como não há código legado, a "preservação" passa a ser **contrato e baseline**:

- Baseline versionada do DOCX e das imagens; `git init` + branch `main` protegida + tag `v0-baseline`.
- **CI obrigatório:** lint, `tsc --noEmit`, testes unitários, build e Playwright. Nenhum merge sem pipeline verde.
- **Testes de regra de negócio** para carrinho, preço, frete, reserva de estoque concorrente, máquina de estados de pedido e autorização.
- **E2E dos fluxos críticos:**
  - buscar → adicionar → checkout demo → pedido visível no admin;
  - login administrativo;
  - transição de status de pedido.
- **Migrations reversíveis**, seeds idempotentes e dados de demonstração isolados (`APP_MODE=demo`).
- **Preview deploy por PR** e checklist de aceite do DOCX (layouts em 360/390/768/1024/1440 px, acessibilidade, estados vazios).
- **Feature flags** para integrações; nenhuma integração é habilitada sem sandbox validado.
- **ADRs** curtos para decisões relevantes e changelog por fase.

---

## 8. Plano de implementação por fases

| Fase | Entrega | Gate de aceite | Estimativa |
|---|---|---|---|
| **0 — Auditoria** | Diagnóstico, stack, riscos, decisões pendentes | Aprovação deste plano | 1–2 dias |
| **1 — Fundação** | Monorepo, CI, tokens Motta, layout base, schema/migrations, seeds demo | Build + lint + testes verdes | ~1 semana |
| **2 — Loja demo** | Home, departamentos, busca, filtros, ofertas, carrinho, checkout demo, pedidos demo | E2E dos fluxos + responsividade | ~2 semanas |
| **3 — Admin demo** | 8 áreas, CRUD, estoque, ofertas, status, relatórios | Critérios 6–9 do DOCX | ~2 semanas |
| **4 — Núcleo real** | API, Postgres, auth/RBAC, pedido server-side, reserva de estoque, auditoria | Testes de concorrência e autorização | ~2–3 semanas |
| **5 — Integrações** | Pagamento/Pix + webhooks, e-mail/WhatsApp, fiscal, entrega, ERP | Sandbox validado por integração | ~3–5 semanas (ERP pode somar 4–8) |
| **6 — Go-live** | Segurança, acessibilidade, carga, backup/restore, monitoramento, treinamento, LGPD | Checklist de produção assinado | ~2 semanas |

**Total realista:** 11–16 semanas sem ERP; +4–8 semanas com ERP. Não é prazo garantido até que as integrações sejam conhecidas.

### 8.1 Critérios de aceite por fase

- **Fase 1:** build, lint e testes verdes; design tokens aplicados; schema do banco criado e migrável.
- **Fase 2:** home, busca, filtros, ofertas, carrinho e checkout demo funcionando; layouts sem overflow horizontal em 360–1440 px.
- **Fase 3:** admin navega pelas 8 áreas; CRUD, estoque, oferta e status de pedido funcionam no modo demo.
- **Fase 4:** pedido criado e validado no servidor; estoque reservado corretamente sob concorrência; rotas admin protegidas por papel.
- **Fase 5:** cada integração validada em sandbox com evidência de teste; webhooks idempotentes e auditados.
- **Fase 6:** checklist de segurança, acessibilidade, backup/restore e LGPD assinado.

---

## 9. Riscos técnicos

| Risco | Impacto | Mitigação |
|---|---|---|
| Estoque sem integração com o caixa | Venda de item inexistente, cliente insatisfeito | Definir ERP como mestre; sync frequente; reserva com TTL; política de substituição |
| NFC-e fora do escopo | Operação comercial ilegal | Resolver na Fase 5 antes de cobrar de verdade |
| Pagamento sem idempotência/webhook verificado | Pedido pago sem baixa ou duplicado | PSP + webhook assinado + conciliação + outbox |
| WhatsApp via API não oficial | Banimento do número | Usar Cloud API/BSP oficial |
| Promessa de entrega sem dados de cobertura | Pedidos fora de área | Tabela de CEP/bairros e cálculo server-side |
| Preço/estoque manipulados no browser | Prejuízo financeiro | Recalcular tudo no servidor; snapshots |
| Produtos por peso | Erros de total e estoque | Unidade/kg explícita, arredondamento definido, pesagem na separação |
| Vazamento de dados / LGPD | Sanção e dano à reputação | Minimização, RBAC, criptografia, retenção, contrato com operadores |
| Complexidade administrativa | Equipe não adere | UX simples, treinamento, papéis claros, relatórios acionáveis |
| Sem imagens/catálogo oficiais | Retrabalho e aparência amadora | Placeholders rotulados + planilha de importação acordada |

---

## 10. Decisões necessárias para iniciar

Para iniciar a implementação, é necessária **autorização explícita** e a confirmação dos três pontos abaixo:

1. **Stack:** Next.js (recomendado, melhor SEO) ou Vite + Fastify (aderente ao DOCX)?
2. **PostgreSQL local:** instalar PostgreSQL nativo na máquina ou usar um PostgreSQL gerenciado de desenvolvimento (Neon/Supabase)?
3. **Escopo inicial:** começar pela Fase 1 + 2 (fundação e loja demonstrativa) ou já incluir o painel administrativo na mesma entrega?

---

**Nenhum arquivo do projeto foi criado, alterado ou excluído e nenhuma dependência foi instalada durante a auditoria.**
**A implementação aguarda autorização explícita.**
