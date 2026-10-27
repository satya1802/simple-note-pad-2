import { expect, test } from "@playwright/test";

// AC-021: a first-time visitor can create and manage notes with no sign-up,
// login, or account step anywhere in the flow. These specs drive the real
// app through the browser the way a person would, and separately confirm
// the server-side half of the guarantee -- `GET /` (api_spec, auth: none) --
// needs no credentials at all.

test.beforeEach(async ({ page }) => {
  // Start every test from a clean device: no leftover notes from a previous run.
  await page.goto("/notes");
  await page.evaluate(() => indexedDB.deleteDatabase("notepad"));
});

test("[AC-021] a first-time visitor creates, edits, and deletes a note with no sign-up, login, or account step", async ({
  page,
}) => {
  const title = `No-signup check ${Date.now()}`;
  const body = `Written without ever being asked for an account — ${Date.now()}`;

  // Open the app the way a first-time visitor actually would: the root URL,
  // not a deep link into the notes screen.
  await page.goto("/");

  // No account gate stands between opening the app and using it: no
  // credential field, and no sign-up/login copy anywhere on the page.
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await expect(page.locator('input[type="email"]')).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /sign up|sign in|log in|log out|register/i }),
  ).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(
    /sign up|sign in|log in|create an account|enter your password/i,
  );

  // Create a note immediately -- no redirect to any kind of account flow.
  await page.getByRole("button", { name: "New note" }).click();
  await expect(page).toHaveURL(/\/notes$/);
  await page.locator("#note-title").fill(title);
  await page.locator("#note-body").fill(body);
  // The list row for the note (not the off-screen "Editing <title>" heading).
  const noteRow = page.getByRole("button", { name: title });
  await expect(noteRow).toBeVisible();
  await expect(page.getByText(/^Saved/)).toBeVisible({ timeout: 5000 });

  // Keep managing it -- edit it further, still with no account step appearing.
  await page.locator("#note-body").fill(`${body}\nA second line, added after the first save.`);
  await expect(page.getByText(/^Saved/)).toBeVisible({ timeout: 5000 });
  await expect(page).toHaveURL(/\/notes$/);

  // And delete it -- the whole lifecycle, start to finish, with no account anywhere.
  await page.getByRole("button", { name: "Delete note" }).click();
  await expect(page.getByText(/deleted from this browser/i)).toBeVisible();
  await expect(noteRow).toHaveCount(0);
  await expect(page).toHaveURL(/\/notes$/);
});

test("[AC-021] GET / serves the app with no authentication required", async ({ request }) => {
  // A pure API guarantee: the one endpoint the product exposes (api_spec
  // `GET /`, auth: none) must come back with no Authorization header and no
  // credential of any kind sent.
  const response = await request.get("/");

  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"] ?? "").toContain("text/html");
});
