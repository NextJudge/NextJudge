import { expect, test } from "@playwright/test";
import { E2E_ADMIN_USER, E2E_USER } from "./constants";
import { login } from "./helpers";

test.describe("platform navigation", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, E2E_ADMIN_USER.email, E2E_ADMIN_USER.password);
  });

  test("dashboard shows welcome and stats", async ({ page }) => {
    await page.goto("/platform");
    await expect(
      page.getByRole("heading", {
        name: new RegExp(`Welcome back, ${E2E_ADMIN_USER.name}`, "i"),
      }),
    ).toBeVisible();
    await expect(page.getByText(/track your progress/i)).toBeVisible();
  });

  test("problems page lists seeded problems", async ({ page }) => {
    await page.goto("/platform/problems");
    await expect(
      page.getByRole("heading", { name: "All Problems" }),
    ).toBeVisible();
    await expect(page.getByRole("table", { name: "Platform problems" })).toBeVisible();
    await expect(page.locator("tbody tr").first()).toBeVisible();
  });

  test("settings page loads general preferences", async ({ page }) => {
    await page.goto("/platform/settings");
    await expect(
      page.getByRole("heading", { name: "Settings", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "General Settings" }),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: /default programming language/i }),
    ).toBeVisible();
  });

  test("admin user can access the admin panel", async ({ page }) => {
    await page.goto("/platform/admin");
    await expect(
      page.getByRole("heading", { name: "Admin", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Overview" }),
    ).toBeVisible();
  });
});

test.describe("admin access control", () => {
  test("non-admin user is redirected from admin routes", async ({ page }) => {
    await login(page, E2E_USER.email, E2E_USER.password);
    await page.goto("/platform/admin");
    await expect
      .poll(() => new URL(page.url()).pathname)
      .toBe("/platform");
  });
});
