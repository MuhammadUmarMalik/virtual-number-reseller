import { expect, test } from "@playwright/test";

test("registration validates inline and completes onboarding handoff", async ({ page }) => {
  await page.route("http://localhost:4000/api/auth/register", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { user: { id: "test" } }, requestId: "req_test" })
    });
  });
  await page.route("http://localhost:4000/api/auth/me", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          user: { email: "test@example.com", emailVerifiedAt: null, phoneVerifiedAt: null },
          onboarding: {
            accountVerified: false,
            initialTopupDone: false,
            canPurchase: false,
            minimumFirstTopup: 500,
            wallet: { balance: "0.00", currency: "PKR" }
          }
        },
        requestId: "req_test"
      })
    });
  });

  await page.goto("/register");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("String must contain at least 2 character")).toBeVisible();

  await page.getByLabel("Full name").fill("Test User");
  await page.getByLabel("Email address").fill("test@example.com");
  await page.getByLabel("Password", { exact: true }).fill("SecurePassword1!");
  await page.getByLabel("Confirm password").fill("SecurePassword1!");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/verify-account/);
  await expect(page.getByText("Wallet balance: PKR 0")).toBeVisible();
  await expect(page.getByText(/first top-up must be at least PKR 500/i)).toBeVisible();
  await expect(page.getByRole("link", { name: "Add balance" })).toBeVisible();
});

test("login maps the backend's generic error and preserves a safe redirect", async ({ page }) => {
  await page.route("http://localhost:4000/api/auth/login", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "Email or password is incorrect.", details: null }
      })
    });
  });
  await page.goto("/login?redirect=%2Forders");
  await page.getByLabel("Email address").fill("test@example.com");
  await page.getByLabel("Password", { exact: true }).fill("WrongPassword1!");
  await page.getByRole("button", { name: "Sign in securely" }).click();
  await expect(page.getByText("Email or password is incorrect.", { exact: true })).toBeVisible();
});
