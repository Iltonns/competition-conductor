import { expect, test } from "@playwright/test";

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;
const hasLiveAccount = Boolean(email && password);

test("a conta de teste acessa campeonatos e a área de equipes", async ({ page }) => {
  test.skip(
    !hasLiveAccount,
    "E2E_USER_EMAIL/E2E_USER_PASSWORD não configurados no ambiente seguro.",
  );

  await page.goto("/auth");
  await page.locator('input[type="email"]').first().fill(email!);
  await page.locator('input[type="password"]').first().fill(password!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();

  await expect(page).toHaveURL(/\/championships/);
  await expect(page.getByText("Meus campeonatos", { exact: true }).first()).toBeVisible();

  const firstChampionshipLink = page.locator('a[href^="/championships/"]').first();
  test.skip((await firstChampionshipLink.count()) === 0, "A conta de teste não possui campeonato.");
  await firstChampionshipLink.click();
  await page.getByRole("link", { name: "Equipes" }).first().click();
  await expect(page).toHaveURL(/\/championships\/[^/]+\/teams/);
});
