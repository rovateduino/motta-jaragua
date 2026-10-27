# Fase 5 — Planejamento de Integrações

> **Status:** planejamento. **Nenhuma integração real será implementada antes**
> das decisões do cliente (Mercado Motta) e da entrega das credenciais listadas
> no [checklist](#61-checklist-o-que-o-cliente-precisa-fornecer).
>
> Documento de revisão conjunta — as recomendações abaixo estão abertas a
> discussão antes de qualquer linha de código.

---

## 0. Estado atual do código (ponto de partida)

A Fase 4 deixou o núcleo pronto para receber integrações, mas nada externo está
conectado ainda:

| Já existe | Falta (candidato da Fase 5) |
| --- | --- |
| `Order` com `paymentStatus` (default `PENDING`), `status` e histórico de transições | Criação de `Payment` no checkout (hoje o pedido é criado **sem** pagamento associado) |
| `Payment` com `provider`, `providerReference`, `idempotencyKey @unique`, `status`, `amountCents` | Quem escreve esses campos: gateway + webhook |
| `OutboxEvent` (`PENDING/PROCESSING/PROCESSED/FAILED`, `availableAt`, `attempts`) | Worker/fila que consome a outbox e dispara e-mail/WhatsApp |
| `Notification` (`channel` EMAIL/WHATSAPP/SMS, `template`, `payload`, `status`) | Provedores de envio e templates |
| `FiscalDocument` (`provider`, `status`, `accessKey`, `xmlUrl`, `error`) | Emissão NFC-e de verdade + armazenamento do XML |
| Checkout transacional com reserva de estoque (proteção contra overselling **online**) | Sincronização com a loja física / ERP |
| Sessão, RBAC, auditoria (`AuditLog`) nas actions | Rota pública `POST /api/webhooks/*` com validação de assinatura |

**Gaps técnicos identificados:**

- Não existe nenhuma rota em `apps/web/src/app/api/` — o webhook terá de ser a
  primeira API route pública do projeto.
- `Product` **não tem campos fiscais** (NCM, CEST, CST/CSOSN, alíquota, origem
  da mercadoria). Sem eles não há como emitir NFC-e.
- `APP_MODE=demo` controla avisos da interface; a Fase 5 terá de separar
  claramente "modo demonstração" de "modo com integrações reais" para nunca
  disparar efeito colateral real sem querer (e-mails/pagamentos falsos).
- A expiração de reservas de estoque ainda é manual (limitação declarada na
  Fase 4); o ciclo de pagamento é o gatilho natural para automatizá-la.

---

## 1. Pagamento (Pix e cartão)

### 1.1 Comparação de provedores

| Critério | **Mercado Pago** | **Pagar.me** | **Asaas** |
| --- | --- | --- | --- |
| Canais | Pix, cartão (crédito/débito), boleto, carteiras | Pix, cartão, boleto | Pix, cartão, boleto |
| Checkout | **Checkout Transparente + Brick** prontos (o usuário não sai do site) | Checkout próprio + API (transparente) | Checkout Asaas (redireciona) / API de cobrança |
| Pix | Forte, com QR gerado na preferência de pagamento | Forte | Forte (cobrança + QR) |
| Antifraude | Embutido (decisão de risco da conta) | **Embutido e configurável** (vantagem) | Básico/por parceiro |
| Split de recebimento | Sim (marketplace) | **Sim, granular** (split automático) | Sim (split) |
| Webhook | Assinatura HMAC em header (`x-signature`) | Assinatura HMAC (`x-hmac-sha256`) | Token de aplicação + validação por ID |
| Sandbox | Completo (credenciais de teste, cartões de teste) | Completo | Completo e simples de obter |
| SDK oficial | JS/Node | Node | Node |
| Pontos fortes | Maior adesão do consumidor brasileiro, Pix consagrado, conta PJ comum em varejo | Transparência de taxas, API bem documentada, bom para split/antifraude | Cobrança recorrente, Pix+boleto simples, integração rápida |
| Pontos de atenção | Congelamento/holdback de valores em conta nova, taxas por produto (checkout x link x POS) | Menor conhecimento do consumidor final (é "invisible") | Menos "checkout de vitrine" pronto para e-commerce |

> **Taxas:** não fixamos aqui. Alteram por volume, contrato e negociação — pedir
> tabela vigente por escrito ao representante antes de decidir.

**Recomendação provisória:** **Mercado Pago** como primeira escolha (Pix +
cartão + checkout pronto + familiaridade do cliente e do consumidor). Manter
**Pagar.me** como plano B se o cliente pedir split sofisticado ou antifraude com
regras próprias, e **Asaas** se a necessidade dominante for cobrança/boleto.

### 1.2 O que precisamos obter do cliente

- [ ] **CNPJ**, razão social, CNAE e endereço da matriz (cadastro da conta PJ).
- [ ] **Tipo de conta** PJ e status de aprovação/analise do provedor (o
      cadastro de conta nova pode levar dias — é o gargalo clássico).
- [ ] **Conta bancária de recebimento** (agência/conta) e definição de
      liquidação (D+1, D+30 etc.).
- [ ] **Credenciais sandbox**: `public_key`/`access_token` de teste (Mercado
      Pago usa `TEST-...`), nunca as de produção no repositório.
- [ ] **Segredo do webhook** (assinatura HMAC) e URL pública para cadastro —
      exige **domínio HTTPS em produção** (`NEXT_PUBLIC_APP_URL`).
- [ ] Definição de **quem aprova**: o cliente precisa ter a conta verificada e
      com limite liberado antes de irmos para produção.
- [ ] Política desejada: parcelamento (máx. de parcelas, quem absorve juros),
      aceitar Pix, cartão, ou ambos desde o dia 1.

### 1.3 Fluxo proposto (carrinho → checkout → webhook → status)

```
Carrinho (localStorage)
   │  itens + quantidades
   ▼
/checkout ── POST createOrderAction (transação Prisma)
   │            ├─ valida preço/estoque no servidor (já existe)
   │            ├─ cria Order status=RECEIVED, paymentStatus=PENDING (já existe)
   │            ├─ NOVO: cria Payment PENDING + idempotencyKey (ex.: "MOTTA-XXXXXX:pix")
   │            ├─ NOVO: reserva de estoque com prazo de expiração do pagamento
   │            └─ NOVO: grava OutboxEvent "pedido.criado" na mesma transação
   ▼
Preferência de pagamento no provedor (external_reference = orderNumber)
   │            ├─ Pix → mostra QR Code / copia e cola na própria tela
   │            └─ Cartão → Checkout Transparente (iframe/Brick)
   ▼
Provedor aprova/recusa
   ▼
POST /api/webhooks/pagamentos   ← rota pública nova
   ├─ valida assinatura HMAC (segredo do provedor)  → 401 se inválida
   ├─ idempotente: mesmo evento já processado → 200 sem efeito
   ├─ transação única:
   │     Payment.status ← PAID / AUTHORIZED / FAILED / REFUNDED
   │     Order.paymentStatus ← correspondente
   │     se PAID/AUTHORIZED: transição RECEIVED → CONFIRMED
   │       (reaproveita a máquina de status já validada no painel)
   │     se FAILED/expirado: libera reserva de estoque
   │     grava OutboxEvent "pedido.pagamento_confirmado"
   └─ 200 rápido (provedores rejeitam webhook lento)
   ▼
Worker da outbox (novo) consome eventos → envia e-mail + WhatsApp
   └─ falha de envio → tentativas em availableAt/attempts (padrão já previsto)
```

**Pontos de decisão do fluxo:**

- O pedido passa a existir **antes** da aprovação (como hoje) ou só depois?
  Recomendação: manter a criação antes (preserva a reserva de estoque já
  implementada) e usar `paymentStatus` como fonte da verdade do pagamento.
- **Expiração:** definir TTL do Pix/pedido não pago (sugestão: 30 min para Pix,
  15 min para cartão em análise) para liberar estoque automaticamente — resolve
  a limitação aberta da Fase 4.
- **Conciliação/replay:** job periódico que consulta o provedor por pagamentos
  com status "pendente há X minutos" e reprocessa — cobre webhook perdido.
- Ambiente: 100% sandbox até o cliente assinar "podemos ir para produção".

### 1.4 Segurança

- Segredo do webhook **nunca** no repositório (`.env` local, fora do git — já
  é o padrão do projeto).
- Webhook público: validar assinatura **antes** de qualquer consulta ao banco;
  retornar 200 mesmo para eventos desconhecidos (evitar retry infinito).
- Nunca confiar no valor vindo do webhook: conferir `amountCents` com o
  `Payment.amountCents` gravado na criação.
- Auditoria: gravar `AuditLog` nas mudanças de status originadas por webhook
  (ator `SYSTEM`), seguindo o padrão `AuditActorType.SYSTEM` já existente.

---

## 2. E-mail transacional

### 2.1 Provedor recomendado

**Recomendação: Resend.**

- Integração natural com o stack (SDK Node/Next.js, React Email para
  templates), curva mínima, domínio verificado em minutos, tier inicial grátis
  para homologação.
- Alternativas válidas:
  - **Amazon SES** — a mais barata em volume alto, porém exige setup de
    reputação, fila e monitoramento de bounce; melhor quando houver time que
    opere infra.
  - **SendGrid** — robusto, painel de templates e métricas, preço maior e
    onboarding mais burocrático.
- Critério de escolha: **volumes do Mercado Motta** (supermercado regional →
  provavelmente centenas/milhares de e-mails/mês → Resend resolve com folga).

### 2.2 Variáveis de ambiente necessárias

```bash
# E-mail transacional
RESEND_API_KEY=...                 # chave da conta (server-side only)
EMAIL_FROM="Mercado Motta Jaraguá <pedidos@mercadomotta.com.br>"
EMAIL_REPLY_TO="atendimento@mercadomotta.com.br"
ADMIN_NOTIFY_EMAIL="operacao@mercadomotta.com.br"   # cópia de alertas operacionais

# Já existem e passam a ser usadas nos links dos e-mails
NEXT_PUBLIC_APP_URL=https://mercadomotta.com.br
```

Além das variáveis, o **domínio precisa de DNS liberado** para configurar
**SPF, DKIM e DMARC** (sem isso a caixa de entrada do cliente marca como spam).

### 2.3 Templates necessários

| Template | Gatilho | Conteúdo mínimo |
| --- | --- | --- |
| `pedido-recebido` | criação do pedido | número `MOTTA-XXXXXX`, itens, total, prazo, link de acompanhamento |
| `pagamento-aprovado` | webhook `PAID` | meio de pagamento, valor, próximo status (separação) |
| `pedido-em-separacao` | transição administrativa | previsão, itens |
| `pedido-pronto-retirada` / `saiu-para-entrega` | transição administrativa | local/horário ou previsão |
| `pedido-cancelado` | cancelamento + estorno | motivo, prazo do estorno |
| `recuperacao-senha` | esqueci a senha | link assinado com expiração curta (1 h), aviso de não compartilhar |
| `verificacao-email` | cadastro (opcional) | link de confirmação |
| `alerta-estoque-baixo` | regra de estoque (opcional, para a operação) | produto, quantidade atual |

Modelagem já prevista no banco: cada disparo vira um `Notification`
(`channel=EMAIL`, `template`, `payload` JSON) originado de um `OutboxEvent`, ou
seja: reenvio e histórico grátis.

---

## 3. WhatsApp

### 3.1 API Oficial (Meta Cloud API) x BSPs

| | **API Oficial — Meta Cloud API** | **BSPs (Twilio, Zenvia, Take Blip, Wavy...)** |
| --- | --- | --- |
| Quem entrega | Meta, direto | empresa terceira que opera por cima da API oficial |
| Cadastro | Conta WhatsApp Business + verificação Meta Business (CNPJ) + número dedicado | contrato com o BSP; geralmente ajudam no onboarding |
| Templates | aprovados **pela Meta**, com custo por conversa iniciada fora da janela de 24 h | aprovação agilizada pelo painel do BSP (ainda passa pela Meta) |
| Custo | custo por conversa (faixa varia por país/categoria de template) | mesmo custo Meta **+** margem/markup do BSP |
| Janela de 24 h | mensagens gratuitas dentro da janela de atendimento após o usuário escrever | idem |
| Suporte | documentação própria, sem SLA comercial | SLA, suporte em português, painel, relatórios |
| Webhook | oficial (delivery/read status) | pode repassar ou abstrair |
| Ideal para | time técnico, controle total, maior volume | cliente sem time técnico, quer suporte local, multi-canal (SMS + WhatsApp) |

**Recomendação:** começar pela **API Oficial via BSP brasileiro** (Zenvia ou
Take Blip) se o cliente não tiver quem opere integrações — o custo extra é
compensado pelo onboarding e pelo suporte em português. Se houver orçamento
apertado e alguém técnico, ir direto na Meta Cloud API.

### 3.2 O que o cliente precisa fornecer

- [ ] **Número dedicado** para a API (não pode ser o WhatsApp pessoal/loja em
      uso simultâneo no WhatsApp Business App — a porta/regra da Meta proíbe).
- [ ] **Portabilidade de operadora** (se o número estiver em outro provedor) e
      o **código SMS/voz** de verificação durante o porte.
- [ ] Conta **Meta Business verificada com o CNPJ** do Mercado Motta.
- [ ] **Templates (modelos de mensagem)** aprovados com os textos finais:
      confirmação de pedido, pedido saiu para entrega, pedido pronto para
      retirada, código de redefinição de senha. Cada um passa por aprovação
      (dias úteis).
- [ ] Escolha entre **API oficial** e **BSP** (decisão de orçamento).
- [ ] **Base legal/aceite LGPD**: como o cliente captura o consentimento para
      receber mensagens no WhatsApp (checkbox no checkout + política de
      privacidade). Campo `whatsappConsentAt` ainda não existe no modelo
      `Customer` — é um gap a incluir.

---

## 4. Fiscal (NFC-e)

### 4.1 Obrigatoriedade legal

- A **NFC-e (Nota Fiscal de Consumidor Eletrônica)** é a nota obrigatória para
  **vendas ao consumidor final** por estabelecimentos sujeitos à tributação do
  ICMS estadual. Supermercados e minimercados estão tipicamente **nessa
  situação** desde a obrigatoriedade escalonada implantada pelos estados.
- O Mercado Motta está em **Jaraguá do Sul/SC** → a autoridade competente é a
  **SEFAZ-SC** (portal, certificados, CSC, ambiente de homologação e produção).
- O enquadramento exato (contribuinte ou não, Simples Nacional, obrigatoriedade
  por CNAE/faturamento, substituição tributária em categorias específicas) é
  **decisão do contador do cliente** — precisamos dessa resposta por escrito
  antes de codar.
- A NFC-e **não substitui** a NF-e de operações B2B (atacado, transferências
  entre estabelecimentos), que é outro fluxo e **fica fora** do escopo desta
  fase.
- Documentos fiscais e respectivos XMLs devem ser **guardados por 5 anos**.

### 4.2 Dados necessários do cliente

| Item | Descrição | Quem fornece |
| --- | --- | --- |
| **Certificado digital A1** | arquivo `.pfx` do CNPJ + senha, válido (renovado anualmente) | contador/cliente |
| **CSC e ID CSC** | Código de Segurança do Contribuinte registrado na SEFAZ-SC, usado no QR Code | cliente (contador) |
| **CNPJ, IE, IM** | inscrição estadual e municipal do estabelecimento | cliente |
| **Regime tributário** | Simples Nacional (CSOSN) ou Lucro Presumido/Real (CST) | contador |
| **Ambiente** | homologação primeiro, produção depois | — |
| **Dados fiscais por produto** | **NCM, CEST (se ST), CST/CSOSN, origem, alíquota de ICMS** | contador, por produto |
| **CFOPs usuais** | venda ao consumidor final, venda para fora do estado (se houver) | contador |
| **Identificação do consumidor** | regras de quando exigir CPF/CNPJ na nota | contador |
| **Regras de cancelamento** | janela permitida pela SEFAZ-SC e quem autoriza | contador |

### 4.3 Emissor recomendado

| Opção | Prós | Contras |
| --- | --- | --- |
| **Focus NFe** | API madura, planos acessíveis, foco em integração, bom suporte técnico | custo mensal adicional |
| **Nuvem Fiscal** | API simples e documentada, plano inicial barato | menos recursos avançados |
| **Emissão pelo ERP do cliente** | zero integração nova se o ERP já emite | depende da qualidade da API do ERP e da licença |
| **Integração direta com a SEFAZ** | sem mensalidade | **não recomendado**: assinatura, inutilização, carta de correção, cancelamento, versionamento de layout e certificados — muito custo próprio |

**Recomendação:** usar um **emissor por API (Focus NFe ou Nuvem Fiscal)**,
salvo se o ERP do cliente já emitir NFC-e e tiver API documentada (aí usar o
ERP evita duplicar cadastro fiscal).

### 4.4 Gaps no modelo atual

- `Product` sem **NCM/CEST/CST/origem/alíquota** → migration Prisma + formulário
  do painel + importação em lote a partir de planilha do contador.
- `FiscalDocument` existe, mas falta: **número/série, protocolo de autorização,
  chave de acesso (preenchida), XML armazenado, status de cancelamento e carta
  de correção**.
- Fluxo: emissão **assíncrona** (o pedido não pode esperar a SEFAZ) → OutboxEvent
  `pedido.pago` → job emite → grava `FiscalDocument` → notifica cliente.
- **Quando emitir:** definição do momento da emissão (na confirmação do pagamento
  é o padrão; alguns emitem na separação) — decisão do contador.

---

## 5. ERP / POS (sincronização com a loja física)

### 5.1 Perguntas para o Mercado Motta

Operação atual:

1. **Qual sistema de caixa (PDV) vocês usam hoje?** Nome, versão e fornecedor.
2. Existe **ERP** por trás (contábil/fiscal)? Qual — TOTVS, Conta Azul, Bling,
   Tiny, SAP, sistema próprio?
3. O sistema de caixa **tem API/integração documentada**? Quem fornece (o
   fornecedor ou o contador)?
4. Como o **estoque** é atualizado hoje? (caixa, planilha, sistema próprio)
5. Quem emite a **NFC-e** hoje: o próprio caixa, o ERP ou o contador?
6. Como são feitos **preço e promoção**: regra por loja, por período, quem
   altera?

Integração:

7. Há **exportação periódica** de produtos/estoque (CSV, relatório, API)?
8. Qual a **frequência aceitável** de divergência de estoque? (ex.: venda na
   loja às 14h07 e compra online às 14h08)
9. **Sob quem pesa a palavra final** do estoque: loja física ou online?
10. Há **máquina de cartão** e conciliação a considerar?
11. Quem é o **responsável técnico** (fornecedor do sistema) para a gente falar?
12. Quantos **SKUs** ativos e quantas **vendas/dia** por canal?

### 5.2 O risco de vender produto que acabou de esgotar na loja física

Hoje a proteção é **parcial**:

- A reserva feita no checkout protege contra overselling **entre compradores
  online** (o `UPDATE` com guarda em `onHand - reserved`).
- **Não protege** contra a loja física: o caixa baixa o estoque no sistema
  local, e o banco online continua mostrando o valor antigo até alguém editar
  pelo painel.

**Consequências concretas:**

1. **Venda fantasma:** cliente paga, o item não existe → cancelamento manual,
   estorno, crédito — e um pedido fiscal possivelmente já emitido exige
   cancelamento/inutilização dentro do prazo da SEFAZ.
2. **Custo operacional:** tempo da equipe em separar, ligar, estornar; em
   supermercado, item de giro alto (arroz/óleo/leite) esgota em minutos no
   horário de pico.
3. **Confiança:** a loja física é o principal canal do Mercado Motta; a
   experiência online ruim derruba a recompra.
4. **Excesso oposto (estoque "fantasma" para baixo):** se a sincronização
   errar para menos, paramos de vender produto que está na prateleira — perda de
   receita silenciosa.

**Mitigação em etapas (recomendada):**

- **Etapa 0 (sem ERP):** estoque online com **margem de segurança** (ex.: usar
  90% do saldo online, reservando 10% para a loja) + alerta de divergência no
  painel + atualização manual já existente. Reduz muito o estrago enquanto a
  integração não existe.
- **Etapa 1:** **sincronização periódica** (a cada 5–15 min) via API/CSV do PDV,
  com log de execução e notificação quando falhar.
- **Etapa 2:** **webhook/evento do PDV** (se o sistema suportar) para atualizar
  em segundos + **reconciliação noturna** que fecha divergências.
- **Etapa 3:** unificação de preço e promoção nos dois sentidos (online →
  caixa), que normalmente é a parte mais política da integração.

---

## 6. Próximos passos

### 6.1 Checklist: o que o cliente precisa fornecer

**Decisões (podem ser dadas por e-mail, sem senha):**

- [ ] Qual canal de pagamento saiu: **Mercado Pago / Pagar.me / Asaas**.
- [ ] Qual e-mail transacional: **Resend / SES / SendGrid** + quem controla o
      DNS do domínio.
- [ ] WhatsApp: **API oficial ou BSP**; se BSP, quem decide o orçamento.
- [ ] Fiscal: **emissor (Focus NFe / Nuvem Fiscal / ERP do cliente)**.
- [ ] ERP/POS: respostas às 12 perguntas da seção 5.1.
- [ ] **Ordem de prioridade** das integrações (ver 6.2) e data-alvo de cada uma.
- [ ] Confirmação do **domínio de produção** e liberar DNS (SPF/DKIM/DMARC,
      cadastro do webhook).

**Credenciais e documentos (entregar em ambiente seguro, nunca por repositório):**

- [ ] Pagamento: CNPJ, dados bancários, aprovação da conta PJ, `access_token`/
      `public_key` de **sandbox**, **segredo do webhook**.
- [ ] E-mail: API key do provedor, remetente verificado, acesso (ou suporte) ao
      DNS.
- [ ] WhatsApp: número dedicado + porte, verificação Meta Business, textos dos
      templates aprovados, base legal/aceite LGPD.
- [ ] Fiscal: **certificado A1 (.pfx) + senha**, **CSC + ID CSC**, CNPJ/IE/IM,
      regime tributário, **NCM/CEST/CST/CSOSN por produto**, regras de
      cancelamento.
- [ ] ERP: contato do fornecedor do sistema, credenciais de leitura (API/CSV),
      horários de movimentação da loja.

**Alinhamento de escopo (30 min de reunião resolvem):**

- [ ] Quando emitir NFC-e (pagamento aprovado × separação).
- [ ] TTL de expiração do pedido não pago e quem libera a reserva.
- [ ] Quem redige/aprova os textos de e-mail e WhatsApp.
- [ ] Política de parcelamento e se o Pix é obrigatório desde o dia 1.

### 6.2 Ordem sugerida de implementação

1. **E-mail transacional** — menor dependência (só domínio + API key), entrega
   visível imediata e beneficia já a operação atual (confirmação de pedido e
   recuperação de senha).
2. **Pagamento (Pix + cartão)** — coração comercial; depende de conta aprovada
   (gargalo de dias) → iniciar o cadastro **hoje**, mesmo antes de codar.
3. **WhatsApp** — depende de aprovação de templates pela Meta (dias úteis);
   entrar na fila assim que a escolha de BSP/API estiver feita.
4. **Fiscal (NFC-e)** — maior dependência de dados do contador (NCM por
   produto); pode ser feita em paralelo com 2 e 3 enquanto os dados chegam.
5. **ERP/POS** — última, por depender do fornecedor do sistema do cliente; a
   Etapa 0 (margem de segurança + alerta) cobre o intervalo.

### 6.3 Decisões que precisamos AGORA (antes de qualquer código)

1. Provedor de pagamento e status da conta PJ (mesmo "vamos iniciar o cadastro").
2. Domínio de produção + quem tem acesso ao DNS.
3. Provedor de e-mail e liberação do DNS (SPF/DKIM/DMARC).
4. WhatsApp: API oficial ou BSP, e quem aprova os textos.
5. Fiscal: contador + emissor escolhido + planilha de NCM/CEST.
6. Orçamento/a-provação do cliente para as mensalidades (emissor fiscal, BSP,
   e-mail) — sem isso a Fase 5 fica travada mesmo com código pronto.

---

*Documento gerado no início da Fase 5. Revisar com o cliente e atualizar as
decisões marcadas antes de iniciar a implementação.*
