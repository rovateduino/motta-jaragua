# Fase 3 — Painel administrativo demo

**Data:** 25/10/2026
**Modo:** demonstração (`APP_MODE=demo`)
**Status:** concluída no escopo demo — oito áreas administrativas, CRUD local de
produtos e ofertas, ajuste de estoque, transições de pedido, configurações da loja,
relatórios, suíte E2E ampliada e reflexo imediato na loja pública.

## Decisão: administração local sobre um store puro

O painel não usa autenticação, banco ou API nesta fase. Para manter a demo
coerente entre páginas públicas e administrativas, a Fase 3 introduziu:

- `apps/web/src/lib/demo-commerce.ts`: store puro com tipos, seed, validações,
  CRUD, histórico de estoque, auditoria, settings e cálculo de preço efetivo.
- `DemoCommerceProvider`: contexto client-side que hidrata, persiste e sincroniza
  o estado entre abas.
- Chave `motta-demo-commerce-v1` no `localStorage`, separada de carrinho
  (`motta-demo-cart-v1`) e pedidos (`motta-demo-orders-v1`).

A ordem dos providers no layout é `DemoCommerceProvider` → `CartProvider` →
`OrdersProvider` → `AppShell`. O carrinho resolve produtos pelo store dinâmico e
aceita itens criados no painel. O shell público é ocultado em `/painel`.

## Entregue

### Estrutura do painel
- `/painel/layout.tsx` com metadados `noindex`, `AdminShell` e área `main`.
- Sidebar carvão com realce vermelho, topbar no mobile e navegação horizontal
  rolável. Badges de pedidos pendentes, estoque baixo e ofertas ativas.
- Banner permanente de acesso demo não autenticado.
- Link “Ver loja” e links recíprocos no header/footer público.
- Componentes compartilhados em `components/admin/shared.tsx`: cabeçalho, cards
  de indicador, badges, estados vazios, feedback, barra de estoque e formatadores.

### Oito áreas administrativas
1. **Dashboard** (`/painel`): pedidos hoje, vendas e ticket médio em 30 dias,
   alertas de estoque, pedidos recentes, estoque baixo, atalhos e ranking de
   produtos.
2. **Pedidos** (`/painel/pedidos`): busca por número/cliente/telefone, filtro por
   todos os status e acesso à fila detalhada.
3. **Produtos e estoque** (`/painel/produtos`): busca, filtro por departamento e
   situação, criação/edição, ativação/desativação, exclusão com confirmação,
   histórico de ajustes e link para a PDP pública.
4. **Ofertas e preços** (`/painel/ofertas`): CRUD de promoções por SKU, filtro por
   estado (ativa, agendada, expirada, inativa), ativação/desativação, exclusão e
   bloqueio de reativação de oferta expirada.
5. **Clientes** (`/painel/clientes`): clientes fictícios derivados dos pedidos,
   busca, recorrentes, receita atribuída e link para o último pedido.
6. **Entregas** (`/painel/entregas`): painel em etapas (preparo, rota, concluídas),
   busca por pedido/cliente/bairro, cobertura e avisos das configurações.
7. **Relatórios** (`/painel/relatorios`): períodos de 7/30/90 dias, vendas por dia,
   ticket médio, cancelamentos, separação média, prazo de conclusão, ranking de
   produtos, alertas de estoque e desempenho de ofertas.
8. **Configurações** (`/painel/configuracoes`): dados da loja, regras de pedido e
   frete, áreas e horários, janelas de retirada, formas de pagamento demo,
   política de substituição e cores de referência.

### Pedidos administrativos
- `DemoOrderStatus` agora cobre os nove status do domínio, com `statusHistory`.
- `updateDemoOrderStatus` usa `assertTransition`/`nextStatuses` de
  `@motta/domain`; transições inválidas são rejeitadas.
- Detalhe admin `/painel/pedidos/[orderNumber]` mostra itens, totais, contato,
  endereço/retirada, substituição, trilha de status e formulário de transição com
  observação e confirmação para cancelamento/reembolso.
- Nove pedidos fictícios são criados apenas quando `motta-demo-orders-v1` ainda
  não existe, populando dashboard, clientes, entregas e relatórios. Um array vazio
  salvo pelo usuário é respeitado.

### Reflexo na loja pública
- Catálogo, busca, categorias, ofertas, PDP, home e relacionados leem o store
  dinâmico.
- Produto novo e ativo aparece imediatamente no catálogo e na busca; desativado ou
  excluído deixa de aparecer.
- Oferta ativa altera o preço efetivo e aparece em `/ofertas`.
- Status alterado no admin aparece em `/pedidos/[orderNumber]`, inclusive após
  recarregar.
- Checkout usa as configurações salvas: pedido mínimo, taxa de entrega, faixa de
  frete grátis, cidade/UF, janelas e aviso de retirada.
- O detalhe público do pedido resolve a janela de retirada pelas configurações
  atuais e exibe o histórico normalizado.

### Analytics e validações
- `demo-analytics.ts` calcula dashboard, relatórios, ranking, cancelamentos,
  separação média, pontualidade, desempenho de ofertas e clientes.
- Validações cobrem SKU único, departamento, preço, estoque inteiro, quantidades,
  popularidade, oferta menor que o preço base, período da oferta, expiração,
  configurações e justificativa de ajuste de estoque.
- Toda mutação relevante gera entrada no `auditLog` local (limite de 100).

### Testes
- `demo-commerce.test.ts`: seed, criação/edição/ativação/exclusão, estoque,
  promoções, settings e parsing.
- `demo-analytics.test.ts`: dashboard, relatórios, clientes e cenário vazio.
- `demo-orders.test.ts`: transições válidas/inválidas e histórico.
- `tests/e2e/admin.spec.ts`: produto e oferta refletidos na loja, transição de
  status visível ao cliente e abertura das oito áreas.

## Validação executada

| Comando | Resultado |
|---|---|
| `npm run lint` | Sem erros ou warnings |
| `npm run typecheck` | OK em 6 workspaces |
| `npm test` | 81 testes passando (39 domínio, 35 loja, 7 contratos) |
| `npm run build` | Build de produção OK (21 rotas geradas) |
| `npm run test:e2e` | 11 passaram e 1 ignorado por design (teste exclusivo do projeto mobile) |

A migration `0001_init` e o seed de demonstração foram aplicados no Neon em
25/10/2026, com `DATABASE_URL` pooled para runtime e `DIRECT_URL` direct para
migrations. A aplicação continua lendo o catálogo estático; a integração com o
banco em runtime pertence à Fase 4.

## QA visual

Capturas desktop e mobile das oito áreas e do checkout em:

`C:\Users\Rovati\AppData\Local\Temp\opencode\motta-qa\phase3-shots`

## Limitações e pendências

1. Não há autenticação, RBAC ou sessão real; `/painel` é aberto e apenas sinalizado
   como demo.
2. Dados administrativos vivem no `localStorage`; limpar o navegador restaura o
   seed e outro dispositivo não enxerga as alterações.
3. O reset em Configurações restaura catálogo, ofertas e settings, mas **não apaga
   pedidos**.
4. As cores primária/secundária são salvas, porém o tema público permanece fixo.
5. O painel não tem paginação ou edição em massa; listas longas rolam na página.
6. Estoque não é reservado e pedidos não são transacionais; não há concorrência
   real entre abas além do evento `storage`.
7. Checkout continua sem pagamento, frete real, documento fiscal ou integração
   externa.
8. A suíte E2E usa o Chrome instalado (`channel: "chrome"`); em CI sem Chrome é
   preciso instalar o Chromium e ajustar o canal.
9. O banco Neon demo está migrado e populado, mas a loja ainda não o consome em
   runtime; a integração é escopo da Fase 4.
10. Permanecem as vulnerabilidades de dependências já registradas na Fase 2;
    upgrades major não foram tratados nesta fase.

## Próximos passos sugeridos

1. Fase 4: autenticação, RBAC, persistência real e API de pedidos/estoque.
2. Migrar catálogo, promoções e settings do store local para o PostgreSQL.
3. Implementar reserva de estoque e idempotência de pedidos.
4. Conectar pagamento/Pix, WhatsApp, e-mail, fiscal, ERP e entrega via adapters.
5. Evoluir E2E para CI com navegador gerenciado e testes de acessibilidade.
