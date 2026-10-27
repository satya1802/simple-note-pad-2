import { expect, test } from "@playwright/test";

// Covers the note lifecycle: create, read back, titling, timestamps and
// recency ordering on the Notes screen (US-001-2).

test.beforeEach(async ({ page }) => {
  // Start every test from a clean device so ordering/timestamp assertions
  // are deterministic.
  await page.goto("/notes");
  await page.evaluate(() => {
    indexedDB.deleteDatabase("notepad");
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.reload();
});

test("[AC-001] creating a note opens an empty note focused for plain-text editing", async ({
  page,
}) => {
  await page.goto("/notes");
  await page.getByRole("button", { name: "New note" }).click();

  const title = page.locator("#note-title");
  const body = page.locator("#note-body");

  await expect(title).toHaveValue("");
  await expect(body).toHaveValue("");

  // The body is a plain textarea, not a rich-text/contenteditable surface,
  // and it is focused immediately so typing can begin with no extra click.
  await expect(body).toHaveJSProperty("tagName", "TEXTAREA");
  const focusedId = await page.evaluate(() => document.activeElement?.id);
  expect(focusedId).toBe("note-body");
});

test("[AC-002] typed text persists after navigating away and reopening the note from the list", async ({
  page,
}) => {
  const title = `Persistence check ${Date.now()}`;
  const body = `This text should still be here later — ${Date.now()}`;

  await page.goto("/notes");
  await page.getByRole("button", { name: "New note" }).click();
  await page.locator("#note-title").fill(title);
  await page.locator("#note-body").fill(body);
  await expect(page.getByText(/^Saved/)).toBeVisible({ timeout: 5000 });

  // Navigate away from the notes screen entirely, then come back.
  await page.goto("/about");
  await page.goto("/notes");

  // Reopen the note from the list rather than relying on it still being selected.
  await page.getByRole("button", { name: title }).click();
  await expect(page.locator("#note-title")).toHaveValue(title);
  await expect(page.locator("#note-body")).toHaveValue(body);
});

test("[AC-003] the editor offers no rich-text, tag, folder, or checklist controls", async ({
  page,
}) => {
  await page.goto("/notes");
  await page.getByRole("button", { name: "New note" }).click();

  const RICH_CONTROL_NAMES =
    /bold|italic|underline|strikethrough|heading|bullet|numbered list|checklist|checkbox|tag|folder|font|align|color|link|image|embed/i;

  await expect(page.getByRole("button", { name: RICH_CONTROL_NAMES })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: RICH_CONTROL_NAMES })).toHaveCount(0);
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await expect(page.locator('[contenteditable="true"]')).toHaveCount(0);

  // The body field itself is a plain textarea -- the only editing surface.
  await expect(page.locator("#note-body")).toHaveJSProperty("tagName", "TEXTAREA");
});

test("[AC-004] selecting a note from the list shows its full title and body text", async ({
  page,
}) => {
  const title = `Full read-back ${Date.now()}`;
  const body = `Line one of the note.\nLine two of the note — ${Date.now()}.`;

  await page.goto("/notes");
  await page.getByRole("button", { name: "New note" }).click();
  await page.locator("#note-title").fill(title);
  await page.locator("#note-body").fill(body);
  await expect(page.getByText(/^Saved/)).toBeVisible({ timeout: 5000 });

  // Deselect by creating and selecting a second note, then come back via the list.
  await page.getByRole("button", { name: "New note" }).click();
  await page.getByRole("button", { name: title }).click();

  await expect(page.locator("#note-title")).toHaveValue(title);
  await expect(page.locator("#note-body")).toHaveValue(body);
});

test("[AC-005][AC-015] the open note and its list row both show a last-edited timestamp", async ({
  page,
}) => {
  const title = `Timestamp check ${Date.now()}`;
  const body = `Checking timestamps — ${Date.now()}`;

  await page.goto("/notes");
  await page.getByRole("button", { name: "New note" }).click();
  await page.locator("#note-title").fill(title);
  await page.locator("#note-body").fill(body);
  await expect(page.getByText(/^Saved/)).toBeVisible({ timeout: 5000 });

  // The open editor shows an explicit "Last edited ..." line.
  await expect(page.getByText(/Last edited/)).toBeVisible();

  // The list row for this note also shows a relative/last-edited time.
  const row = page.getByRole("button", { name: title });
  await expect(row).toBeVisible();
  await expect(row.getByText(/just now|min ago|today|yesterday|\d{1,2}:\d{2}/i)).toBeVisible();
});

test("[AC-012] an explicit title is shown on the note's list row", async ({ page }) => {
  const title = `Explicit title ${Date.now()}`;
  const body = "Body text that is not the title.";

  await page.goto("/notes");
  await page.getByRole("button", { name: "New note" }).click();
  await page.locator("#note-title").fill(title);
  await page.locator("#note-body").fill(body);
  await expect(page.getByText(/^Saved/)).toBeVisible({ timeout: 5000 });

  await expect(page.getByRole("button", { name: title })).toBeVisible();
});

test("[AC-013] a blank title falls back to the first line of the body on the list row", async ({
  page,
}) => {
  const firstLine = `First line as title ${Date.now()}`;
  const body = `${firstLine}\nSecond line of the body.`;

  await page.goto("/notes");
  await page.getByRole("button", { name: "New note" }).click();
  await page.locator("#note-body").fill(body);
  await expect(page.getByText(/^Saved/)).toBeVisible({ timeout: 5000 });

  await expect(page.locator("#note-title")).toHaveValue("");
  await expect(page.getByRole("button", { name: firstLine })).toBeVisible();
});

test("[AC-016][AC-017] the list orders notes most-recently-edited first, and editing an older note moves it to the top", async ({
  page,
}) => {
  const titleA = `Older note ${Date.now()}`;
  const titleB = `Newer note ${Date.now()}`;

  await page.goto("/notes");

  await page.getByRole("button", { name: "New note" }).click();
  await page.locator("#note-title").fill(titleA);
  await page.locator("#note-body").fill("Created first.");
  await expect(page.getByText(/^Saved/)).toBeVisible({ timeout: 5000 });

  await page.waitForTimeout(1100); // ensure distinct updated_at ordering

  await page.getByRole("button", { name: "New note" }).click();
  await page.locator("#note-title").fill(titleB);
  await page.locator("#note-body").fill("Created second, so it is newer.");
  await expect(page.getByText(/^Saved/)).toBeVisible({ timeout: 5000 });

  const rowButtons = page.locator('[role="button"], button').filter({ hasText: /Older note|Newer note/ });
  let order = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll("ul li button"));
    return items.map((el) => el.textContent || "");
  });
  expect(order[0]).toContain(titleB);
  expect(order[1]).toContain(titleA);

  // Now edit the older note -- it should move to the top of the list.
  await page.getByRole("button", { name: titleA }).click();
  await page.locator("#note-body").fill("Created first. Edited just now to bump it up.");
  await expect(page.getByText(/^Saved/)).toBeVisible({ timeout: 5000 });

  order = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll("ul li button"));
    return items.map((el) => el.textContent || "");
  });
  expect(order[0]).toContain(titleA);
  expect(order[1]).toContain(titleB);
  void rowButtons;
});

test("[AC-014] editing a note updates the displayed last-edited time to now", async ({ page }) => {
  const title = `Live timestamp ${Date.now()}`;

  await page.goto("/notes");
  await page.getByRole("button", { name: "New note" }).click();
  await page.locator("#note-title").fill(title);
  await page.locator("#note-body").fill("Initial text.");
  await expect(page.getByText(/^Saved/)).toBeVisible({ timeout: 5000 });
  await expect(page.getByText(/Last edited (today|just now)/i)).toBeVisible();

  await page.waitForTimeout(1100);
  await page.locator("#note-body").fill("Initial text. Edited again right now.");
  await expect(page.getByText(/^Saved/)).toBeVisible({ timeout: 5000 });

  // The last-edited line reflects the fresh edit (still "today"/"just now",
  // never an older/earlier timestamp going stale).
  await expect(page.getByText(/Last edited (today|just now)/i)).toBeVisible();
  const row = page.getByRole("button", { name: title });
  await expect(row.getByText(/just now|min ago|today/i)).toBeVisible();
});
