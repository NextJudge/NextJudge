import { expect, test } from "@playwright/test";
import { E2E_ADMIN_AUTH_STATE, REVERSE_STRING_SOLUTION } from "./constants";
import { openFirstProblem, selectPythonLanguage, setEditorCode } from "./helpers";

test.describe("problem solving", { tag: "@judge" }, () => {
  test.use({ storageState: E2E_ADMIN_AUTH_STATE });

  test("authenticated user can run and submit a solution", async ({ page }) => {
    await openFirstProblem(page);

    await selectPythonLanguage(page);
    await setEditorCode(page, REVERSE_STRING_SOLUTION);

    await page.getByRole("button", { name: "Run code against test cases" }).click();
    await expect(page.getByTestId("run-summary")).toContainText("Accepted", {
      timeout: 120_000,
    });

    await page.getByRole("button", { name: "Submit solution" }).click();
    await expect(page.getByTestId("submission-status")).toHaveText("Accepted", {
      timeout: 120_000,
    });
  });
});
