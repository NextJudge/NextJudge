import { expect, test } from "@playwright/test";
import { E2E_ADMIN_AUTH_STATE } from "./constants";

test.describe("contests", () => {
  test.use({ storageState: E2E_ADMIN_AUTH_STATE });

  test("contests page shows status tabs and contest cards", async ({ page }) => {
    await page.goto("/platform/contests");
    await expect(
      page.getByRole("heading", { name: "Contests", exact: true }),
    ).toBeVisible();

    await expect(page.getByRole("tab", { name: /upcoming/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /live/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /past/i })).toBeVisible();

    const liveTab = page.getByRole("tab", { name: /live/i });
    if ((await liveTab.getAttribute("data-state")) !== "active") {
      await liveTab.click();
    }

    await expect(page.getByRole("heading", { level: 3 }).first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test("user can open a contest detail page", async ({ page }) => {
    await page.goto("/platform/contests");

    const liveTab = page.getByRole("tab", { name: /live/i });
    if ((await liveTab.getAttribute("data-state")) !== "active") {
      await liveTab.click();
    }

    const contestTitle = page.getByRole("heading", { level: 3 }).first();
    await expect(contestTitle).toBeVisible({ timeout: 30_000 });
    const titleText = (await contestTitle.textContent())?.trim() ?? "";
    await contestTitle.click();

    await page.waitForURL("**/platform/contests/**");
    await expect(
      page.getByRole("heading", { name: titleText, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Back to Contests" }),
    ).toBeVisible();
  });

  test("user can register for an upcoming contest", async ({ page }) => {
    await page.goto("/platform/contests");
    await page.getByRole("tab", { name: /upcoming/i }).click();

    const registerButton = page
      .getByRole("button", { name: /register now|register for teams/i })
      .first();
    await expect(registerButton).toBeVisible({ timeout: 30_000 });
    await registerButton.click();

    await expect(
      page.locator("[data-sonner-toast]").filter({
        hasText: /registered|already registered/i,
      }).first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});
