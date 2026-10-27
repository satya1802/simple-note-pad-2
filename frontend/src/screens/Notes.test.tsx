import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

// jsdom has no IndexedDB, so `idb` is mocked with a tiny in-memory stand-in
// exposing the same async surface notesStore.ts uses (get/put/delete/getAll).
// Shared across tests in this file so a "reload" can be simulated by
// re-rendering the screen against the same backing Map.
const stores = new Map<string, Map<string, unknown>>();

function storeFor(name: string): Map<string, unknown> {
  if (!stores.has(name)) stores.set(name, new Map());
  return stores.get(name) as Map<string, unknown>;
}

vi.mock("idb", () => ({
  openDB: vi.fn(
    async (_name: string, _version: number, opts?: { upgrade?: (db: unknown) => void }) => {
      opts?.upgrade?.({
        objectStoreNames: { contains: () => true },
        createObjectStore: () => undefined,
      });
      return {
        get: async (storeName: string, key: string) => storeFor(storeName).get(key),
        put: async (storeName: string, value: { id: string }) => {
          storeFor(storeName).set(value.id, value);
          return value.id;
        },
        delete: async (storeName: string, key: string) => {
          storeFor(storeName).delete(key);
        },
        getAll: async (storeName: string) => Array.from(storeFor(storeName).values()),
      };
    },
  ),
}));

import Screen from "./Notes";

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={["/notes"]}>
      <Screen />
    </MemoryRouter>,
  );
}

async function waitForEmptyList() {
  await waitFor(() => expect(screen.getAllByText(/nothing written yet/i).length).toBeGreaterThan(0));
}

beforeEach(() => {
  stores.clear();
  vi.restoreAllMocks();
});

describe("Notes screen", () => {
  it("[AC-022] loads its list from notesStore.listNotes on mount, with no SEED_NOTES", async () => {
    renderScreen();
    await waitForEmptyList();
    expect(screen.queryByText(/thursday standup/i)).not.toBeInTheDocument();
  });

  it("[AC-001] New note creates an empty persisted note, selects it and focuses the body editor", async () => {
    const user = userEvent.setup();
    renderScreen();
    await waitForEmptyList();

    await user.click(screen.getByRole("button", { name: /new note/i }));

    const body = await screen.findByLabelText(/note text/i);
    await waitFor(() => expect(body).toHaveFocus());
    expect(body).toHaveValue("");
  });

  it("[AC-002] typed text survives a reload via notesStore.updateNote", async () => {
    const user = userEvent.setup();
    const { unmount } = renderScreen();
    await waitForEmptyList();

    await user.click(screen.getByRole("button", { name: /new note/i }));
    const body = await screen.findByLabelText(/note text/i);
    await user.type(body, "Remember the milk");

    await waitFor(async () => {
      const all = await import("@/lib/notesStore").then((m) => m.listNotes());
      expect(all[0]?.body).toBe("Remember the milk");
    });

    unmount();
    renderScreen();

    await waitFor(() => expect(screen.getByLabelText(/note text/i)).toHaveValue("Remember the milk"));
    expect(screen.getAllByText("Remember the milk").length).toBeGreaterThan(0);
  });

  it("[AC-003] the body editor is a plain textarea with no rich-text, tag, folder or checklist controls", async () => {
    const user = userEvent.setup();
    renderScreen();
    await waitForEmptyList();
    await user.click(screen.getByRole("button", { name: /new note/i }));

    const body = await screen.findByLabelText(/note text/i);
    expect(body.tagName).toBe("TEXTAREA");
    expect(screen.queryByRole("button", { name: /bold/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/tag/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/folder/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/checklist/i)).not.toBeInTheDocument();
  });

  it("[AC-004] selecting a note from the list opens it with its full body and title", async () => {
    const { createNote, updateNote } = await import("@/lib/notesStore");
    const a = await createNote();
    await updateNote(a.id, { title: "Shopping", body: "Milk\nEggs" });
    const b = await createNote();
    await updateNote(b.id, { title: "Other note", body: "Something else" });

    renderScreen();
    await waitFor(() => expect(screen.getByText("Other note")).toBeInTheDocument());

    const user = userEvent.setup();
    await user.click(screen.getByText("Shopping"));

    await waitFor(() => expect(screen.getByLabelText(/note text/i)).toHaveValue("Milk\nEggs"));
    expect(screen.getByLabelText(/^title/i)).toHaveValue("Shopping");
  });

  it("[AC-005][AC-015] an open note and its list row both show a last-edited timestamp", async () => {
    const { createNote, updateNote } = await import("@/lib/notesStore");
    const note = await createNote();
    await updateNote(note.id, { title: "Timed note", body: "x" });

    renderScreen();
    await waitFor(() => expect(screen.getByText("Timed note")).toBeInTheDocument());

    expect(screen.getByText(/last edited/i)).toBeInTheDocument();
    expect(screen.getAllByText(/just now|min ago|today/i).length).toBeGreaterThan(0);
  });

  it("[AC-012] a typed title is persisted and shown as the note's title in the list", async () => {
    const user = userEvent.setup();
    renderScreen();
    await waitForEmptyList();
    await user.click(screen.getByRole("button", { name: /new note/i }));

    const title = screen.getByLabelText(/^title/i);
    await user.type(title, "My custom title");

    await waitFor(() => {
      const list = screen.getByText(/most recently edited first/i).parentElement as HTMLElement;
      expect(within(list).getByText("My custom title")).toBeInTheDocument();
    });
  });

  it("[AC-013] a note with no explicit title shows a title derived from its first line", async () => {
    const user = userEvent.setup();
    renderScreen();
    await waitForEmptyList();
    await user.click(screen.getByRole("button", { name: /new note/i }));

    const body = screen.getByLabelText(/note text/i);
    await user.type(body, "First line title{enter}more text");

    await waitFor(() => {
      const list = screen.getByText(/most recently edited first/i).parentElement as HTMLElement;
      expect(within(list).getByText("First line title")).toBeInTheDocument();
    });
  });

  it("[AC-014] saving an edit updates that note's updated_at", async () => {
    const { createNote, getNote } = await import("@/lib/notesStore");
    const note = await createNote();
    const before = note.updated_at;
    await new Promise((resolve) => setTimeout(resolve, 2));

    renderScreen();
    await waitFor(() => expect(screen.getByLabelText(/note text/i)).toBeInTheDocument());
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/note text/i), "hello");

    await waitFor(async () => {
      const updated = await getNote(note.id);
      expect(updated?.updated_at).not.toBe(before);
    });
  });

  it("[AC-016][AC-017] the list orders notes most-recently-edited first, and editing re-sorts without reload", async () => {
    const { createNote, updateNote } = await import("@/lib/notesStore");
    const a = await createNote();
    await updateNote(a.id, { title: "Alpha", body: "a" });
    await new Promise((resolve) => setTimeout(resolve, 2));
    const b = await createNote();
    await updateNote(b.id, { title: "Beta", body: "b" });

    renderScreen();
    await waitFor(() => expect(screen.getByText("Beta")).toBeInTheDocument());

    const list = () => screen.getByText(/most recently edited first/i).parentElement as HTMLElement;
    const namesInOrder = () =>
      within(list())
        .getAllByRole("button")
        .map((el) => el.textContent || "");

    expect(namesInOrder()[0]).toContain("Beta");

    const user = userEvent.setup();
    await user.click(screen.getByText("Alpha"));
    await user.type(screen.getByLabelText(/note text/i), " edited");

    await waitFor(() => {
      expect(namesInOrder()[0]).toContain("Alpha");
    });
  });

  it("deleting the selected note removes it from the store and the list", async () => {
    const { createNote, updateNote, listNotes } = await import("@/lib/notesStore");
    const note = await createNote();
    await updateNote(note.id, { title: "Doomed", body: "x" });

    renderScreen();
    await waitFor(() => expect(screen.getByText("Doomed")).toBeInTheDocument());

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /delete note/i }));

    await waitFor(() => expect(screen.queryByText("Doomed")).not.toBeInTheDocument());
    expect(await listNotes()).toHaveLength(0);
  });

  it("[AC-023][NFR-001] makes no fetch calls", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const user = userEvent.setup();
    renderScreen();
    await waitForEmptyList();
    await user.click(screen.getByRole("button", { name: /new note/i }));
    await user.type(screen.getByLabelText(/note text/i), "private");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
