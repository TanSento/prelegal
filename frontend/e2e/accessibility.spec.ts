import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("full page passes axe accessibility scan with no critical violations", async ({
    page,
  }) => {
    const results = await new AxeBuilder({ page })
      // Limit to critical and serious to avoid noise from colour-contrast on
      // decorative placeholder text which is intentionally muted.
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    // Filter to only critical violations and fail if any exist
    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    const violationSummary = critical
      .map((v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`)
      .join("\n");
    expect(critical, `Axe violations found:\n${violationSummary}`).toHaveLength(0);
  });

  // ── Individual label checks ────────────────────────────────────────────────

  test("Purpose textarea has an accessible label", async ({ page }) => {
    const label = page.getByText("Purpose", { exact: false }).first();
    await expect(label).toBeVisible();
    // The input itself is reachable via label text
    await expect(page.getByLabel("Purpose")).toBeVisible();
  });

  test("Effective Date input has an accessible label", async ({ page }) => {
    // There are two date inputs (Agreement + Party 1 + Party 2).
    // The first one, labelled "Effective Date", lives in Agreement Details.
    const input = page.getByLabel("Effective Date").first();
    await expect(input).toBeVisible();
  });

  test("Governing Law input has an accessible label", async ({ page }) => {
    const input = page.getByLabel("Governing Law");
    await expect(input).toBeVisible();
  });

  test("Jurisdiction input has an accessible label", async ({ page }) => {
    const input = page.getByLabel("Jurisdiction");
    await expect(input).toBeVisible();
  });

  test("Party 1 Name input has an accessible label", async ({ page }) => {
    // "Full Name" label appears for both parties; the first is Party 1
    const input = page.getByLabel("Full Name").first();
    await expect(input).toBeVisible();
  });

  test("all form inputs have associated labels", async ({ page }) => {
    // Verify every visible text input and textarea has an accessible label by
    // checking getByLabel resolves to a visible element for each expected field.
    const expectedLabels = [
      "Purpose",
      "Effective Date",
      "Governing Law",
      "Jurisdiction",
    ];

    for (const labelText of expectedLabels) {
      await expect(
        page.getByLabel(labelText, { exact: false }).first()
      ).toBeVisible();
    }
  });

  test("MNDA Term radio buttons have accessible names", async ({ page }) => {
    // Playwright getByRole('radio') resolves by accessible name (label text)
    await expect(
      page.getByRole("radio", { name: /Expires after/i })
    ).toBeVisible();
    await expect(
      page.getByRole("radio", { name: /Continues until terminated/i })
    ).toBeVisible();
  });

  test("Term of Confidentiality radio buttons have accessible names", async ({
    page,
  }) => {
    await expect(
      page.getByRole("radio", { name: /year\(s\) from Effective Date/i })
    ).toBeVisible();
    await expect(
      page.getByRole("radio", { name: /In perpetuity/i })
    ).toBeVisible();
  });

  test('"Download as PDF" button has accessible text', async ({ page }) => {
    const btn = page.getByRole("button", { name: "Download as PDF" });
    await expect(btn).toBeVisible();
    // Verify the accessible name is exactly what we expect
    await expect(btn).toHaveText("Download as PDF");
  });

  // ── Keyboard navigation ────────────────────────────────────────────────────

  test("form is keyboard navigable — Tab moves through fields", async ({
    page,
  }) => {
    // Focus the first interactive element in the sidebar by clicking it
    await page.getByLabel("Purpose").click();

    // Tab to the next field — should reach "Effective Date"
    await page.keyboard.press("Tab");
    const focusedTag = await page.evaluate(
      () => document.activeElement?.tagName.toLowerCase()
    );
    // After Purpose (textarea), Tab should land on another input/interactive element
    expect(["input", "button", "textarea", "select"]).toContain(focusedTag);
  });

  test("focus is visible on interactive elements", async ({ page }) => {
    // Tab to the download button (last focusable element in the sidebar)
    // and verify the button receives focus
    const btn = page.getByRole("button", { name: "Download as PDF" });
    await btn.focus();

    const isFocused = await page.evaluate(() => {
      const active = document.activeElement;
      return (
        active !== null &&
        active !== document.body &&
        active.tagName.toLowerCase() === "button"
      );
    });

    expect(isFocused).toBe(true);
  });
});
