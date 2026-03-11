/**
 * PDF Download tests — Chromium only.
 *
 * The download is triggered by programmatically clicking a dynamically-created
 * <a download="mutual-nda.pdf"> element (see page.tsx handleDownload).
 * Playwright captures this via the 'download' event on the page object.
 *
 * Firefox and WebKit have inconsistent behaviour with blob-URL anchor clicks,
 * so these tests are scoped to the chromium project only.
 */
import { test, expect } from "@playwright/test";

test.describe("PDF Download", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test('"Download as PDF" button is present and enabled on load', async ({
    page,
  }) => {
    const btn = page.getByRole("button", { name: "Download as PDF" });
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test("clicking the button triggers a download with a .pdf filename", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Blob-URL anchor download is reliably captured only in Chromium"
    );

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Download as PDF" }).click(),
    ]);

    const filename = download.suggestedFilename();
    expect(filename).toMatch(/\.pdf$/i);
  });

  test("downloaded file has name 'mutual-nda.pdf'", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Blob-URL anchor download is reliably captured only in Chromium"
    );

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Download as PDF" }).click(),
    ]);

    expect(download.suggestedFilename()).toBe("mutual-nda.pdf");
  });

  test("downloaded file size is > 10 KB (real PDF, not empty)", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Blob-URL anchor download is reliably captured only in Chromium"
    );

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Download as PDF" }).click(),
    ]);

    const path = await download.path();
    expect(path).not.toBeNull();

    // Read the file and check its size
    const { stat } = await import("fs/promises");
    const stats = await stat(path!);
    expect(stats.size).toBeGreaterThan(10 * 1024); // > 10 KB
  });

  test('after download, button returns to "Download as PDF" and is re-enabled', async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Blob-URL anchor download is reliably captured only in Chromium"
    );

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Download as PDF" }).click(),
    ]);

    // Consume the download stream so the browser finalises
    await download.path();

    const btn = page.getByRole("button", { name: "Download as PDF" });
    await expect(btn).toBeVisible({ timeout: 10_000 });
    await expect(btn).toBeEnabled();
  });
});
