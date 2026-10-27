import { expect, test } from "@playwright/test";
import { loginAdmin, loginCustomer } from "./auth-helpers";
import { ensureProductStock } from "./stock-helpers";

test("busca, carrinho, checkout e pedido gravado no banco", async ({ page }) => {
  test.setTimeout(180_000);
  await ensureProductStock(page, "Arroz Tipo 1 5kg", 1000);
  // O checkout agora exige cliente logado (o pedido é criado no banco).
  await loginCustomer(page);
  await page.goto("/");

  const search = page.locator('input[type="search"]:visible').first();
  await search.fill("arroz");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/catalogo\?q=arroz/);

  await page
    .getByRole("link", { name: "Ver detalhes de Arroz Tipo 1 5kg" })
    .first()
    .click();
  await expect(page).toHaveURL(/\/produto\/arroz-tipo-1-5kg/);

  const addButton = page.getByRole("button", {
    name: "Adicionar Arroz Tipo 1 5kg ao carrinho",
  });
  await expect(addButton).toBeEnabled();
  await page
    .getByRole("button", { name: "Aumentar quantidade de Arroz Tipo 1 5kg" })
    .click();
  await addButton.click();
  await expect(
    page.getByRole("button", { name: "Arroz Tipo 1 5kg adicionado ao carrinho" }),
  ).toBeVisible();

  await page
    .getByRole("link", { name: /Carrinho de compras, 1 produto/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/carrinho$/, { timeout: 45_000 });
  await expect(page.getByRole("heading", { name: "Seu carrinho" })).toBeVisible();

  await page.getByRole("link", { name: "Continuar para o checkout" }).click();
  await expect(page).toHaveURL(/\/checkout$/, { timeout: 45_000 });

  await page.getByLabel("Nome completo").fill("Cliente Demonstração");
  await page.getByLabel("Telefone / WhatsApp").fill("(48) 99999-0000");
  await page.getByLabel("CEP").fill("89254-000");
  await page.getByLabel("Rua").fill("Rua Demonstrativa");
  await page.getByLabel("Número").fill("100");
  await page.getByLabel("Bairro").fill("Centro");
  await page.getByLabel("Cidade").fill("Jaraguá do Sul");
  await page.getByLabel("UF").fill("SC");

  await page.getByRole("button", { name: "Finalizar pedido" }).click();
  await expect(
    page.getByRole("heading", { name: "Pedido recebido" }),
  ).toBeVisible({ timeout: 45_000 });

  const orderNumber = (
    await page.getByText(/^MOTTA-[A-Z0-9]{6}$/).first().textContent()
  )?.trim();
  expect(orderNumber).toMatch(/^MOTTA-[A-Z0-9]{6}$/);

  await page.getByRole("link", { name: "Ver detalhes do pedido" }).click();
  await expect(page).toHaveURL(new RegExp(`/pedidos/${orderNumber}$`), {
    timeout: 45_000,
  });
  await expect(
    page.getByRole("heading", { name: orderNumber ?? "" }),
  ).toBeVisible();
  await expect(page.getByText("Recebido").first()).toBeVisible();
  await expect(page.getByText("Arroz Tipo 1 5kg").first()).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("heading", { name: orderNumber ?? "" }),
  ).toBeVisible();

  await page.goto("/pedidos");
  await expect(page.getByText(orderNumber ?? "", { exact: true }).first()).toBeVisible();

  await loginAdmin(page);
  await page.goto("/painel/pedidos");
  await page.waitForLoadState("load");
  await expect(page.getByText(orderNumber ?? "", { exact: true }).first()).toBeVisible({
    timeout: 30_000,
  });
});

test("ofertas mostram apenas promoções vigentes", async ({ page }) => {
  await page.goto("/ofertas");

  await expect(page.getByText("Arroz Tipo 1 5kg").first()).toBeVisible();
  await expect(page.getByText("Picanha Bovina").first()).toBeVisible();
  await expect(page.getByText("Café Torrado e Moído 500g")).toHaveCount(0);
  await expect(page.getByText("Feijão Carioca 1kg")).toHaveCount(0);
  await expect(page.getByText("Suco de Uva Integral 1L")).toHaveCount(0);
});

test("layout mobile de 360px não tem rolagem horizontal", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Verificação exclusiva do projeto mobile.");
  test.setTimeout(240_000);
  // Sessões de cliente e admin coexistem em cookies separados: assim /pedidos
  // (exige cliente) e /painel/* (exige admin) renderizam de verdade na varredura.
  await loginCustomer(page);
  await loginAdmin(page);

  await page.setViewportSize({ width: 360, height: 800 });

  for (const path of [
    "/",
    "/ofertas",
    "/catalogo",
    "/carrinho",
    "/checkout",
    "/pedidos",
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
    await expect(page.locator("main")).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
      )
      .toBe(true);
  }

  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Navegação rápida" })).toBeVisible();
});
