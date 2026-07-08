import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility", () => {
  test("home page has no critical a11y violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    expect(results.violations.filter((v) => v.impact === "critical")).toEqual([]);
  });

  test("main landmarks exist", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main#main-content")).toBeVisible();
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("query form is keyboard accessible", async ({ page }) => {
    await page.goto("/");
    const textarea = page.locator("#anime-query");
    await textarea.focus();
    await textarea.fill("action anime from the 90s");
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });
});

test.describe("Navigation", () => {
  test("header brand links home", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Chart Your Next Anime Voyage");
  });
});
