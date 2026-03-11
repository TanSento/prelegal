import { test, expect } from "@playwright/test";

test.describe("NDA Creator — core flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("loads with title 'Mutual NDA Creator | Prelegal'", async ({ page }) => {
    await expect(page).toHaveTitle("Mutual NDA Creator | Prelegal");
  });

  test("form panel is visible on load", async ({ page }) => {
    // The sidebar heading
    await expect(page.getByRole("heading", { name: "Mutual NDA Creator" })).toBeVisible();
    // The download button inside the form sidebar
    await expect(page.getByRole("button", { name: "Download as PDF" })).toBeVisible();
  });

  test("preview panel is visible on load", async ({ page, isMobile }) => {
    test.skip(isMobile, "Preview tab hidden by default on mobile — tested in mobile.spec.ts");
    const preview = page.locator("#nda-preview");
    await expect(preview).toBeVisible();
    // The document title inside the preview
    await expect(preview.getByRole("heading", { name: "Mutual Non-Disclosure Agreement" })).toBeVisible();
  });

  test("typing in Purpose field updates the preview in real-time", async ({ page }) => {
    const purposeText =
      "evaluating a potential business partnership between the two parties";

    await page.getByLabel("Purpose").fill(purposeText);

    const preview = page.locator("#nda-preview");
    await expect(preview).toContainText(purposeText);
  });

  test("changing Effective Date updates the formatted date in preview", async ({
    page,
  }) => {
    // Set a known date value via the date input
    await page.getByLabel("Effective Date").first().fill("2025-06-15");

    const preview = page.locator("#nda-preview");
    // formatDate renders en-US long format: "June 15, 2025"
    await expect(preview).toContainText("June 15, 2025");
  });

  test("selecting 'Continues until terminated' radio hides the year count from the expires row", async ({
    page,
  }) => {
    // Select "Continues until terminated"
    await page.getByRole("radio", { name: "Continues until terminated" }).check();

    const preview = page.locator("#nda-preview");
    // When type is "continues", the preview row should NOT show a year count inline
    // i.e. the "Expires" line should NOT show e.g. "1 year" or "2 years"
    // but should show "Expires from Effective Date" (without a year number injected)
    const mndaTermCell = preview.locator("td").filter({ hasText: "Expires" }).first();
    await expect(mndaTermCell).not.toContainText("1 year");
    await expect(mndaTermCell).not.toContainText("years from Effective Date");

    // The "Continues until terminated" checkbox should appear checked (✓)
    const continuesRow = preview.locator("text=Continues until terminated").locator("..");
    await expect(continuesRow).toContainText("✓");
  });

  test("selecting 'In perpetuity' radio shows 'In perpetuity' checked in confidentiality row", async ({
    page,
  }) => {
    // Select "In perpetuity" for Term of Confidentiality
    await page.getByRole("radio", { name: "In perpetuity" }).check();

    const preview = page.locator("#nda-preview");
    // The "In perpetuity" option row should show the checkmark
    const perpetuityRow = preview.locator("text=In perpetuity").locator("..");
    await expect(perpetuityRow).toContainText("✓");
  });

  test("filling Party 1 company name appears in the signature table in the preview", async ({
    page,
  }) => {
    const companyName = "Acme Corporation";

    // Party 1 is the first "Company" label
    await page.getByLabel("Company").first().fill(companyName);

    const preview = page.locator("#nda-preview");
    // The signature table has a "Company" row — Party 1 column
    await expect(preview).toContainText(companyName);
  });

  test("filling Party 2 name appears in the preview", async ({ page }) => {
    const party2Name = "Bob Johnson";

    // Party 2 is the second "Full Name" label
    await page.getByLabel("Full Name").nth(1).fill(party2Name);

    const preview = page.locator("#nda-preview");
    await expect(preview).toContainText(party2Name);
  });

  test("filling Governing Law appears in the Governing Law row", async ({
    page,
  }) => {
    const governingLaw = "Delaware";

    await page.getByLabel("Governing Law").fill(governingLaw);

    const preview = page.locator("#nda-preview");
    // Appears in the cover-page table row and also in clause 9
    await expect(preview).toContainText(governingLaw);
  });

  test("the standard terms section is visible with heading 'Standard Terms'", async ({
    page,
  }) => {
    const preview = page.locator("#nda-preview");
    await expect(
      preview.getByRole("heading", { name: "Standard Terms" })
    ).toBeVisible();
  });

  test("all 11 clauses are visible — checks clause 1 and clause 11", async ({
    page,
  }) => {
    const preview = page.locator("#nda-preview");
    await expect(preview).toContainText("1. Introduction.");
    await expect(preview).toContainText("11. General.");
  });
});
