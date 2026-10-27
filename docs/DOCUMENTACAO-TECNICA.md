# Documentação Técnica — Mercado Motta Jaraguá

**Tipo:** Manual do desenvolvedor e dossiê técnico de entrega  
**Escopo:** Aplicação web, painel administrativo, persistência de dados e integrações preparadas  
**Estado documentado:** núcleo de loja e administração integrado ao PostgreSQL; integrações operacionais externas permanecem pendentes.

## 1. Visão geral do projeto

O Mercado Motta Jaraguá é uma plataforma web de comércio eletrônico para uma
operação de supermercado. Reúne uma loja responsiva voltada aos clientes e um
painel autenticado para a equipe. Catálogo, preços, promoções, estoque,
configurações da loja e pedidos são lidos e/ou gravados no PostgreSQL.

O objetivo do sistema é permitir a consulta de produtos e ofertas, a criação de
pedidos com validação e reserva de estoque no servidor e a operação diária da
loja por usuários administrativos com permissões distintas.

### Funcionalidades entregues

| Área | Funcionalidades |
|---|---|
| Loja | Home, navegação por departamentos, catálogo, busca, filtros, ordenação, paginação, páginas de produto e ofertas vigentes. Imagens cadastradas podem ser carregadas pelo navegador a partir de URLs públicas. |
| Carrinho e checkout | Carrinho local no navegador; validação de dados; cálculo de preço, promoção, pedido mínimo e frete no servidor; seleção de entrega ou retirada; criação de pedido e reserva transacional de estoque. |
| Conta e pedidos | Cadastro e login de clientes, sessão persistente, consulta dos próprios pedidos e visualização de detalhes e histórico de status. |
| Painel administrativo | Dashboard e telas para pedidos, produtos, estoque, promoções, clientes, entregas, relatórios, configurações da loja, usuários e papéis. A visibilidade e as operações são limitadas por permissões. |
| Imagens | Upload administrativo de imagens de produto para Supabase Storage, com verificação de formato e tamanho e registro da URL pública no produto. |
| Auditoria | Registro de operações administrativas e eventos importantes, incluindo alterações, anonimização e expiração de reserva. |
| Privacidade | Consentimentos de marketing e WhatsApp armazenados separadamente; anonimização operacional de clientes sem apagar o histórico de pedidos. |
| Integrações preparadas | Schema e interfaces para pagamentos, notificações, outbox e documentos fiscais. Esses componentes de infraestrutura não significam que um provedor externo esteja integrado ou processando transações. |

O frontend usa dados persistidos para as telas operacionais. A presença de
entidades ou rotas preparadas para integrações não implica ativação de
pagamentos, emissão fiscal, entrega ou envio de mensagens.

## 2. Arquitetura e stack

### Monorepo

O repositório é um monorepo npm com workspaces:

```text
apps/web/                 Aplicação Next.js: loja, painel, páginas e API
packages/contracts/       Tipos de DTOs e validações compartilhadas
packages/db/              Prisma Client, schema, migrations e seed
packages/domain/          Regras de negócio puras e cálculos
packages/integrations/    Interfaces e adapters para integrações externas
packages/ui/              Design system compartilhado
tests/e2e/                Testes ponta a ponta com Playwright
docs/                     Documentação funcional e técnica
```

### Frontend

- **Next.js 15**, **React 19** e **TypeScript**.
- **Tailwind CSS 3.4** para estilos e tokens visuais.
- O **App Router** organiza as rotas como diretórios e arquivos em
  `apps/web/src/app`. `page.tsx` declara páginas, `layout.tsx` compartilha
  estrutura, metadata e providers, e `route.ts` implementa endpoints HTTP.
- Páginas e layouts de servidor fazem leituras no banco e entregam dados aos
  componentes de apresentação. Componentes que precisam de estado ou eventos do
  navegador são marcados como Client Components (`"use client"`).
- A loja pública e o painel usam layouts/componentes compartilhados para manter
  navegação e apresentação consistentes. As rotas operacionais consultam o
  catálogo e as configurações por meio de módulos server-only.

### Backend da aplicação

- **Server Actions** executam operações iniciadas pela interface, como login,
  alteração de produtos, gestão de pedidos, configurações e checkout.
- As ações validam entradas (com Zod quando aplicável), verificam sessão e
  autorização no servidor, executam operações Prisma e revalidam as rotas
  afetadas.
- **Route Handlers** atendem integrações HTTP. Entre eles:
  - `POST /api/webhooks/pagamentos`: valida assinatura HMAC-SHA256 com
    `PAYMENT_WEBHOOK_SECRET`. Atualmente valida e confirma o recebimento do
    evento; ainda não altera pagamento ou pedido nem integra um provedor.
  - `GET /api/cron/expire-reservations`: cancela pedidos pendentes expirados e
    libera reservas de estoque.
- A camada `packages/domain` centraliza cálculos e transições de negócio sem
  depender da interface ou de acesso a dados; `packages/contracts` compartilha
  estruturas e validações.

### Banco de dados e ORM

- **PostgreSQL**, provisionado no ambiente de produção em **Neon**.
- **Prisma ORM 6** para consultas, transações, migrations e geração do cliente.
- `DATABASE_URL` é a conexão de runtime; no Neon deve usar a conexão pooled.
- `DIRECT_URL` é a conexão direta usada por operações administrativas do Prisma,
  como migrations e introspecção.
- A aplicação separa as leituras de catálogo, pedidos e administração em módulos
  server-only, para não expor o Prisma ao bundle do navegador.

### Armazenamento de imagens

O upload de imagens de produtos usa **Supabase Storage**, no bucket público
`product-images`. A Server Action exige a permissão `products.write`, aceita
JPG, PNG e WebP, valida a assinatura binária do formato, limita o arquivo a
2 MiB e gera um nome UUID sem sobrescrever arquivos. O banco guarda a URL
pública no campo `Product.imageUrl`; a loja renderiza essa URL quando válida.

### Infraestrutura e rotinas

- **Vercel:** hospedagem da aplicação Next.js e execução do deploy ligado ao
  repositório GitHub (CI/CD).
- **Vercel Cron:** `vercel.json` agenda
  `/api/cron/expire-reservations` diariamente às 03:00 UTC. No plano Hobby,
  essa agenda funciona como uma execução diária de segurança.
- **Cron-job.org:** a rotina prevê chamadas externas mais frequentes (a cada
  10 minutos), enviando `Authorization: Bearer <CRON_SECRET>` ao mesmo endpoint.
  A configuração da tarefa e do segredo é feita no ambiente de implantação; o
  repositório não contém credenciais.
- O endpoint processa no máximo 100 pedidos candidatos em uma execução.

## 3. Modelagem de dados

O schema principal está em `packages/db/prisma/schema.prisma`. As entidades
mais relevantes são:

| Entidade | Responsabilidade |
|---|---|
| `Store` | Dados de uma loja, endereço, telefone, fuso horário e estado de ativação. Estoque, preço, ofertas e pedidos são relacionados à loja. |
| `Category` | Departamentos e categorias hierárquicas do catálogo. |
| `Product` | Cadastro de produto, SKU, nome, descrição, marca, categoria, unidade, dados fiscais e URL da imagem. |
| `Price` | Preço base vigente do produto para uma loja, armazenado em centavos. |
| `Promotion` | Preço promocional, período de vigência, estado, condições e limite por pedido. |
| `Inventory` | Saldo físico, quantidade reservada e ponto de reposição do produto por loja. |
| `InventoryMovement` | Livro de movimentos de estoque (compra, venda, ajuste, perda, reserva, liberação etc.), com referência e ator quando aplicável. |
| `Customer` | Conta do cliente, credenciais em hash, dados de contato, consentimentos e marca de anonimização. |
| `Address` | Endereços vinculados ao cliente; podem ser removidos durante a anonimização. |
| `Cart` / `CartItem` | Estrutura de carrinho persistido disponível no schema. A experiência atual do carrinho da loja mantém os itens no navegador. |
| `Order` | Pedido, loja e cliente associados, modalidade, status, snapshot de endereço, contato e totais financeiros. |
| `OrderItem` | Itens do pedido com snapshot de nome, unidade, preço e quantidade para preservar o histórico. |
| `OrderStatusHistory` | Histórico cronológico de alterações de status e notas. |
| `DeliverySlot` | Janela de entrega/retirada por loja, com capacidade e capacidade reservada. |
| `AdminUser` | Conta administrativa ativa/inativa, credenciais e associações a papéis. |
| `Role`, `Permission`, `AdminUserRole`, `RolePermission` | Relações muitos-para-muitos que compõem o controle de acesso RBAC. |
| `AuthSession` | Sessões de clientes ou administradores; armazena o hash do token, expiração e metadados da requisição. |
| `AuditLog` | Trilha de auditoria com ator, ação, entidade, valores anteriores/posteriores e metadados. |
| `IdempotencyKey` | Chaves únicas, escopo, hash da requisição, resposta em cache e validade, usadas para evitar duplicidade no checkout. |
| `Payment` | Estrutura para pagamentos associados a pedidos, referências externas, estado, valor e chave idempotente. Não indica integração de pagamento ativa. |
| `OutboxEvent` | Eventos duráveis e estado de processamento para integrações assíncronas futuras. |
| `Notification` | Estado e dados de mensagens por canal (e-mail, WhatsApp ou SMS); não realiza envio sozinho. |
| `FiscalDocument` | Estrutura para documento fiscal, provedor, chave de acesso, XML, estado e erro. A emissão depende de integração futura. |
| `Setting` | Configurações chave/valor, como nome e horário da loja, frete e pedido mínimo. |

### Precisão monetária e de quantidades

Valores monetários são inteiros em **centavos**, nunca `float`. Por exemplo,
R$ 12,34 é representado por `1234`. Isso evita erros de arredondamento binário
em somas, descontos e comparações.

Quantidades são inteiros em **milésimos da unidade de venda**. `1000`
corresponde a uma unidade inteira; para produtos vendidos por peso, `500`
representa 500 g quando a unidade é kg. Os preços por linha são calculados
com aritmética inteira pelas funções de domínio e formatados como moeda apenas
na apresentação.

O modelo permite várias lojas: preços, estoque, promoções e janelas são
associados a `storeId`. Os pedidos preservam snapshots para não depender de
alterações futuras no cadastro do produto.

## 4. Mecanismos de segurança

### Autenticação e sessão

- Clientes e administradores possuem fluxos de login separados.
- As senhas são armazenadas com **Argon2id** (`@node-rs/argon2`), não em texto
  claro. A configuração atual usa memória 19.456 KiB, duas iterações e
  paralelismo 1.
- Após autenticação, o servidor gera um token aleatório de 32 bytes. O cookie
  contém o token, enquanto o banco armazena somente seu SHA-256 em
  `AuthSession.tokenHash`.
- Os cookies são `httpOnly`, `sameSite=lax`, `path=/` e recebem `secure` em
  produção. A validade configurada é de 30 dias para clientes e 8 horas para
  administradores.
- Cada leitura de sessão verifica existência e expiração; contas administrativas
  inativas e clientes anonimizados não são aceitos. Encerrar a sessão remove o
  registro e o cookie.
- O login aplica limitação de tentativas por IP e e-mail em memória do processo.
  Para ambientes com múltiplas instâncias, recomenda-se avaliar armazenamento
  compartilhado para que a limitação seja distribuída.

### RBAC

O acesso administrativo combina papéis e permissões:

1. `AdminUserRole` associa usuários a papéis.
2. `RolePermission` associa cada papel a permissões como `orders.read`,
   `products.write`, `customers.manage` e `settings.write`.
3. As páginas administrativas usam `requireAdminPermission`; as Server Actions
   verificam `requireAdminAction`. A autorização ocorre no servidor, não apenas
   por ocultação de links.
4. As permissões efetivas são carregadas da sessão e usadas para montar a
   navegação visível.

O seed define papéis iniciais como `ADMIN`, `MANAGER`, `PICKER`, `DRIVER`,
`SUPPORT` e `FINANCE`. O seed atual não cria administradores. O cadastro inicial
administrativo fica disponível somente enquanto não existe usuário admin.

### Webhook e cron

- O webhook exige `PAYMENT_WEBHOOK_SECRET` e compara a assinatura HMAC-SHA256
  do corpo bruto usando comparação de tempo constante. Sem segredo responde
  `503`; assinatura ausente ou inválida responde `401`.
- A rota de expiração compara o header `Authorization` com
  `Bearer <CRON_SECRET>`. Em produção, a ausência de segredo não libera a rota;
  fora de produção, pode ser chamada sem autenticação para desenvolvimento e
  E2E.
- Segredos devem ser provisionados como variáveis de ambiente na Vercel e no
  Cron-job.org conforme a função de cada serviço. Nunca devem ser versionados.

### LGPD e minimização

- O cadastro registra consentimento de marketing, e o modelo mantém campo
  separado para consentimento de WhatsApp.
- A operação de anonimização do cliente roda em transação: remove endereços e
  sessões, substitui nome e e-mail por valores neutros, elimina telefone, hash
  de senha e datas de consentimento, e preenche `anonymizedAt`.
- O cliente anonimizado não pode iniciar nova sessão; o registro do cliente é
  mantido sem os dados pessoais para preservar vínculos e histórico de pedidos.
- O evento é registrado em `AuditLog`; o histórico operacional do pedido é
  preservado.

Esse mecanismo é uma capacidade técnica do sistema, não substitui revisão
jurídica de bases legais, prazos de retenção, política de privacidade, direitos
dos titulares e contratos com operadores.

## 5. Regras de negócio críticas

### Checkout e reserva de estoque

1. O checkout exige cliente autenticado e valida os dados recebidos no servidor.
2. Dentro de uma transação, o backend consulta os produtos ativos, preços,
   estoque e promoções vigentes no banco. Não confia no valor exibido ou enviado
   pelo navegador.
3. A promoção só é aplicada se estiver ativa, dentro da janela de vigência e
   abaixo do preço base.
4. O subtotal e o total são recalculados no servidor. Se o pedido não alcançar
   o valor mínimo configurado, o checkout falha sem criar pedido.
5. O estoque disponível é `onHand - reserved`. Um `UPDATE` condicional só soma
   à reserva se o saldo disponível for suficiente. Isso evita que pedidos
   concorrentes reservem as mesmas unidades.
6. Pedido, itens, histórico inicial, movimentos de reserva e chave idempotente
   são gravados na transação. Se uma etapa falhar, a transação não deve deixar
   um pedido parcialmente criado.
7. Uma reserva fica válida por **30 minutos**. Pedidos ainda em estado
   `RECEIVED`, com pagamento `PENDING`, sem exclusão operacional e além do
   prazo, são cancelados pelo cron e têm suas quantidades liberadas em
   transação. O processo atual limita cada execução a 100 pedidos candidatos.

### Idempotência do checkout

A chave idempotente é um SHA-256 determinístico do cliente e do conteúdo do
carrinho. Os itens são agregados por produto e ordenados, então a ordem das
linhas não altera a chave. Dentro da validade de 30 minutos, reenviar o mesmo
carrinho devolve o número e o total do pedido já criado, em vez de reservar
estoque ou gerar outro pedido. Uma restrição única no banco arbitra duas
requisições concorrentes; a perdedora recupera a resposta da primeira.

### Frete e pedido mínimo

As regras são consultadas em `Setting` e carregadas pela leitura de
configurações da loja:

- Se o subtotal for menor que `order.minimumCents`, o pedido não é criado.
- Para entrega, se `delivery.freeAboveCents` for maior que zero e o subtotal
  alcançar esse limite, a taxa é zero; caso contrário aplica-se
  `delivery.feeCents`.
- Para retirada, não há taxa de entrega.
- Os valores permanecem em centavos e são verificados novamente dentro da
  operação de checkout.

## 6. Deploy e manutenção

### Desenvolvimento local

Requisitos: Node.js `>=20.9`, npm `>=10` e, para E2E, navegador compatível com
Playwright. Um PostgreSQL é necessário para executar os fluxos completos da
aplicação local.

```powershell
npm install
# Configurar .env com DATABASE_URL e DIRECT_URL (sem compartilhar credenciais)
npm run db:validate
npm run db:migrate
npm run db:seed
npm run dev
```

O seed popula dados iniciais de catálogo e operação, mas não cria usuário
administrativo. Use `/admin/cadastro` para criar o primeiro admin quando ainda
não houver nenhum.

### CI/CD e deploy

O workflow `.github/workflows/ci.yml` é acionado em push para `main` e em
pull requests. Ele instala dependências e executa validação Prisma, typecheck,
lint, testes Vitest, build e, em job separado, testes E2E em SQLite com
Chromium. Os deployments da Vercel são disparados pela integração do
repositório GitHub com o projeto Vercel; confirme as configurações de produção,
preview e variáveis no painel da plataforma.

`vercel.json` define o comando de build e o cron diário. A promoção de uma
versão à produção depende das regras de branch e deploy configuradas no
projeto Vercel.

### Testes e comandos úteis

```powershell
npm run typecheck        # TypeScript de todos os workspaces
npm run lint             # ESLint dos workspaces com script de lint
npm test                 # Vitest em todos os workspaces compatíveis
npm run build            # Build de produção Next.js
npm run test:e2e         # Playwright contra servidor configurado
npm run test:e2e:local   # Prepara SQLite de teste e executa Playwright
npm run db:validate      # Valida o schema Prisma
npm run db:generate      # Gera o Prisma Client
npm run db:migrate       # Aplica migrations existentes
npm run db:migrate:dev   # Cria/aplica migrations em desenvolvimento
npm run db:seed          # Popula dados iniciais
```

O Playwright injeta `DATABASE_URL` apontando para
`packages/db/prisma/test.db` e inicia a aplicação em uma porta local de teste.
Isso permite E2E sem tocar no banco PostgreSQL de produção. Não execute scripts
de preparação de E2E com uma URL de produção.

### Variáveis de ambiente essenciais

Copie `.env.example` para `.env` no desenvolvimento. Os valores são específicos
por ambiente e devem ser mantidos no gerenciador de segredos da plataforma.

| Variável | Finalidade |
|---|---|
| `APP_MODE` | Define o modo da aplicação (`production` ou modo local/teste); influencia metadata de indexação e proteções específicas de produção. |
| `DATABASE_URL` | Conexão PostgreSQL pooled usada em runtime. |
| `DIRECT_URL` | Conexão PostgreSQL direta usada pelo Prisma CLI para operações de schema. |
| `NEXT_PUBLIC_APP_URL` | URL pública usada em metadata e links absolutos. |
| `NEXT_PUBLIC_APP_NAME` | Nome público da aplicação. |
| `CRON_SECRET` | Bearer secret exigido pelo endpoint de expiração em produção. |
| `SUPABASE_URL` | URL do projeto Supabase usado pelo upload de imagens. |
| `SUPABASE_SERVICE_ROLE_KEY` | Credencial de servidor para upload no Storage; nunca expor ao navegador. |
| `PAYMENT_WEBHOOK_SECRET` | Segredo HMAC do webhook de pagamento preparado. |
| `PAYMENT_*`, `WHATSAPP_*`, `EMAIL_*`, `FISCAL_*`, `ERP_*` | Variáveis de provedores planejadas para integrações futuras; configurar somente quando os serviços forem escolhidos e implementados. |

Não publique valores de variáveis, tokens, strings de conexão, chaves privadas
ou o conteúdo do `.env` em documentação, logs ou commits.

### Rotinas operacionais

- Aplicar migrations existentes com `npm run db:migrate` antes de uma versão
  que dependa delas.
- Confirmar saúde e permissões do PostgreSQL, Storage, Vercel e rotina externa
  do cron após mudanças de configuração.
- Antes da entrada em produção, criar contas administrativas reais e desativar
  contas antigas de demonstração que eventualmente existam em bancos legados.
- Revisar `AuditLog`, falhas reportadas pelas rotas e os relatórios gerados pelo
  Playwright após deploys.

## 7. Fora do escopo atual — Fases 5 e 6

O núcleo da loja e do painel persiste dados, mas as seguintes integrações e
atividades ainda dependem de definição, credenciais, contratos e validação do
cliente:

| Item | Situação |
|---|---|
| Pagamentos / Pix | Provedor ainda não escolhido/integrado. O checkout cria pedidos e reservas; a rota webhook apenas valida HMAC e não confirma pagamento nem atualiza `Payment`/`Order`. |
| E-mail transacional | Sem provedor, templates e envio implementados. |
| WhatsApp | Sem provedor, templates, política de envio ou automação implementados; o modelo de consentimento já existe. |
| Nota fiscal / NFC-e | A entidade e campos fiscais estão preparados, mas emissão, certificado, regras fiscais e integração contábil não estão implementados. Dependem do contador e do provedor fiscal. |
| ERP / POS | Sem integração de catálogo, preço, estoque ou pedidos com o sistema de retaguarda. Dependem da identificação do ERP e de contratos/API. |
| Integração logística | Não há cálculo de cobertura, roteirização ou integração com transportadora/entrega. As janelas e regras locais de entrega devem ser validadas pelo cliente. |
| Go-live e operação | Revisões finais de segurança, acessibilidade, observabilidade, privacidade, retenção de dados e processo de suporte/operação devem ser concluídas antes da entrada comercial. |

O schema contém `Payment`, `OutboxEvent`, `Notification` e `FiscalDocument`
para apoiar futuras implementações, mas a existência dessas tabelas não equivale
a uma integração funcional. A ativação comercial deve ocorrer somente após
escolha e configuração dos fornecedores, credenciais, testes ponta a ponta e
aprovação das regras de negócio pelo Mercado Motta.

## Referências internas

- Schema: `packages/db/prisma/schema.prisma`
- Configuração do Prisma: `packages/db/prisma.config.ts`
- CI: `.github/workflows/ci.yml`
- Cron da Vercel: `vercel.json`
- Testes E2E: `playwright.config.ts` e `tests/e2e/`
- Variáveis documentadas: `.env.example`
- Planejamento das integrações: `docs/FASE-5-PLANEJAMENTO.md`
