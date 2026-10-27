# Questionário — Mercado Motta (Fase 5: Integrações)

**Para:** equipe Mercado Motta
**Assunto:** decisões e documentos que precisamos para ligar pagamentos, mensagens e notas fiscais na loja online
**Tempo de preenchimento:** cerca de 10 minutos
**Como responder:** marque as opções e escreva nas linhas. Onde pedimos senha/chave, **não mande por e-mail normal** — combinamos um canal seguro na reunião.

---

## 1. Pagamento (Pix e cartão)

**1.1. Quais formas de pagamento vocês querem ativar no dia 1?** (pode marcar mais de uma)

- [ ] Pix
- [ ] Cartão de crédito (à vista)
- [ ] Cartão de crédito parcelado — até quanto de parcelas? ______
- [ ] Boleto

**1.2. Onde vocês vão receber o dinheiro?**

- Banco: ______________________ Agência/Conta: ______________________
- CNPJ da conta: ______________________

**1.3. Já existe alguma conta em um provedor de pagamento?**

- [ ] Não, precisamos criar (me diga qual é a primeira opção de vocês: Mercado Pago / Pagar.me / Asaas: __________)
- [ ] Já temos conta em: ______________________

**1.4. Limites e regras que vocês definem:**

- Pedido mínimo hoje: R$ 30,00 — manter? [ ] Sim [ ] Não → quanto: __________
- Quem paga a taxa do Pix/cartão: a loja ou o cliente (repasso)? __________

**1.5. Prazo que o cliente tem para pagar** (se escolhermos mostrar boleto Pix com prazo): ______ minutos

---

## 2. E-mail (confirmação de pedido e recuperação de senha)

**2.1. Qual é o domínio da loja?** (ex.: mercadomotta.com.br) ______________________

**2.2. Quem tem acesso ao DNS desse domínio?** (quem pode adicionar registros junto à registradora/empresa de hospedagem)

- Nome: ______________________ Contato: ______________________

**2.3. De qual endereço os e-mails devem sair?** (ex.: pedidos@mercadomotta.com.br)

- Remetente: ______________________
- Endereço para respostas do cliente: ______________________

**2.4. Quem aprova o texto dos e-mails?** Nome/cargo: ______________________

**2.5. Para avisar a operação interna (estoque baixo, pedido cancelado), qual e-mail usar?** ______________________

---

## 3. WhatsApp

**3.1. Qual número será usado para as mensagens automáticas da loja?**

- Número com DDD: ______________________
- [ ] É um número novo/dedicado
- [ ] É o número da loja em uso hoje (precisamos verificar se é possível usá-lo na automação — pode haver restrição)

**3.2. Quem responde por esse número hoje?** ______________________

**3.3. Quais mensagens vocês querem enviar?** (marque as desejadas)

- [ ] Pedido confirmado
- [ ] Pedido saiu para entrega / está pronto para retirada
- [ ] Pedido cancelado
- [ ] Recuperação de senha
- [ ] Outro: ______________________

**3.4. As mensagens serão enviadas só para quem compra, ou também para divulgação/ofertas?**

- [ ] Só pedidos e atendimento (transacional)
- [ ] Também divulgação/ofertas (isso muda o custo e exige autorização prévia de cada cliente)

**3.5. Precisamos de um texto de autorização no checkout ("aceito receber mensagens no WhatsApp") e uma política de privacidade. Já existe política publicada?** [ ] Sim [ ] Não

---

## 4. Nota fiscal (NFC-e)

> Esse ponto depende do **contador do Mercado Motta**. Pode encaminhar este bloco para ele.

**4.1. Qual é o contador/responsável?**

- Nome: ______________________ E-mail/telefone: ______________________

**4.2. Regime tributário do Mercado Motta:** [ ] Simples Nacional [ ] Lucro Presumido [ ] Lucro Real [ ] Confirmar com o contador

**4.3. Quem emite a nota do consumidor hoje?**

- [ ] O próprio sistema de caixa
- [ ] Um emissor próprio/terceiro: ______________________
- [ ] O contador
- [ ] Ainda não emitimos

**4.4. Precisamos do certificado digital da empresa (arquivo do CNPJ) e do código de segurança (CSC) fornecido pela SEFAZ. Podemos solicitar/pegar com o contador?**

- [ ] Sim, o contador fornece
- [ ] Ainda não temos — orientem o passo a passo

**4.5. Para cada produto vendido online, o contador consegue enviar uma planilha com: código do produto, NCM, CEST (se houver), tributação e alíquota?**

- [ ] Sim, já temos planilha
- [ ] Sim, o contador monta — prazo estimado: ______ dias

**4.6. Quando a nota deve ser emitida?**

- [ ] Assim que o pagamento é aprovado (recomendado)
- [ ] Na separação do pedido
- [ ] Definir com o contador

**4.7. A loja vende para outros estados (atacado/transferência)?** [ ] Sim [ ] Não
(Se sim, há outro tipo de nota a considerar depois.)

---

## 5. ERP / sistema de caixa (sincronização de estoque)

**5.1. Qual sistema de caixa (frente de caixa) vocês usam hoje?**

- Nome e versão: ______________________ Fornecedor: ______________________
- Contato do fornecedor: ______________________

**5.2. Existe um sistema por trás (controle de estoque/fiscal)?** Qual? ______________________

**5.3. Esse sistema permite outro sistema consultar ou receber estoque/preços automaticamente?**

- [ ] Sim, tem integração/consulta
- [ ] Só exporta planilha/relatório
- [ ] Não sabemos — precisamos falar com o fornecedor

**5.4. Como o estoque é atualizado hoje?** ______________________

**5.5. Quem tem a palavra final quando a loja física e a loja online divergirem?** ______________________

**5.6. Números úteis para dimensionar a integração:**

- Produtos ativos (SKUs): ______
- Vendas por dia na loja: ______
- Vendas por dia online (quando houver): ______

---

## 6. Decisões gerais

**6.1. Domínio de produção** (endereço definitivo da loja): ______________________
Quem cuida do DNS/hospedagem: ______________________

**6.2. Qual integração vocês querem primeiro?** (ordene de 1 a 5)

- [ ] Pagamento
- [ ] E-mail de pedidos
- [ ] WhatsApp
- [ ] Nota fiscal
- [ ] Sincronização com o caixa

**6.3. Existe data pretendida para colocar cada uma no ar?** ______________________

**6.4. Aprovação de mensalidades/orçamento** (fornecedor de nota fiscal, WhatsApp, e-mail):

- Quem aprova: ______________________
- Valor mensal disponível: ______________________

**6.5. Melhor contato e disponibilidade para reunião de 30 min:**

- Nome: ______________________ Cargo: ______________________
- Telefone/WhatsApp: ______________________
- Melhor horário: ______________________

---

### Resumo do que vai travar o início do trabalho

| Se | Então não começamos |
| --- | --- |
| Conta de pagamento sem CNPJ aprovado | checkout com pagamento real |
| Sem acesso ao DNS do domínio | e-mails saindo da caixa certa |
| Sem número dedicado + textos aprovados no WhatsApp | mensagens automáticas |
| Sem certificado digital + tributação por produto | emissão de nota |
| Sem resposta sobre o sistema de caixa | sincronização de estoque (neste meio tempo, usamos a margem de segurança + alerta manual) |
