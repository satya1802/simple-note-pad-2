import { expect, test } from "@playwright/test";

// These specs exercise the real IndexedDB-backed note store through the UI.
// They do not mock IndexedDB, and in the network test they do not mock the
// network either -- they just watch every request Playwright sees and assert
// none of it carries note content.

const uniqueBody = (tag: string) => `Playwright probe ${tag} — ${Date.now()}`;

test.beforeEach(async ({ page }) => {
  // Start every test from a clean device: no leftover notes from a previous run.
  await page.goto("/notes");
  await page.evaluate(() => indexedDB.deleteDatabase("notepad"));
});

test("[AC-022] a note survives a full page reload", async ({ page }) => {
  const title = `Reload check ${Date.now()}`;
  const body = uniqueBody("reload");

  await page.goto("/notes");
  await page.getByRole("button", { name: "New note" }).click();
  await page.locator("#note-title").fill(title);
  await page.locator("#note-body").fill(body);

  // Give the app a moment to finish writing to IndexedDB before we tear the page down.
  await page.waitForTimeout(1000);

  await page.reload();

  await expect(page.getByText(title)).toBeVisible();
  await expect(page.locator("#note-body")).toHaveValue(body);
});

test("[AC-023][NFR-001] creating and editing a note never sends note data over the network", async ({
  page,
}) => {
  const secretBody = uniqueBody("network");
  const secretTitle = `Secret title ${Date.now()}`;

  const requestsSeen: { url: string; postData: string | null }[] = [];
  page.on("request", (request) => {
    requestsSeen.push({ url: request.url(), postData: request.postData() });
  });

  await page.goto("/notes");
  await page.getByRole("button", { name: "New note" }).click();
  await page.locator("#note-title").fill(secretTitle);
  await page.locator("#note-body").fill(secretBody);
  await page.waitForTimeout(1000);

  for (const req of requestsSeen) {
    expect(req.url, `request URL carried note title: ${req.url}`).not.toContain(secretTitle);
    expect(req.url, `request URL carried note body: ${req.url}`).not.toContain(secretBody);
    if (req.postData) {
      expect(req.postData, `request body carried note title: ${req.postData}`).not.toContain(
        secretTitle,
      );
      expect(req.postData, `request body carried note body: ${req.postData}`).not.toContain(
        secretBody,
      );
    }
  }
});

test("[AC-024] the About screen explains notes are local to this browser and lost on clearing data or switching device", async ({
  page,
}) => {
  await page.goto("/about");

  const body = page.locator("body");
  await expect(body).toContainText(/this browser/i);
  await expect(body).toContainText(/no backup/i);
  await expect(body).toContainText(/clear.*browser data/i);
  await expect(body).toContainText(/another browser or on another device/i);
});
