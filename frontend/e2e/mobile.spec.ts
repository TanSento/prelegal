/**
 * Mobile layout tests.
 *
 * These run on the mobile-chrome (Pixel 5, 393px) and mobile-safari
 * (iPhone 13, 390px) projects defined in playwright.config.ts.
 * On desktop projects the viewport width is much wider so the horizontal-
 * scroll check is still valid but less interesting — the tests still pass.
 */
import { test, expect } from "@playwright/test";

test.describe("Mobile layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("on mobile viewport, page loads without horizontal scroll", async ({
    page,
  }) => {
    // Wait for React hydration to complete before measuring layout
    await expect(page.getByRole("heading", { name: "Mutual NDA Creator" })).toBeVisible();

    // scrollWidth > clientWidth means there is horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth >
        document.documentElement.clientWidth;
    });

    expect(hasHorizontalScroll).toBe(false);
  });

  test("the app content is accessible — not just a blank page", async ({
    page,
  }) => {
    // At minimum the sidebar heading should be in the DOM (even if scrolled off-screen)
    await expect(
      page.getByRole("heading", { name: "Mutual NDA Creator" })
    ).toBeAttached();

    // And the preview document title should be rendered
    await expect(
      page.getByRole("heading", { name: "Mutual Non-Disclosure Agreement" })
    ).toBeAttached();
  });

  test('"Download as PDF" button is reachable and visible on mobile', async ({
    page,
  }) => {
    const btn = page.getByRole("button", { name: "Download as PDF" });
    // The button is sticky at the bottom of the sidebar — it must be in the DOM
    await expect(btn).toBeAttached();
    // Scroll it into view and verify it becomes visible
    await btn.scrollIntoViewIfNeeded();
    await expect(btn).toBeVisible();
  });

  test("form fields are usable on mobile — can type into Purpose field", async ({
    page,
  }) => {
    const purposeInput = page.getByLabel("Purpose");
    await purposeInput.scrollIntoViewIfNeeded();
    await expect(purposeInput).toBeVisible();

    const testText = "Mobile test: evaluating a strategic partnership";
    await purposeInput.fill(testText);
    await expect(purposeInput).toHaveValue(testText);
  });

  test("Governing Law text field is fillable on mobile", async ({ page }) => {
    const govLawInput = page.getByLabel("Governing Law");
    await govLawInput.scrollIntoViewIfNeeded();
    await expect(govLawInput).toBeVisible();

    await govLawInput.fill("California");
    await expect(govLawInput).toHaveValue("California");
  });

  test("Party 1 name field is fillable on mobile", async ({ page }) => {
    const nameInput = page.getByLabel("Full Name").first();
    await nameInput.scrollIntoViewIfNeeded();
    await expect(nameInput).toBeVisible();

    await nameInput.fill("Jane Smith");
    await expect(nameInput).toHaveValue("Jane Smith");
  });
});
