import { expect, test } from "@playwright/test";

test("a tela de autenticação oferece entrada e criação de conta", async ({ page }) => {
  await page.goto("/auth");

  await expect(page).toHaveTitle(/Entrar · IS Arena/);
  await expect(page.getByRole("tab", { name: "Entrar" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Criar conta" })).toBeVisible();
  await expect(page.locator('input[type="email"]').first()).toBeVisible();
  await expect(page.locator('input[type="password"]').first()).toBeVisible();
});

test("um token de inscrição malformado falha de forma segura", async ({ page }) => {
  await page.goto("/team-access/token-invalido");

  await expect(page).toHaveURL(/\/team-access\/session\?state=invalid/);
  await expect(page.getByRole("heading", { name: "Acesso inválido" })).toBeVisible();
});
