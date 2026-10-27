import { expect, test } from "@playwright/test";
import { loginAdmin, loginCustomer } from "./auth-helpers";
import { ensureProductStock } from "./stock-helpers";

/**
 * Abre a PDP pelo fluxo público (busca → link do card).
 *
 * O painel admin regrava o slug a cada edição como `${slug(nome)}-${slug(sku)}`
 * (admin-actions.ts, saveAdminProduct), então um caminho fixo em
 * `/produto/arroz-tipo-1-5kg` deixa de existir assim que o teste ajusta o
 * estoque pelo painel. O link do card traz o slug vigente.
 */
async function openProductPage(
  page: import("@playwright/test").Page,
  searchTerm: string,
  productName: string,
): Promise<void> {
  await page.goto("/");
  const search = page.locator('input[type="search"]:visible').first();
  await search.fill(searchTerm);
  await search.press("Enter");
  await expect(page).toHaveURL(/\/catalogo\?q=/);
  await page
    .getByRole("link", { name: `Ver detalhes de ${productName}` })
    .first()
    .click();
  await expect(page).toHaveURL(/\/produto\/arroz-tipo-1-5kg/);
}

/**
 * Cria um pedido real pelo fluxo do cliente (carrinho → checkout → banco) e
 * devolve o número gerado. Usado pelo teste do painel, que precisa de um pedido
 * de verdade gravado no PostgreSQL.
 */
async function placeCustomerOrder(page: import("@playwright/test").Page): Promise<string> {
  await loginCustomer(page);
  await openProductPage(page, "arroz", "Arroz Tipo 1 5kg");
  const addToCartButton = page.getByRole("button", {
    name: "Adicionar Arroz Tipo 1 5kg ao carrinho",
  });
  // A espera vem ANTES do clique no stepper: o botão só fica enabled quando o
  // cliente hidratou (`disabled={!hydrated}`), e o QuantityStepper ignora cliques
  // recebidos antes do React montar — daí o clique em "Aumentar" ser engolido e
  // o subtotal ficar em 1 unidade, abaixo do pedido mínimo de R$ 30,00.
  await expect(addToCartButton).toBeEnabled({ timeout: 15_000 });
  const quantity = page.getByRole("group", { name: "Quantidade de Arroz Tipo 1 5kg" });
  await page
    .getByRole("button", { name: "Aumentar quantidade de Arroz Tipo 1 5kg" })
    .click();
  // Confirma que o aumento pegou (2 unidades) antes de adicionar ao carrinho.
  await expect(quantity.getByText("2 un", { exact: true })).toBeVisible({
    timeout: 15_000,
  });
  await addToCartButton.click();

  await page.goto("/checkout");
  await page.getByLabel("Nome completo").fill("Cliente Demonstração");
  await page.getByLabel("Telefone / WhatsApp").fill("(48) 99999-0000");
  await page.getByLabel("CEP").fill("89254-000");
  await page.getByLabel("Rua").fill("Rua Demonstrativa");
  await page.getByLabel("Número").fill("100");
  await page.getByLabel("Bairro").fill("Centro");
  await page.getByLabel("Cidade").fill("Jaraguá do Sul");
  await page.getByLabel("UF").fill("SC");
  await page.getByRole("button", { name: "Finalizar pedido" }).click();

  await expect(page.getByRole("heading", { name: "Pedido recebido" })).toBeVisible({
    timeout: 45_000,
  });
  const orderNumber = (
    await page.getByText(/^MOTTA-[A-Z0-9]{6}$/).first().textContent()
  )?.trim();
  expect(orderNumber).toMatch(/^MOTTA-[A-Z0-9]{6}$/);
  return orderNumber ?? "";
}

test("painel cria produto e oferta persistidos e a loja pública reflete", async ({ page }) => {
  test.setTimeout(150_000);
  const sku = `MOT-E2E-${Date.now()}`;
  const productName = `Produto E2E ${Date.now()}`;
  await loginAdmin(page);
  await page.goto("/painel/produtos");
  await expect(
    page.getByRole("heading", { name: "Produtos e estoque" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Novo produto" }).click();
  await page.getByLabel(/Nome/).fill(productName);
  await page.getByLabel(/^SKU/).fill(sku);
  await page.getByLabel(/^Marca/).fill("Marca E2E");
  await page.getByLabel(/Preço base/).fill("25,90");
  await page.getByLabel(/Estoque \(unidade/).fill("20");
  await page.getByLabel(/Descrição/).fill("Produto criado no teste E2E do painel.");
  await page.getByRole("button", { name: "Criar produto", exact: true }).click();
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await expect(page.getByRole("heading", { name: "Produtos e estoque" })).toBeVisible();
  // O card de produto do painel exibe o nome em <p>, sem heading nem link próprio.
  const productNameText = page.getByText(productName, { exact: true });
  await productNameText.scrollIntoViewIfNeeded({ timeout: 30_000 });
  await expect(productNameText).toBeVisible({ timeout: 30_000 });

  await page.goto("/painel/ofertas");
  await page.getByRole("button", { name: "Nova oferta" }).click();
  const productId = await page
    .getByLabel("Produto")
    .locator("option")
    .filter({ hasText: productName })
    .getAttribute("value");
  if (!productId) throw new Error("Produto criado não apareceu nas opções da oferta.");
  await page.getByLabel("Produto").selectOption(productId);
  await page.getByLabel(/Preço promocional/).fill("19,90");
  await page.getByLabel(/Condições/).fill("Oferta válida no teste E2E.");
  await page.getByRole("button", { name: "Criar oferta", exact: true }).click();
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await expect(page.getByRole("heading", { name: "Ofertas e promoções" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: productName, exact: true }),
  ).toBeVisible({ timeout: 15_000 });
  await page.goto("/ofertas");
  await expect(
    page.getByRole("heading", { name: productName, exact: true }),
  ).toBeVisible({ timeout: 15_000 });
});

test("cliente cria pedido real e painel valida e grava transição de status", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await ensureProductStock(page, "Arroz Tipo 1 5kg", 1000);
  const orderNumber = await placeCustomerOrder(page);

  await loginAdmin(page);
  await page.goto("/painel/pedidos");
  await expect(
    page.getByText(orderNumber, { exact: true }).first(),
  ).toBeVisible({ timeout: 45_000 });

  const orderLink = page.locator(`a[href="/painel/pedidos/${orderNumber}"]`).first();
  const orderUrl = new RegExp(`/painel/pedidos/${orderNumber}$`);
  await Promise.all([
    page.waitForURL(orderUrl, { timeout: 45_000 }),
    orderLink.click({ force: true, timeout: 15_000 }),
  ]);
  await expect(page).toHaveURL(orderUrl);
  await expect(
    page.getByRole("heading", { name: orderNumber }),
  ).toBeVisible();
  await expect(page.getByLabel("Próximo status")).toContainText("Confirmado");
  await expect(page.getByLabel("Próximo status")).not.toContainText("Concluído");
  await page.getByRole("button", { name: "Registrar transição" }).click();
  await expect(page.getByText("Status atual:")).toContainText("Confirmado", {
    timeout: 45_000,
  });
});

test("todas as áreas do painel abrem", async ({ page }) => {
  test.setTimeout(180_000);
  await loginAdmin(page);
  for (const path of [
    "/painel",
    "/painel/pedidos",
    "/painel/produtos",
    "/painel/ofertas",
    "/painel/clientes",
    "/painel/entregas",
    "/painel/relatorios",
    "/painel/configuracoes",
    "/painel/usuarios",
  ]) {
    await page.goto(path);
    await expect(page.locator("main#conteudo")).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByText(/Sessão autenticada · dados do banco/).first(),
    ).toBeVisible();
  }
});
