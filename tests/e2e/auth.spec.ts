import { expect, test } from "@playwright/test";
import { loginAdmin, loginCustomer } from "./auth-helpers";

test("cliente entra na conta e painel exige login administrativo", async ({ page }) => {
  test.setTimeout(150_000);
  await loginCustomer(page);

  await expect(page.getByRole("heading", { name: /Olá, Cliente/ })).toBeVisible();
  await expect(page.getByText("cliente@motta.test")).toBeVisible();

  await page.goto("/painel");
  await expect(page).toHaveURL(/\/admin\/entrar\?next=\/painel$/);
  await expect(
    page.getByRole("heading", { name: "Entrar no painel" }),
  ).toBeVisible();

  await page.getByLabel("E-mail").fill("admin@motta.test");
  await page.getByLabel("Senha", { exact: true }).fill("Motta@2026!");
  await page.getByRole("button", { name: "Entrar no painel" }).click();

  await expect(page).toHaveURL(/\/painel$/, { timeout: 30_000 });
  await expect(
    page.getByRole("heading", { name: "Dashboard" }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/Sessão autenticada · dados do banco/)).toBeVisible();
});

test("perfil SUPPORT acessa pedidos e recebe negativa em produtos e usuários", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await loginAdmin(page, "atendimento@motta.test");

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Produtos e estoque" }),
  ).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Usuários e papéis" })).toHaveCount(0);

  await page.goto("/painel/produtos");
  await expect(page).toHaveURL(/\/painel\/sem-permissao/);
  await expect(
    page.getByRole("heading", { name: "Acesso não permitido" }),
  ).toBeVisible();
  await expect(page.getByText(/não permite consultar produtos/)).toBeVisible();

  await page.goto("/painel/usuarios");
  await expect(page).toHaveURL(/\/painel\/sem-permissao/);
  await expect(
    page.getByRole("heading", { name: "Acesso não permitido" }),
  ).toBeVisible();

  await page.goto("/painel/pedidos");
  await expect(page.getByRole("heading", { name: "Pedidos" })).toBeVisible();
});

test("cadastro de cliente cria conta e inicia sessão", async ({ page }) => {
  const email = `cliente.e2e.${Date.now()}@motta.test`;

  await page.goto("/cadastro");
  await page.getByLabel("Nome completo").fill("Cliente E2E");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel(/Telefone/).fill("(48) 99999-1234");
  await page.getByLabel("Senha", { exact: true }).fill("SenhaForte2026");
  await page.getByLabel("Confirmar senha").fill("SenhaForte2026");
  await page.getByRole("checkbox", { name: /termos/i }).check();
  await page.getByRole("button", { name: "Criar minha conta" }).click();

  await expect(page).toHaveURL(/\/conta$/);
  await expect(page.getByRole("heading", { name: /Olá, Cliente/ })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
});

test("credenciais inválidas não revelam se a conta existe", async ({ page }) => {
  await page.goto("/entrar");
  await page.getByLabel("E-mail", { exact: true }).fill("naoexiste@motta.test");
  await page.getByLabel("Senha", { exact: true }).fill("SenhaErrada2026");
  await page.getByRole("button", { name: "Entrar na minha conta" }).click();

  await expect(
    page.getByText("E-mail ou senha inválidos.", { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/entrar$/);
});

test("cliente encerra a própria sessão", async ({ page }) => {
  await loginCustomer(page);
  await page.getByRole("button", { name: "Sair" }).click();

  await expect(page).toHaveURL(/\/$/, { timeout: 30_000 });
  await page.goto("/conta");
  await expect(page).toHaveURL(/\/entrar\?next=%2Fconta$/);
});
