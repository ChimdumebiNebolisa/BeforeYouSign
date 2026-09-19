import { test, expect } from "@playwright/test";

test.describe("landing smoke", () => {
  test("does not expose the removed model retry endpoint", async ({ request }) => {
    const response = await request.post("/api/analyze/retry-model", {
      data: { documentId: "removed" },
    });

    expect(response.status()).toBe(404);
  });

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

  test("requires and reflects the selected rental property state", async ({ page }) => {
    await page.goto("/");

    const stateSelect = page.getByLabel("Rental property state");
    await expect(stateSelect.locator("option")).toHaveCount(50);
    await stateSelect.selectOption("CA");
    await page.getByRole("tab", { name: "Sample" }).click();
    await page.getByRole("button", { name: "Run Sample Lease", exact: true }).click();

    const confirmation = page.getByLabel(/I confirm this is a residential lease for a property in California/i);
    await expect(confirmation).toBeVisible();
    await confirmation.check();
    await page.getByRole("button", { name: /Continue to analysis/i }).click();

    await expect(page.getByText(/State-specific renter guidance is not currently available for California/i)).toBeVisible({
      timeout: 180_000,
    });
    await expect(page.getByRole("heading", { name: "Texas renter check" })).toHaveCount(0);
  });

  test("runs the sample lease through the report workflow", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Sample" }).click();
    await page.getByRole("button", { name: "Run Sample Lease", exact: true }).click();

    const continueButton = page.getByRole("button", { name: /Continue to analysis/i });
    await expect(continueButton).toBeVisible();
    await expect(continueButton).toBeDisabled();
    await page.getByLabel(/I confirm this is a residential lease for a property in Texas/i).check();
    await expect(continueButton).toBeEnabled();
    await continueButton.click();

    await expect(page.getByText("Local landlord-tenant law was not checked")).toBeVisible({ timeout: 180_000 });
    await expect(page.getByText("Review priority", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Download question checklist" })).toBeVisible();
  });
});
