import { expect, test } from "@playwright/test";
import { E2E_ADMIN_USER } from "./constants";
import { expectHomePage, login } from "./helpers";

test.describe("authentication", () => {
  test("redirects unauthenticated users away from platform routes", async ({
    page,
  }) => {
    await page.goto("/platform/problems");
    await expectHomePage(page);
  });

  test("rejects invalid credentials without reaching the platform", async ({
    page,
  }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill("not-a-real-user@example.com");
    await page.locator('input[name="password"]').fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: /sign in to nextjudge/i }),
    ).toBeVisible();
  });

  test("logs in with valid credentials and reaches the dashboard", async ({
    page,
  }) => {
    await login(page, E2E_ADMIN_USER.email, E2E_ADMIN_USER.password);
    await expect(
      page.getByRole("heading", {
        name: new RegExp(`Welcome back, ${E2E_ADMIN_USER.name}`, "i"),
      }),
    ).toBeVisible();
  });
});
