import { test, expect } from "@playwright/test";

test.describe("landing smoke", () => {
  test("shows headline and intake options", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Understand your lease before you sign.")).toBeVisible();
    const choosePdf = page.getByRole("button", { name: /choose pdf/i });
    await expect(choosePdf).toBeVisible();
    await choosePdf.focus();
    await expect(choosePdf).toBeFocused();
  });

  test("keeps intake tabs and text controls keyboard accessible", async ({ page }) => {
    await page.goto("/");

    const pasteTab = page.getByRole("tab", { name: "Paste Text" });
    await pasteTab.focus();
    await expect(pasteTab).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(page.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", /lease-intake-tab-paste/);
    await expect(page.getByLabel("Lease text to analyze")).toBeVisible();
  });
});
