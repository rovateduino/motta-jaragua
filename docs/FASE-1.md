# Fase 1 — Fundação (concluída)

**Data:** 24/10/2026
**Modo:** demonstração (`APP_MODE=demo`)
**Escopo:** fundação técnica, design system e base de dados. Sem catálogo
funcional, carrinho, checkout ou painel administrativo — esses itens pertencem às
Fases 2–4.

## Entregue

### Infraestrutura
- Monorepo com npm workspaces: `apps/web` e `packages/{domain,contracts,db,ui,integrations}`.
- TypeScript estrito com `noUncheckedIndexedAccess` e `verbatimModuleSyntax`.
- ESLint 9 (flat config) e GitHub Actions com lint, typecheck, testes e build.
- `.env.example`, carregamento centralizado do `.env` da raiz via `dotenv-cli`.
- `.gitignore` cobrindo segredos, builds, caches e artefatos de teste.

### Design system e loja (shell)
- Tokens Motta: vermelho `#D71920`, vermelho escuro, amarelo `#FFDF33`, carvão `#181818`, cinzas e branco.
- Componentes: `Button`, `Badge`, `Card`, `Container`, `Input`, `PriceTag`, `SectionHeading`, `DemoNotice` e ícones SVG.
- Header com CEP, busca (navegação para "em construção"), conta, painel e carrinho; menu principal e navegação inferior mobile.
- Home de fundação com hero, faixa de confiança, 10 departamentos, ofertas fictícias, produtos para casa, faixa do painel e rodapé.
- Página `/em-construcao` transparente, com `noindex`, sem simular operações reais.
- Responsividade de 360 px a 1440 px, skip link, foco visível, labels e `aria` relevantes.
- Cabeçalhos básicos de segurança no Next.js.

### Domínio e contratos
- Dinheiro em centavos inteiros, parsing/formatting BRL, soma e percentuais.
- Preço efetivo com janela de promoção; rejeição de promoção inválida.
- Totais de carrinho no servidor, com validação de quantidade, estoque, limite e desconto.
- Máquina de estados de pedido com transições válidas e estados terminais.
- Contratos Zod para catálogo, endereço, checkout, pedido e paginação.
- **35 testes** (28 de domínio + 7 de contratos).

### Banco de dados
- Schema Prisma/PostgreSQL com 27 modelos e 11 enums.
- Multi-loja, snapshot de pedido, estoque com reserva, auditoria, idempotência,
  outbox, notificações, documento fiscal e RBAC.
- Migration inicial gerada em `packages/db/prisma/migrations/0001_init`.
- Seed idempotente com loja, 10 categorias, 26 produtos, 5 promoções, janelas de
  entrega, configurações, permissões e 6 papéis.
- Todos os dados do seed são fictícios.

### Integrações
- Interfaces para pagamento, e-mail, WhatsApp, fiscal, ERP e entrega.
- Adapters de demonstração que falham com `IntegrationNotConfiguredError`; nada
  aparenta funcionar sem credenciais reais.

## Validação executada

| Comando | Resultado |
|---|---|
| `npm install` | OK |
| `npm run db:validate` | Schema válido |
| `npm run typecheck` | OK em 6 workspaces |
| `npm test` | 35 testes passando |
| `npm run lint` | Sem erros |
| `npm run build` | Build de produção OK (4 rotas) |
| Smoke test `next start` | HTTP 200 em `localhost:3100` |

A migration e o seed **não foram aplicados** por ausência de uma `DATABASE_URL`
real neste ambiente.

## Pendências para a Fase 2

1. Definir a representação de quantidades fracionárias (produtos pesáveis).
2. Conectar a home ao banco/seed.
3. Implementar catálogo, busca, filtros, ofertas, carrinho e checkout demo.
4. Persistir carrinho demo e pedidos demo.
5. Adicionar Playwright para os fluxos críticos.
6. Validar layout em 360, 390, 768, 1024 e 1440 px.

## Informações ainda necessárias do Mercado Motta

- Catálogo oficial, fotos licenciadas e regras de produtos pesáveis.
- Endereço, horários, telefone/WhatsApp e área de entrega.
- Sistema de caixa/ERP e definição de sistema mestre.
- Provedor de pagamento, política de reembolso e decisão sobre NFC-e.
- Política de substituição, privacidade, termos e canal LGPD.
