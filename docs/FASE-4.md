# Fase 4 — Núcleo real

## Objetivo

Conectar a loja e o painel administrativo ao PostgreSQL por meio do Prisma,
mantendo operações sensíveis no servidor e protegendo rotas/actions com sessão e
RBAC.

## Entregas

- **Catálogo:** páginas de loja, categorias, busca e ofertas leem produtos, preços,
  estoque e promoções do banco. O painel cria e edita produtos, controla preço,
  estoque e disponibilidade; mudanças são auditadas e revalidadas na loja.
- **Checkout e pedidos:** o servidor valida novamente catálogo, preço e quantidade,
  cria pedidos e itens com snapshots e reserva estoque em transação. `/pedidos`,
  detalhes do cliente, fila administrativa e detalhes do painel consultam pedidos
  persistidos.
- **Status e estoque:** o painel valida transições permitidas. A atualização do
  pedido, histórico, `AuditLog` e baixa/liberação da reserva de estoque ocorrem na
  mesma transação. Uma divergência de reserva aborta a transição inteira.
- **Ofertas:** CRUD e ativação de promoções persistidos, com validação de preço
  inferior ao preço base e datas de vigência; a vitrine pública respeita a janela.
- **Painel:** dashboard e relatórios calculam vendas, ticket médio, cancelamentos,
  tempos de separação, produtos mais vendidos, estoque baixo e desempenho de
  promoções a partir de registros da loja ativa.
- **Clientes e entregas:** telas administrativas carregam pedidos/clientes do banco
  e limitam as consultas à loja ativa.
- **Configurações:** dados da loja, frete, pedido mínimo e canais de atendimento são
  persistidos e auditados.
- **Remoção do modo local administrativo:** stores, providers, seeds e testes
  auxiliares de comércio demo não são mais utilizados; o carrinho local do cliente
  permanece para a experiência de compra.

## Segurança e consistência

- As páginas verificam permissões administrativas e as server actions repetem a
  autorização antes de escrever.
- As entradas de mutação são validadas com Zod.
- Escritas importantes e seus registros de auditoria são transacionais.
- A reserva usa atualização condicional para impedir overselling; não se pode
  reduzir o estoque abaixo do reservado.
- Produtos com histórico de pedidos não podem ser excluídos; devem ser desativados.

## Validação

- Passaram: `npm run typecheck`, `npm run lint` e `npm test`.
- Pendente: `npm run test:e2e` no ambiente local com PostgreSQL/Chrome configurados.

## Limitações remanescentes

- Não há integração de pagamentos, entrega, notificações, emissão fiscal ou ERP.
- Reservas ainda dependem de cancelamento administrativo; expiração automática será
  tratada com o ciclo de pagamentos/integrações.
- O painel opera sobre a primeira loja ativa; não existe RBAC com escopo por loja.
- O carrinho continua armazenado localmente e não sincroniza entre dispositivos.
