import { test, expect } from "@playwright/test";

test("renders captured native Android vault, authenticator and autofill screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1200, height: 1200 });
  await page.goto("/?scenario=android-vault");
  await expect(
    page.getByRole("heading", { name: "Your vault, on Android." }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toHaveClass(/extension-popup/);
  for (const name of [
    "Server response",
    "Passwords",
    "Authenticator",
    "Autofill",
    "Link a login",
  ]) {
    const screenshot = page.getByRole("img", {
      name: `Authier Android ${name} screen`,
    });
    await expect(screenshot).toBeVisible();
    await expect(screenshot).toHaveJSProperty("naturalWidth", 1080);
  }
  await page.screenshot({
    path: "../docs/screenshots/android-ui-preview.png",
    fullPage: true,
  });
});
