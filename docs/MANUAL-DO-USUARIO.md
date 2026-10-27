# Manual do Usuário — Painel do Mercado Motta Jaraguá

**Versão:** 1.0
**Última atualização:** 27/10/2026

Este manual foi feito para a equipe do mercado. A ideia é ser simples e direto: cada seção mostra **onde clicar** e **o que acontece** em seguida. Não é preciso entender de informática para usar o painel.

> 💡 **Dica:** salve o endereço do painel nos favoritos do navegador. Assim você não precisa procurar o link todos os dias.

---

## Sumário

1. [Introdução](#1-introdução)
2. [Primeiros passos (acesso)](#2-primeiros-passos-acesso)
3. [Produtos e imagens](#3-produtos-e-imagens)
4. [Ofertas](#4-ofertas)
5. [Pedidos](#5-pedidos)
6. [Clientes e LGPD](#6-clientes-e-lgpd)
7. [Dashboard e relatórios](#7-dashboard-e-relatórios)
8. [Configurações da loja](#8-configurações-da-loja)
9. [Dúvidas frequentes (FAQ)](#9-dúvidas-frequentes-faq)
10. [Boas práticas do dia a dia](#10-boas-práticas-do-dia-a-dia)

---

## 1. Introdução

### O que é o painel

O **painel** é a área de gestão do Mercado Motta Jaraguá. É por ele que a equipe:

- cadastra e atualiza **produtos**;
- controla **estoque** e **fotos** dos produtos;
- cria **ofertas** e promoções;
- acompanha e atualiza **pedidos**;
- organiza as **entregas**;
- consulta **clientes** e relatórios;
- cria **acessos** para os colaboradores.

A **loja** (site) é o lado do cliente: ele escolhe os produtos, monta o carrinho e finaliza o pedido. O painel é o lado da equipe: tudo o que o cliente faz aparece aqui.

> ✅ **Importante:** o que você altera no painel vale na hora para a loja. Se um produto é desativado, ele deixa de aparecer para o cliente. Se o preço muda, o novo preço passa a valer no próximo acesso à loja.

### Como o painel está organizado

O menu lateral esquerdo mostra apenas as áreas que o seu acesso permite ver. As principais são:

| Menu | Para que serve |
| --- | --- |
| **Dashboard** | Visão geral do movimento: pedidos, vendas, ticket médio e alertas de estoque. |
| **Pedidos** | Fila de pedidos recebidos e atualização do status de cada um. |
| **Produtos e estoque** | Cadastro de produtos, fotos, preços e quantidades. |
| **Ofertas e preços** | Promoções com período de validade. |
| **Clientes** | Dados de contato, histórico e anonimização (LGPD). |
| **Entregas** | Organização das entregas por etapa. |
| **Relatórios** | Números detalhados por período (7, 30 ou 90 dias). |
| **Configurações** | Dados da loja e regras de pedido e entrega. |
| **Usuários e papéis** | Criação e manutenção dos acessos da equipe. |

---

## 2. Primeiros passos (acesso)

### 2.1 Como entrar no painel

1. Abra o navegador (Chrome, Edge ou Firefox).
2. Acesse o endereço da loja e clique em **“Painel administrativo”** no topo da página.
   - Ou vá direto para: `https://SEUDOMINIO/admin/entrar`
3. Preencha **E-mail** e **Senha**.
4. Clique em **“Entrar no painel”**.

Pronto! Você será levado ao **Dashboard**.

> 🔒 **Segurança:** cada pessoa deve usar o **seu próprio e-mail e senha**. Nunca compartilhe sua senha, nem deixe o painel aberto em computador compartilhado. Sempre clique em **Sair** ao terminar (o botão fica no menu do seu nome, no canto superior).

### 2.2 Primeiro acesso do administrador

Esta tela só existe **enquanto o painel não tiver nenhum administrador**:

1. Acesse `https://SEUDOMINIO/admin/cadastro`.
2. Preencha **Nome**, **E-mail**, **Senha** e **Confirmação de senha**.
   - A senha precisa ter **pelo menos 10 caracteres**.
3. Clique em **“Criar primeiro administrador”**.

Depois disso, essa tela se fecha automaticamente. Os próximos acessos são criados dentro do painel, em **Usuários e papéis**.

### 2.3 Esqueci a senha — como recuperar

> ⚠️ **O painel ainda não tem o botão automático “Esqueci minha senha”** e não envia e-mail de recuperação. Por isso, não fique esperando uma mensagem: é preciso pedir a redefinição.

Se você esquecer a senha:

1. Peça a um colega com o papel **ADMIN** para criar um **acesso temporário** para você em **Usuários e papéis > Novo acesso administrativo**.
2. Ao entrar com o acesso temporário, avise o **suporte técnico** para redefinir a senha do seu acesso original (assim o seu histórico de ações é preservado).
3. Depois de recuperar o acesso, peça para o ADMIN **desativar o acesso temporário**.

**Nunca** crie um acesso com o nome de outra pessoa nem compartilhe senhas. Cada ação no painel fica registrada com o usuário que a fez.

### 2.4 Criar acessos para a equipe

**Caminho:** menu **Usuários e papéis**.

1. No cartão **“Novo acesso administrativo”**, preencha:
   - **Nome** do colaborador;
   - **E-mail** (será o login dele);
   - **Senha inicial** (mínimo de 10 caracteres);
   - **Papéis e permissões** — marque uma ou mais opções.
2. Clique em **“Criar acesso administrativo”**.
3. Passe o e-mail e a senha inicial para o colaborador, com a recomendação de trocar a senha no primeiro uso.

A senha fica guardada de forma criptografada. **Nem o administrador consegue vê-la depois**; se a pessoa esquecer, é preciso redefinir (veja a seção 2.3).

### 2.5 Papéis e permissões

Cada papel libera um conjunto de menus e ações. A tabela abaixo resume o que cada um pode fazer:

| Papel | O que pode fazer |
| --- | --- |
| **ADMIN** | Acesso completo: todas as áreas, inclusive usuários e configurações. |
| **MANAGER** | Operação e catálogo: pedidos, produtos, estoque, ofertas, clientes e relatórios. |
| **PICKER** | Separação de pedidos: vê pedidos, atualiza status, consulta produtos e ajusta estoque. |
| **DRIVER** | Entregas atribuídas: vê e atualiza pedidos. |
| **SUPPORT** | Atendimento: consulta pedidos e clientes (sem alterar). |
| **FINANCE** | Financeiro: consulta pedidos, relatórios e clientes (sem alterar). |

**Como editar os papéis de alguém:**

1. Em **Usuários e papéis**, localize a pessoa na lista **“Equipe”**.
2. Clique no ícone de **lápis** (Editar papéis).
3. Marque ou desmarque os papéis e clique em **“Salvar papéis”**.

**Como ativar ou desativar um acesso:**

- Na lista da equipe, use o botão **“Desativar acesso”** ou **“Ativar acesso”**.
- Você **não consegue desativar o seu próprio acesso** (proteção para ninguém ficar sem administrador).
- Desativar **não apaga o histórico**: as ações antigas continuam registradas para auditoria.

---

## 3. Produtos e imagens

### 3.1 Cadastrar um produto

**Caminho:** menu **Produtos e estoque > botão “Novo produto”**.

Preencha o formulário:

| Campo | O que informar |
| --- | --- |
| **Nome** | Nome que o cliente vê na loja. |
| **SKU** | Código interno do produto (pode ser o código do fornecedor). Não pode repetir. |
| **Marca** | Opcional. |
| **Departamento** | Categoria da loja (Mercearia, Hortifruti etc.). |
| **Unidade de venda** | Unidade, kg, g, litro, ml ou pacote. |
| **Preço base (R$)** | Preço normal, sem promoção. Use vírgula para centavos (ex.: `24,90`). |
| **Estoque** | Quantidade disponível, na unidade de venda. |
| **Produto ativo e visível na loja** | Deixe marcado para o produto aparecer na loja. |
| **Descrição** | Texto que ajuda o cliente a entender o produto. |
| **URL da imagem** | Opcional — veja a seção 3.2. |

1. Clique em **“Criar produto”**.
2. Confira a mensagem de sucesso e o produto na lista.
3. Para ver como o cliente vê, clique em **“Ver loja”** no cartão do produto.

> 💡 **Dica sobre o estoque:** digite a quantidade como você fala no mercado — `20` para 20 unidades, `1,5` para 1,5 kg. O painel converte sozinho para a unidade de venda. Não é preciso calcular nada.

### 3.2 Subir a foto do produto

Você pode enviar a foto direto do computador ou do celular, sem precisar de outro site:

1. No formulário do produto, procure **“URL da imagem (opcional)”**.
2. Clique em **“Escolher do computador”**.
3. Selecione a imagem no seu aparelho.
4. Aguarde a mensagem **“Enviando…”**. Quando terminar, o campo de URL é preenchido automaticamente e uma **prévia** aparece ao lado.
5. Clique em **“Criar produto”** (ou **“Salvar alterações”**, se estiver editando).

**Regras da imagem:**

- Formatos aceitos: **JPG, PNG ou WebP**.
- Tamanho máximo: **2 MB**.
- Se a imagem for maior, reduza no celular ou no computador antes de enviar.
- Se preferir, também é possível **colar um endereço público** de imagem (começando com `http://` ou `https://`).
- Sem foto, a loja mostra o **emoji do departamento** no lugar.

### 3.3 Ajustar o estoque

**Caminho:** **Produtos e estoque > Editar** (no cartão do produto).

1. Altere o campo **Estoque**.
2. Clique em **“Salvar alterações”**.
3. O cartão do produto passa a mostrar a quantidade **disponível** e, se houver, a quantidade **reservada**.

**Entenda os dois números:**

- **Disponível:** o que pode ser vendido agora.
- **Reservado:** o que está preso em pedidos que ainda não foram pagos/confirmados.
- **Disponível = estoque físico − reservado.**

Exemplo: você tem 20 unidades, mas 2 estão reservadas em pedidos aguardando confirmação. O cartão mostra **18 disponíveis (2 reservados)**. Se um pedido for cancelado, as 2 unidades voltam sozinhas para o disponível.

> ⚠️ **Atenção:** não tente deixar o estoque abaixo do que já está reservado. O sistema avisa e impede a alteração para não gerar números negativos. Se isso acontecer, confira os pedidos em aberto antes de mexer no estoque.

Cada ajuste de estoque fica registrado no histórico do produto (“Último ajuste”), com data e observação.

### 3.4 Status e situações do produto

| Situação | O que significa |
| --- | --- |
| **Ativo** | Aparece na loja e pode ser comprado (se tiver estoque disponível). |
| **Inativo** | Fica escondido da loja, mas o histórico é mantido. Use para produtos fora de linha. |
| **Estoque baixo** | Filtro que mostra produtos ativos com **10 unidades de venda ou menos** disponíveis (10 unidades, 10 kg, 10 litros etc., conforme a unidade do produto). |
| **Sem estoque** | O produto está ativo, mas o disponível chegou a zero. A loja não permite comprar. |

**Filtros da lista:** use **Buscar** (nome, SKU ou marca), **Departamento** e **Situação** (Todos, Ativos, Inativos, Estoque baixo).

**Editar, ativar/desativar e excluir:**

- **Editar:** abre o formulário com os dados atuais.
- **Ativar/Desativar:** troca a visibilidade na loja com um clique.
- **Excluir:** remove o produto. Se o produto **já tiver histórico de pedidos**, o sistema não exclui — nesse caso, **desative-o**. Isso preserva o histórico de vendas.
- Para excluir vários de uma vez: marque as caixinhas, confira **“Selecionar todos”** se quiser, e clique em **“Excluir Selecionados”**. A confirmação mostra quantos serão excluídos.

---

## 4. Ofertas

### 4.1 Criar uma promoção

**Caminho:** menu **Ofertas e preços > botão “Nova oferta”**.

Preencha:

| Campo | O que informar |
| --- | --- |
| **Produto** | Produto que terá o preço promocional. |
| **Preço promocional (R$)** | Preço com desconto. Precisa ser **menor** que o preço base. |
| **Início** | Primeiro dia em que a oferta vale. |
| **Fim** | Último dia em que a oferta vale (o dia inteiro está incluído). |
| **Limite por pedido (opcional)** | Quantidade máxima por pedido. Deixe vazio para não limitar. |
| **Oferta ativa** | Deixe marcado para a oferta poder valer. |
| **Condições** | Texto que aparece na loja (ex.: “Oferta válida enquanto durar o estoque”). |

1. Clique em **“Criar oferta”**.
2. Confira a oferta na lista e na aba **“Ativas”**.
3. Abra a página **Ofertas** da loja para ver como o cliente vê.

> 💡 **Dica:** o desconto não pode ser maior que o preço normal, e a data final não pode ser anterior à inicial. Se aparecer mensagem de erro, confira esses dois pontos.

### 4.2 Situações da oferta

A lista tem abas de filtro:

| Aba | O que mostra |
| --- | --- |
| **Todas** | Todas as ofertas cadastradas. |
| **Ativas** | Ativas, dentro do período e aparecendo na loja agora. |
| **Agendadas** | Ativas, mas com início no futuro. Entram no ar sozinhas na data marcada. |
| **Expiradas** | Passaram da data final. Saem da loja automaticamente. |
| **Inativas** | Foram desligadas manualmente (mesmo dentro do período). |

O sistema calcula a situação sozinho, comparando a data de hoje com o início e o fim. Você não precisa desligar a oferta quando ela vence.

### 4.3 Editar ou encerrar uma oferta

- **Editar:** clique em **Editar** na oferta e depois em **“Salvar oferta”**.
- **Desligar antes do fim:** desmarque **“Oferta ativa”** e salve. Ela vai para **Inativas**.
- **Excluir:** use **Excluir**. Para várias, marque as caixinhas e use **“Excluir Selecionados”**.

> ⚠️ **Atenção:** alterar uma oferta muda o preço para os próximos pedidos. Pedidos já feitos mantêm o preço registrado no momento da compra.

---

## 5. Pedidos

### 5.1 Acompanhar os pedidos que chegam

**Caminho:** menu **Pedidos**.

A tela mostra a fila com:

- **número do pedido** (ex.: `MOTTA-AB1234`);
- **status** (etiqueta colorida);
- **cliente**;
- **data e hora de recebimento**;
- **tipo** (Entrega ou Retirada);
- **total**.

Use **Buscar** (número do pedido ou nome do cliente) e o filtro **Status** para encontrar rapidamente o que precisa. O rodapé mostra quantos pedidos estão sendo exibidos.

> 💡 **Dica:** para ver a loja como o cliente vê, clique em **“Ver como cliente”**.

### 5.2 Abrir e entender um pedido

Clique no **número do pedido** (ou no ícone de lápis). A tela de detalhes mostra:

- **Itens do pedido**, com preço e descrição **do momento da compra** (mesmo que o produto mude depois);
- **Subtotal**, **entrega** e **Total**;
- **Trilha de status**: tudo o que já aconteceu com o pedido, com data e observação;
- **Atualizar status** (lado direito);
- **Entrega** ou **Retirada**, com endereço/janela e contato do cliente;
- **Substituição**: o que o cliente prefere caso falte um item;
- **Observações do cliente**, quando houver.

### 5.3 Como mudar o status do pedido

**Caminho:** **Pedidos > clique no pedido > cartão “Atualizar status”**.

1. Em **“Próximo status”**, escolha a próxima etapa permitida.
2. Se quiser, escreva uma **Observação** (ex.: “Cliente confirmou por WhatsApp”).
3. Clique em **“Registrar transição”**.
4. A página recarrega e a **Trilha de status** mostra a mudança com data e hora.

> ⚠️ **Importante:** o painel só mostra os próximos status **permitidos**. Se uma opção não aparece, é porque o pedido precisa passar por outra etapa antes. Status finais (**Concluído**, **Cancelado** e **Reembolsado**) não voltam para etapas anteriores.

### 5.4 Fluxo normal dos status

O caminho mais comum é:

**Recebido → Confirmado → Em separação → Saiu para entrega (ou Pronto para retirada) → Concluído**

| Status | Significado | O que fazer |
| --- | --- | --- |
| **Recebido** | O pedido chegou pelo site e o estoque foi reservado. | Conferir os itens e confirmar o pedido. |
| **Confirmado** | A loja aceitou o pedido. | Iniciar a separação. A partir daqui o pedido **não expira** mais. |
| **Em separação** | A equipe está separando os itens. | Finalizar e liberar para entrega/retirada. |
| **Aguardando substituição** | Falta um item e é preciso falar com o cliente. | Resolver com o cliente e voltar para “Em separação”. |
| **Pronto para retirada** | O pedido está separado e espera o cliente na loja. | Entregar e marcar como **Concluído**. |
| **Saiu para entrega** | O pedido está com o entregador. | Marcar como **Concluído** após a entrega. |
| **Concluído** | Pedido entregue. O estoque é baixado definitivamente. | — |
| **Cancelado** | Pedido cancelado. A reserva de estoque é devolvida. | — |
| **Reembolsado** | O valor foi devolvido ao cliente. | Usar após cancelamento ou conclusão, conforme o caso. |

> 💡 **Cancelamento:** pode ser feito enquanto o pedido ainda não saiu para entrega. Ao cancelar, o sistema **devolve o estoque reservado** automaticamente.

### 5.5 Expiração de reserva: o estoque volta sozinho

Quando o cliente finaliza um pedido, o sistema **reserva** os itens para ele. Isso evita que duas pessoas comprem o último produto ao mesmo tempo.

Só que essa reserva tem prazo:

- Se o pedido continuar como **Recebido** por **30 minutos**, o sistema entende que ele não foi confirmado e **cancela automaticamente**.
- Ao cancelar, o estoque **volta sozinho** para o disponível.
- O pedido aparece como **Cancelado**, com a observação de que a reserva expirou, e o histórico fica registrado.
- A verificação é automática e roda a cada poucos minutos. Você não precisa fazer nada.

**Como evitar que um pedido pago seja cancelado:**

- Confirme o pedido (**Recebido → Confirmado**) assim que o pagamento for combinado/confirmado.
- Pedidos **Confirmados** não expiram.

**Se o cliente pagar depois do cancelamento:** o pedido antigo não pode ser reaberto. Faça um **novo pedido** (ou um novo registro, conforme o combinado com o cliente) e confirme normalmente.

> 💡 **Onde ver a reserva:** em **Produtos e estoque**, o cartão mostra “(x reservados)”. Se o número cair sozinho, é porque um pedido expirou ou foi cancelado.

### 5.6 Entregas

**Caminho:** menu **Entregas**.

A tela organiza os pedidos de **entrega** em três colunas:

- **Em preparo:** pedidos em separação ou aguardando confirmação;
- **Saiu para entrega:** pedidos em rota;
- **Concluídas:** entregas já finalizadas.

**Para concluir uma entrega:**

1. Localize o pedido em **“Saiu para entrega”**.
2. Marque a caixinha do pedido.
3. Clique em **“Marcar como Entregue”** e confirme.

Ao concluir, o status vira **Concluído** e o **estoque é baixado definitivamente** (não é mais apenas reserva).

> ⚠️ **Atenção:** só é possível concluir em massa pedidos que já estão **“Saiu para entrega”**. Pedidos em preparo precisam avançar o status primeiro.

### 5.7 Remover pedidos da fila (exclusão lógica)

Se a fila estiver muito cheia, você pode **tirar pedidos da lista** sem apagar o histórico:

1. Marque as caixinhas dos pedidos desejados.
2. Clique em **“Excluir Selecionados”** e confirme.

O que acontece:

- O pedido **sai da fila**, mas o histórico fiscal e financeiro é preservado.
- Pedidos em andamento são **cancelados automaticamente** e o estoque reservado é liberado.
- Pedidos que já **saíram para entrega** não podem ser excluídos: conclua a entrega antes.

---

## 6. Clientes e LGPD

### 6.1 O que você vê na tela de Clientes

**Caminho:** menu **Clientes**.

No topo, três números ajudam a entender a base:

- **Clientes com pedidos:** quantidade de contas com pelo menos um pedido;
- **Recorrentes:** clientes com **dois pedidos ou mais**;
- **Receita atribuída:** soma das vendas desses clientes, **sem cancelados e reembolsados**.

A lista mostra nome, contato, quantidade de pedidos, total gasto e última compra. Use **Buscar cliente** (nome, telefone ou e-mail) e a opção **“Somente recorrentes”** para filtrar.

> ℹ️ **Quem cria a conta é o cliente**, na página de cadastro da loja. O painel não cria contas de cliente; ele consulta e atualiza os dados de quem já se cadastrou.

### 6.2 Editar um cliente

1. Clique no ícone de **lápis** (Editar cliente).
2. Altere **Nome**, **E-mail** e **Telefone**.
3. Clique em **“Salvar alterações”**.

Só os **dados básicos de contato** são editáveis. Pagamentos e histórico de pedidos **não** são alterados por aqui, para não comprometer os registros financeiros.

### 6.3 Anonimização: por que não se “apaga” um cliente de verdade

Pela **LGPD**, o cliente tem direito de pedir a remoção dos dados pessoais. Ao mesmo tempo, o mercado precisa guardar o **histórico de pedidos** por obrigações fiscais e financeiras.

A solução é a **anonimização**: os dados pessoais são apagados, mas o pedido continua existindo **sem identificar a pessoa**. É por isso que o botão se chama “Excluir”, mas o que acontece por dentro é uma anonimização.

**Como anonimizar:**

1. Em **Clientes**, marque a caixinha do cliente (ou de vários).
2. Clique em **“Excluir Selecionados”**.
3. Leia o aviso e confirme.

**O que é apagado:**

- nome (vira “Cliente anônimo”);
- e-mail (vira um endereço interno sem uso);
- telefone;
- endereços cadastrados;
- senha de acesso (o cliente não consegue mais entrar na conta);
- consentimentos de marketing e WhatsApp;
- sessões abertas.

**O que é preservado:**

- o histórico de pedidos, agora ligado a um cliente anônimo;
- os valores e itens, para fins fiscais e financeiros;
- o registro de auditoria da própria anonimização.

> ⚠️ **A ação não pode ser desfeita.** Se o cliente voltar a comprar, será necessário criar uma conta nova. Antes de confirmar, verifique se é realmente isso que o cliente pediu.

---

## 7. Dashboard e relatórios

### 7.1 Dashboard: a visão rápida do dia

**Caminho:** menu **Dashboard**.

Os quatro cartões do topo mostram:

| Indicador | Como ler |
| --- | --- |
| **Pedidos hoje** | Quantos pedidos entraram hoje (desde a meia-noite, horário de Brasília). O texto abaixo mostra quantos estão **em andamento**. |
| **Vendas em 30 dias** | Soma das vendas válidas dos últimos 30 dias. **Não entram** pedidos cancelados ou reembolsados. |
| **Ticket médio** | Valor médio por pedido válido nos últimos 30 dias. Serve para acompanhar se as vendas estão crescendo em valor. |
| **Alertas de estoque** | Quantidade de produtos ativos com estoque baixo. Vermelho = precisa de atenção. |

Abaixo dos cartões:

- **Pedidos recentes:** últimos pedidos, com status e total. Clique para abrir.
- **Estoque baixo:** produtos que precisam de reposição. O link **“Ajustar estoque”** leva direto para Produtos.
- **Produtos mais vendidos · últimos 30 dias:** ranking por pedidos, quantidade e receita.
- **Ofertas ativas:** quantas promoções estão valendo agora.

> 💡 **Rotina sugerida:** comece o dia pelo Dashboard. Se houver alerta de estoque, resolva antes de o movimento apertar.

### 7.2 Relatórios: números por período

**Caminho:** menu **Relatórios**.

No canto superior direito, escolha o período: **7 dias**, **30 dias** ou **90 dias**.

**Indicadores do período:**

- **Vendas no período:** valor total e quantidade de pedidos válidos;
- **Ticket médio:** média por pedido, sem cancelados e reembolsados;
- **Cancelamentos:** percentual de pedidos cancelados (acima de 15% fica em vermelho — sinal de atenção);
- **Separação média:** tempo médio entre **Confirmado** e **Em separação**.

**Gráficos e listas:**

- **Vendas por dia:** barras com o valor de cada dia (até 14 dias do período). O texto ao lado mostra o percentual de pedidos concluídos em até 24 horas.
- **Alertas de estoque:** produtos ativos zerados ou abaixo do mínimo.
- **Produtos mais vendidos:** tabela com pedidos, quantidade e receita.
- **Desempenho de ofertas:** quais promoções geraram vendas, com quantidade e receita.

**Como usar no dia a dia:**

- Compare **7 dias** com **30 dias** para perceber se as vendas estão subindo ou caindo.
- Se os **cancelamentos** passarem de 15%, investigue: falta de estoque, demora na confirmação ou problema de pagamento.
- Use **Produtos mais vendidos** para decidir o que repor e o que colocar em oferta.
- Use **Desempenho de ofertas** para repetir as promoções que funcionaram e rever as que não venderam.

> ℹ️ Todos os números são recalculados na hora, com base nos pedidos registrados. Pedidos cancelados ou reembolsados não entram como venda.

---

## 8. Configurações da loja

**Caminho:** menu **Configurações** (disponível para ADMIN).

Aqui você ajusta:

**Dados da loja:**

- Nome, telefone, endereço, bairro, cidade, UF e CEP.

**Regras de pedidos e entrega:**

- **Pedido mínimo (R$):** valor mínimo para o cliente finalizar a compra;
- **Taxa de entrega (R$):** valor cobrado pela entrega;
- **Frete grátis a partir de (R$):** a partir de quanto a entrega sai de graça;
- **Entrega habilitada:** liga/desliga a opção de entrega no checkout;
- **Retirada habilitada:** liga/desliga a opção de retirada na loja.

1. Altere o que precisar.
2. Clique em **“Salvar configurações”**.
3. Confira a mensagem de sucesso.

> ⚠️ **Atenção:** mudar a taxa de entrega ou o pedido mínimo afeta **os próximos pedidos**. Pedidos já feitos mantêm as regras do momento em que foram criados.

---

## 9. Dúvidas frequentes (FAQ)

### A internet caiu no meio de um cadastro. O que eu faço?

Não feche a aba. Quando a conexão voltar, **atualize a página** e confira a lista antes de cadastrar de novo. Muitas vezes o cadastro já foi salvo. Se não aparecer, refaça com calma.

### O cliente clicou duas vezes em “Finalizar pedido”. Vai duplicar?

**Não.** O sistema reconhece que é o mesmo pedido (mesmo cliente e mesmo carrinho) e devolve o **mesmo número de pedido**. Antes de pedir para o cliente refazer, procure o pedido na fila.

### O pedido deu erro na hora de finalizar. O que fazer?

1. Peça ao cliente para conferir se o pedido aparece em **“Meus pedidos”**.
2. Procure o pedido em **Pedidos**, pelo nome do cliente ou pelo horário.
3. Se não aparecer, peça para finalizar novamente.
4. Se o erro continuar, anote o horário, o nome do cliente e a mensagem que apareceu, e acione o suporte técnico.

### O pedido foi cancelado sozinho. Por quê?

Provavelmente passou de **30 minutos** sem ser confirmado (status **Recebido**). É a **expiração de reserva**: o sistema cancela e devolve o estoque. Se o cliente ainda quiser comprar, faça um novo pedido.

### Não consigo mudar o status do pedido.

O painel só permite as **próximas etapas válidas**. Se a opção não aparece, o pedido precisa passar por outra etapa antes. Status **Concluído**, **Cancelado** e **Reembolsado** são finais.

### Não consigo excluir um produto.

Se o produto já tem pedidos no histórico, a exclusão é bloqueada para não quebrar os registros. **Desative** o produto: ele sai da loja e o histórico continua intacto.

### Não consigo excluir um pedido.

Pedidos que já **saíram para entrega** precisam ser **concluídos** antes de sair da fila. Nos demais casos, a exclusão é lógica: o pedido sai da lista, mas o histórico é preservado.

### O upload da foto não funciona.

Confira:

- o arquivo é **JPG, PNG ou WebP**?
- tem **até 2 MB**?
- a conexão está estável?

Se a imagem for maior, reduza o tamanho antes de enviar. Também é possível colar uma URL pública no campo de imagem.

### Esqueci minha senha. E agora?

O painel **não tem recuperação automática por e-mail**. Siga a seção **2.3**: peça um acesso temporário a um ADMIN e solicite ao suporte técnico a redefinição da senha do seu acesso.

### Apareceu “Muitas tentativas” ao entrar.

Depois de **5 tentativas de senha erradas**, o acesso fica bloqueado por cerca de **15 minutos**. Aguarde e tente novamente com a senha correta. Se não lembrar, siga a seção 2.3.

### O estoque não bate com a prateleira.

Lembre que o painel mostra **disponível = físico − reservado**. Veja se há pedidos em aberto segurando unidades (o cartão do produto mostra “x reservados”). Pedidos não confirmados expiram em 30 minutos e devolvem o estoque.

### O cliente pediu para apagar os dados dele. Como faço?

Use a **anonimização** em **Clientes**: marque o cliente e clique em **“Excluir Selecionados”**. Os dados pessoais são apagados e o histórico de pedidos é preservado sem identificar a pessoa. A ação **não pode ser desfeita**.

### Por que não vejo todos os menus?

Cada acesso vê apenas o que o **papel** permite. Se precisar de uma área nova, peça a um ADMIN para ajustar seus papéis em **Usuários e papéis**.

---

## 10. Boas práticas do dia a dia

- **Confirme os pedidos cedo.** Pedido confirmado não expira e o cliente fica tranquilo.
- **Mantenha o estoque atualizado.** O disponível é o que o cliente vê; estoque errado gera pedido cancelado.
- **Use a observação do status.** Uma frase curta (“Cliente avisado por WhatsApp”) ajuda toda a equipe.
- **Não exclua produtos com histórico.** Desative. O histórico de vendas precisa ficar intacto.
- **Anonimização é definitiva.** Confirme com o cliente e com o responsável antes de fazer.
- **Cada pessoa usa o próprio acesso.** Isso mantém a auditoria correta e protege a equipe.
- **Saia do painel** ao usar computador compartilhado.
- **Confira o Dashboard e os Relatórios** toda semana: eles mostram tendências antes de virarem problema.

---

## Precisa de ajuda?

Se algo não funcionar como descrito aqui:

1. Anote **o que você estava fazendo**, **o horário** e **a mensagem que apareceu** (se houver).
2. Tire uma **captura de tela**.
3. Procure o **responsável técnico do sistema** ou o administrador do painel.

Assim fica muito mais fácil identificar e resolver o problema rapidinho. 🙂
