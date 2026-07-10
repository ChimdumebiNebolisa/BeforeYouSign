import { test, expect } from "@playwright/test";

test.describe("landing smoke", () => {
  test("shows headline and intake options", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Understand your lease before you sign.")).toBeVisible();
    await expect(page.getByRole("button", { name: /choose pdf/i })).toBeVisible();
  });
});
