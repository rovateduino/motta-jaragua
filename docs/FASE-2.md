# Fase 2 — Loja demo completa

**Data:** 24/10/2026
**Modo:** demonstração (`APP_MODE=demo`)
**Status:** concluída no escopo demo — catálogo, busca, PDP, carrinho, promoções
com vigência, checkout, pedidos e fila demonstrativa do painel, com suíte E2E
versionada.

## Decisão: quantidades em milésimos

Produtos pesáveis passam a usar **inteiro em milésimos da unidade de venda**:

- `1 un = 1000` (ex.: 2 unidades = `2000`);
- `500 g = 500` quando a unidade de venda é o quilograma;
- `1,5 kg = 1500`.

A escala é aplicada a estoque, reservas, limites por pedido, itens de carrinho e
itens de pedido. O schema mantém `Int` e documenta a escala nos campos afetados.
O seed declara estoque e limites em unidades inteiras por legibilidade e converte
com `toQuantityMilli` antes de gravar. Produtos embalados (leite, refrigerante,
detergente, shampoo, papel higiênico, sabão em pó e ração) foram normalizados para
`UNIT`, restando `KG` apenas nos itens vendidos por peso.

## Entregue

### Catálogo e busca
- 10 departamentos e 26 produtos fictícios em `apps/web/src/lib/catalog.ts`.
- `/catalogo` com busca sem acento, filtro por departamento, filtro de ofertas,
  ordenação (relevância, menor preço, maior preço, nome e popularidade) e
  paginação de 12 itens; estado refletido na URL.
- `/categoria/[slug]` e `/produto/[slug]` renderizadas dinamicamente para que
  preço e disponibilidade reflitam a data da requisição.
- `/ofertas` lista somente campanhas vigentes.
- Busca do header e da navegação mobile apontando para o catálogo.

### Promoções com vigência
- Campanhas demo em `apps/web/src/lib/promotions.ts`, com `startsAt`, `endsAt`,
  `active`, preço promocional, condições e limite por pedido.
- `getActivePromotion(sku, now)` valida a janela no servidor; expiradas,
  agendadas e inativas são ignoradas.
- Ativas: arroz, picanha, leite, refrigerante e detergente (01/10/2026 a
  31/12/2027). Agendada: feijão (2028). Expirada: café (2025). Inativa: suco.
- O preço efetivo, o preço anterior, o desconto e o limite de 5 unidades são
  aplicados no catálogo, na PDP, no carrinho e no checkout.

### Página de produto e carrinho
- PDP com breadcrumb, marca, descrição, desconto, preço anterior/atual,
  disponibilidade, passo/mínimo/máximo, subtotal imediato e relacionados.
- `/carrinho` com itens, quantidades, subtotais, resumo e progresso de frete grátis.
- Persistência em `localStorage` (`motta-demo-cart-v1`), sincronização entre abas,
  sanitização de dados e limites de estoque/pedido.
- Alterar quantidade, remover item e limpar carrinho.
- Botão de adicionar só é habilitado após a hidratação do carrinho.

### Checkout demonstrativo
- `/checkout` com entrega ou retirada, dados de contato, endereço fictício, janela
  de retirada, preferência de substituição e observações.
- Regras fictícias: pedido mínimo de R$ 30,00, frete de R$ 9,90 e frete grátis a
  partir de R$ 150,00; retirada sem taxa.
- Validação de nome, telefone, e-mail opcional, CEP, rua, número, bairro, cidade e
  UF; erros acessíveis e foco no primeiro campo inválido.
- Ao concluir, gera número fictício `MOTTA-XXXXXX`, limpa o carrinho e mostra a
  confirmação. **Nenhum pagamento é processado e nenhum pedido real é enviado.**

### Pedidos demo
- Persistência local em `motta-demo-orders-v1`, separada do carrinho.
- `/pedidos` lista os pedidos do navegador; `/pedidos/[orderNumber]` mostra
  snapshot dos itens, totais, endereço/retirada, contato, preferências, observações
  e linha do tempo de status.
- `/painel/pedidos` oferece uma prévia da futura fila administrativa, sem
  autenticação e sem banco.
- Status inicial `RECEIVED` ("Recebido"); a mudança de status real fica para a
  Fase 3/4.
- Navegação principal, rodapé e menu mobile apontam para `/pedidos`.

### UI, domínio e testes
- Componentes novos: `OrdersProvider`, `CheckoutView`, `OrdersListView`,
  `OrderDetailView` e `AdminOrdersView`.
- `demo-orders.ts`: criação, numeração, snapshot, parsing e formatação de pedidos.
- `promotions.ts` + preço efetivo no catálogo.
- **67 testes**: 39 de domínio, 21 da loja e 7 de contratos.

### E2E versionado
- `@playwright/test@1.64.1`, `playwright.config.ts` e
  `tests/e2e/commerce.spec.ts`.
- Scripts: `npm run test:e2e` e `npm run test:e2e:ui`.
- Projetos `desktop` (1440×900) e `mobile` (390×844), usando o Chrome instalado
  (`channel: "chrome"`).
- Fluxo crítico coberto: busca → PDP → carrinho → checkout → pedido visível em
  Meus Pedidos e na fila do painel, inclusive após recarregar.
- Cobertura adicional: ofertas vigentes e ausência de overflow horizontal em
  360 px nas rotas principais.

## Validação executada

| Comando | Resultado |
|---|---|
| `npm test` | 67 testes passando |
| `npm run typecheck` | OK em 6 workspaces |
| `npm run db:validate` | Schema válido |
| `npm run lint` | Sem erros |
| `npm run build` | Build de produção OK (11 rotas de página) |
| `npm run test:e2e` | 5 passaram e 1 ignorado por design (teste exclusivo do projeto mobile) |

A migration e o seed continuam **não aplicados** por ausência de `DATABASE_URL`
real neste ambiente.

## Limitações e pendências

1. Pedidos e carrinho vivem apenas no `localStorage`; limpar os dados do navegador
   apaga o histórico e outro dispositivo não enxerga os pedidos.
2. `/painel/pedidos` é uma prévia local sem autenticação, permissões ou alteração
   de status.
3. Checkout não calcula frete real, não reserva estoque, não processa pagamento e
   não emite documento fiscal.
4. A loja usa catálogo e promoções fictícios em código; o banco ainda não alimenta
   as páginas.
5. A suíte E2E usa o Chrome instalado; em CI sem Chrome é preciso instalar o
   Chromium (`npx playwright install chromium`) e ajustar o `channel`.
6. Migration e seed permanecem pendentes de um PostgreSQL real.

## Próximos passos sugeridos

1. Início da Fase 3 (painel administrativo demo com as 8 áreas).
2. Autenticação/RBAC e persistência real de pedidos na Fase 4.
3. Catálogo e promoções vindos do PostgreSQL, com painel de campanhas.
4. Evolução da suíte E2E para CI com navegador gerenciado.

## Informações ainda necessárias do Mercado Motta

- Catálogo oficial, fotos licenciadas e regra de pesagem por item.
- Endereço, horários, telefone/WhatsApp e área de entrega.
- Sistema de caixa/ERP e definição de sistema mestre.
- Provedor de pagamento, política de reembolso e decisão sobre NFC-e.
- Política de substituição, privacidade, termos e canal LGPD.
