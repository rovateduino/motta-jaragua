import { expect, type Page } from "@playwright/test";
import { loginAdmin } from "./auth-helpers";

/**
 * Repõe o estoque de um produto pelo painel. Cada pedido do E2E reserva unidades
 * reais no banco, então o estoque precisa voltar a uma base fixa antes do checkout.
 */
export async function ensureProductStock(
  page: Page,
  productName: string,
  units: number,
): Promise<void> {
  await loginAdmin(page);
  await page.goto("/painel/produtos");
  const card = page.getByTestId("admin-product-card").filter({ hasText: productName });
  await card.getByRole("button", { name: "Editar" }).click();
  await page.getByLabel(/Estoque \(unidade/).fill(String(units));
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
  await expect(
    page.getByRole("button", { name: "Salvar alterações" }),
  ).toHaveCount(0, { timeout: 30_000 });
}
