import { expect, type Page } from "@playwright/test";

const getBaseUrlHostname = (): string => {
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080";
  return new URL(baseUrl).hostname;
};

export const login = async (
  page: Page,
  email: string,
  password: string,
): Promise<void> => {
  await page.goto("/auth/login");
  await page.getByLabel("Email").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  const expectedHost = getBaseUrlHostname();
  await expect
    .poll(() => new URL(page.url()).pathname)
    .toMatch(/^\/platform\/?$/);

  await expect
    .poll(() => new URL(page.url()).hostname)
    .toBe(expectedHost);

  await expect
    .poll(async () => {
      const response = await page.request.get("/api/auth/session");
      if (!response.ok()) {
        return null;
      }
      const session = (await response.json()) as {
        user?: { email?: string | null };
      };
      return session.user?.email ?? null;
    })
    .toBe(email);
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
  const combobox = page.getByRole("combobox", { name: /programming language/i });
  await expect(combobox).not.toHaveText(/select a language/i);
  await combobox.click();

  const searchInput = page.getByPlaceholder("Search languages...");
  await expect(searchInput).toBeVisible();
  await searchInput.fill("python");

  const pythonOption = page.getByRole("option", { name: /^python\b/i });
  await expect(pythonOption).toBeVisible();
  await pythonOption.click();

  await expect(combobox).toContainText(/^python\b/i, { timeout: 15_000 });
};

export const openFirstProblem = async (page: Page): Promise<void> => {
  await page.goto("/platform/problems");
  await expect(page.getByRole("heading", { name: "All Problems" })).toBeVisible();
  const firstProblemRow = page.locator("tbody tr").first();
  await expect(firstProblemRow).toBeVisible();
  await firstProblemRow.click();
  await page.waitForURL("**/platform/problems/**");
};
