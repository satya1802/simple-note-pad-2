import { expect, test } from "@playwright/test";

// AC-021: a first-time visitor can use the whole app -- create, edit, delete,
// and search notes -- with no sign-up, login, account, or onboarding gate
// anywhere in the flow.
// AC-025: nowhere in the app -- on any route, or on any feature path -- does
// a payment, billing, subscription, trial, upgrade, or pricing prompt appear.
//
// Every test here runs in a genuinely fresh browser context (a new,
// isolated context per test, per Playwright's default) and additionally
// clears any storage a previous run may have left on disk, so each test
// simulates true first-time use.

const GATE_COPY =
  /sign up|sign in|log in|log out|create an account|enter your password|register|onboarding|get started with an account|verify your email/i;

const PAYWALL_COPY =
  /\bpay\b|payment|billing|subscription|subscribe|free trial|\btrial\b|upgrade|pricing|credit card|\bplan\b.*\b(monthly|yearly|annual)\b|checkout/i;

const ROUTES = ["/", "/notes", "/about"];

test.beforeEach(async ({ page }) => {
  // Start every test from a clean device: no leftover notes, no leftover
  // local/session storage from a previous run.
  await page.goto("/notes");
  await page.evaluate(() => {
    indexedDB.deleteDatabase("notepad");
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
});

test("[AC-021] the app loads fresh with no sign-up, login, account, or onboarding gate before notes can be used", async ({
  page,
}) => {
  const response = await page.goto("/");
  expect(response?.ok()).toBeTruthy();

  // No credential field of any kind sits between opening the app and using it.
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await expect(page.locator('input[type="email"]')).toHaveCount(0);

  // No gate-shaped button or copy anywhere on the landing screen.
  await expect(page.getByRole("button", { name: GATE_COPY })).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(GATE_COPY);

  // The notes workspace -- not an account screen -- is what greets a fresh visitor.
  await expect(page).toHaveURL(/\/notes$/);
  await expect(page.getByRole("button", { name: "New note" })).toBeVisible();
});

test("[AC-021] a fresh visitor with no credentials creates, edits, searches, and deletes a note end to end", async ({
  page,
}) => {
  const title = `Fresh-context check ${Date.now()}`;
  const body = `Created with no account anywhere in the flow — ${Date.now()}`;
  const needle = "no account anywhere";

  await page.goto("/");
  await expect(page).toHaveURL(/\/notes$/);

  // Create.
  await page.getByRole("button", { name: "New note" }).click();
  await page.locator("#note-title").fill(title);
  await page.locator("#note-body").fill(body);
  const noteRow = page.getByRole("button", { name: title });
  await expect(noteRow).toBeVisible();
  await expect(page.getByText(/^Saved/)).toBeVisible({ timeout: 5000 });

  // Edit.
  const editedBody = `${body}\nEdited straight away, still with no account step.`;
  await page.locator("#note-body").fill(editedBody);
  await expect(page.getByText(/^Saved/)).toBeVisible({ timeout: 5000 });
  await expect(page.locator("#note-body")).toHaveValue(editedBody);

  // Search.
  await page.locator("#note-search").fill(needle);
  await expect(noteRow).toBeVisible();
  await page.locator("#note-search").fill("no-such-note-xyz-123");
  await expect(noteRow).toHaveCount(0);
  await page.locator("#note-search").fill("");

  // Delete.
  await expect(noteRow).toBeVisible();
  await noteRow.click();
  await page.getByRole("button", { name: "Delete note" }).click();
  await expect(page.getByText(/deleted from this browser/i)).toBeVisible();
  await expect(page.getByRole("button", { name: title })).toHaveCount(0);

  // The whole lifecycle completed with no credential field ever appearing.
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await expect(page.locator('input[type="email"]')).toHaveCount(0);
});

for (const route of ROUTES) {
  test(`[AC-025] no payment, billing, subscription, trial, upgrade, or pricing prompt appears on ${route}`, async ({
    page,
  }) => {
    await page.goto(route);
    await expect(page.locator("body")).not.toContainText(PAYWALL_COPY);
    await expect(page.getByRole("button", { name: PAYWALL_COPY })).toHaveCount(0);
    await expect(page.getByRole("link", { name: PAYWALL_COPY })).toHaveCount(0);
  });
}

test("[AC-025] no payment or billing prompt appears anywhere along the create-edit-delete note path", async ({
  page,
}) => {
  const title = `Paywall probe ${Date.now()}`;
  const body = `Checking the whole feature path for upgrade prompts — ${Date.now()}`;

  await page.goto("/notes");
  await expect(page.locator("body")).not.toContainText(PAYWALL_COPY);

  await page.getByRole("button", { name: "New note" }).click();
  await expect(page.locator("body")).not.toContainText(PAYWALL_COPY);

  await page.locator("#note-title").fill(title);
  await page.locator("#note-body").fill(body);
  await expect(page.getByText(/^Saved/)).toBeVisible({ timeout: 5000 });
  await expect(page.locator("body")).not.toContainText(PAYWALL_COPY);

  await page.locator("#note-search").fill(title);
  await expect(page.locator("body")).not.toContainText(PAYWALL_COPY);
  await page.locator("#note-search").fill("");

  const noteRow = page.getByRole("button", { name: title });
  await noteRow.click();
  await page.getByRole("button", { name: "Delete note" }).click();
  await expect(page.getByText(/deleted from this browser/i)).toBeVisible();
  await expect(page.locator("body")).not.toContainText(PAYWALL_COPY);
});
