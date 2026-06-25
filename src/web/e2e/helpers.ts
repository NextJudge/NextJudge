import { expect, type Page } from "@playwright/test";

export const login = async (
  page: Page,
  email: string,
  password: string,
): Promise<void> => {
  await page.goto("/auth/login");
  await page.getByLabel("Email").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/platform**");
};

export const expectLoginPage = async (page: Page): Promise<void> => {
  await expect
    .poll(() => new URL(page.url()).pathname)
    .toBe("/auth/login");
};

export const expectToast = async (
  page: Page,
  message: RegExp | string,
): Promise<void> => {
  const toast = page.locator("[data-sonner-toast]").filter({ hasText: message });
  await expect(toast.first()).toBeVisible();
};

export const setEditorCode = async (page: Page, code: string): Promise<void> => {
  await page.locator(".monaco-editor").waitFor();
  await page.waitForFunction(() => {
    const monaco = (
      window as Window & {
        monaco?: {
          editor: { getModels: () => { setValue: (value: string) => void }[] };
        };
      }
    ).monaco;
    return Boolean(monaco?.editor?.getModels()?.length);
  });
  await page.evaluate((editorCode) => {
    const monaco = (
      window as Window & {
        monaco?: {
          editor: { getModels: () => { setValue: (value: string) => void }[] };
        };
      }
    ).monaco;
    const model = monaco?.editor.getModels()[0];
    if (!model) {
      throw new Error("Monaco editor model not found");
    }
    model.setValue(editorCode);
  }, code);
};

export const selectPythonLanguage = async (page: Page): Promise<void> => {
  await page.getByRole("combobox", { name: /programming language/i }).click();
  await page.getByRole("option", { name: /^python\b/i }).click();
};

export const openFirstProblem = async (page: Page): Promise<void> => {
  await page.goto("/platform/problems");
  await expect(page.getByRole("heading", { name: "All Problems" })).toBeVisible();
  const firstProblemRow = page.locator("tbody tr").first();
  await expect(firstProblemRow).toBeVisible();
  await firstProblemRow.click();
  await page.waitForURL("**/platform/problems/**");
};
