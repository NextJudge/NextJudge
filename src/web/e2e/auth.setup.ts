import { test as setup } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";
import {
  E2E_ADMIN_AUTH_STATE,
  E2E_ADMIN_USER,
  E2E_USER,
  E2E_USER_AUTH_STATE,
} from "./constants";
import { login } from "./helpers";

const authDir = path.dirname(E2E_ADMIN_AUTH_STATE);

setup("authenticate as admin", async ({ page }) => {
  mkdirSync(authDir, { recursive: true });
  await login(page, E2E_ADMIN_USER.email, E2E_ADMIN_USER.password);
  await page.context().storageState({ path: E2E_ADMIN_AUTH_STATE });
});

setup("authenticate as user", async ({ page }) => {
  mkdirSync(authDir, { recursive: true });
  await login(page, E2E_USER.email, E2E_USER.password);
  await page.context().storageState({ path: E2E_USER_AUTH_STATE });
});
