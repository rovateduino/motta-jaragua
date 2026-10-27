import { expect, type Page } from "@playwright/test";

export const DEMO_PASSWORD = "Motta@2026!";

/** URL final quando a rota de login redireciona para a área já autenticada. */
const ADMIN_LANDING = /^https?:\/\/[^/]+\/painel\/?$/;
const CUSTOMER_LANDING = /^https?:\/\/[^/]+\/conta\/?$/;

/**
 * `page.goto` esporadicamente falha com ERR_ABORTED no next dev (a navegação é
 * interrompida ao trocar de sessão, ex.: admin → cliente no mesmo teste).
 * Repetir uma vez resolve sem esconder outros erros de rede.
 */
async function gotoWithRetry(page: Page, path: string): Promise<void> {
  try {
    await page.goto(path);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("ERR_ABORTED")) throw error;
    await page.goto(path);
  }
}

export async function loginAdmin(
  page: Page,
  email = "admin@motta.test",
): Promise<void> {
  await gotoWithRetry(page, "/admin/entrar");
  await page.waitForLoadState("networkidle").catch(() => {});
  // Sessão admin já ativa (ex.: outro helper do mesmo teste logou antes):
  // /admin/entrar responde 307 para /painel e o formulário não existe.
  if (ADMIN_LANDING.test(page.url())) {
    await expect(page.locator("main#conteudo")).toBeVisible({ timeout: 30_000 });
    return;
  }
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Entrar no painel" }).click({
    timeout: 15_000,
  });
  // Ancla no pathname ("/painel") para não casar com /admin/entrar?next=/painel.
  const painelUrl = ADMIN_LANDING;
  try {
    await page.waitForURL(painelUrl, { timeout: 45_000 });
  } catch (error) {
    const rateLimitMessage = page.getByText(/Muitas tentativas/);
    if (!(await rateLimitMessage.isVisible())) throw error;

    await page.waitForTimeout(5_000);
    await gotoWithRetry(page, "/admin/entrar");
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: "Entrar no painel" }).click({
      timeout: 15_000,
    });
    await page.waitForURL(painelUrl, { timeout: 45_000 });
  }
  await expect(page).toHaveURL(painelUrl, { timeout: 45_000 });
}

export async function loginCustomer(page: Page): Promise<void> {
  await gotoWithRetry(page, "/entrar");
  await page.waitForLoadState("load");
  // Sessão de cliente já ativa: /entrar responde 307 para /conta, sem form.
  if (CUSTOMER_LANDING.test(page.url())) {
    await expect(page).toHaveURL(CUSTOMER_LANDING, { timeout: 30_000 });
    return;
  }
  // Melhor esforço: em next dev o networkidle pode não ser atingido (HMR), então
  // não tratamos como erro — apenas espera a hidratação antes do clique.
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  await page.getByLabel("E-mail").fill("cliente@motta.test");
  await page.getByLabel("Senha", { exact: true }).fill(DEMO_PASSWORD);
  await page
    .getByRole("button", { name: "Entrar na minha conta" })
    .click({ timeout: 15_000 });
  // O POST /entrar pode levar >10s em next dev (compilação da rota de destino).
  await page.waitForURL(/\/conta$/, { timeout: 45_000 });
  await expect(page).toHaveURL(/\/conta$/, { timeout: 45_000 });
}
