import { beforeEach, describe, expect, it, vi } from "vitest";

// jsdom has no IndexedDB implementation, so `idb` is mocked with a tiny
// in-memory stand-in exposing the same async surface notesStore.ts uses
// (get/put/delete/getAll). The underlying Map lives for the whole test file,
// which is what lets a "close and reopen" test observe earlier writes.
const stores = new Map<string, Map<string, unknown>>();

function storeFor(name: string): Map<string, unknown> {
  if (!stores.has(name)) stores.set(name, new Map());
  return stores.get(name) as Map<string, unknown>;
}

vi.mock("idb", () => ({
  openDB: vi.fn(
    async (
      _name: string,
      _version: number,
      opts?: { upgrade?: (db: unknown) => void },
    ) => {
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

import { createNote, deleteNote, deriveTitle, getNote, listNotes, updateNote } from "./notesStore";

beforeEach(() => {
  stores.clear();
  vi.restoreAllMocks();
});

describe("notesStore", () => {
  it("[AC-003] createNote persists an empty note with timestamps and returns it", async () => {
    const note = await createNote();
    expect(note.title).toBe("");
    expect(note.body).toBe("");
    expect(note.id).toBeTruthy();
    expect(note.created_at).toBe(note.updated_at);
    expect(new Date(note.created_at).toString()).not.toBe("Invalid Date");

    const fetched = await getNote(note.id);
    expect(fetched).toEqual(note);
  });

  it("[AC-014] updateNote persists title/body changes and bumps updated_at", async () => {
    const note = await createNote();
    const before = note.updated_at;
    await new Promise((resolve) => setTimeout(resolve, 2));

    const updated = await updateNote(note.id, { title: "Shopping list", body: "Milk\nEggs" });
    expect(updated.title).toBe("Shopping list");
    expect(updated.body).toBe("Milk\nEggs");
    expect(updated.created_at).toBe(note.created_at);
    expect(new Date(updated.updated_at).getTime()).toBeGreaterThanOrEqual(
      new Date(before).getTime(),
    );

    const fetched = await getNote(note.id);
    expect(fetched?.title).toBe("Shopping list");
  });

  it("[AC-016][AC-017] listNotes returns notes ordered most-recently-edited first", async () => {
    const a = await createNote();
    await new Promise((resolve) => setTimeout(resolve, 2));
    const b = await createNote();
    await new Promise((resolve) => setTimeout(resolve, 2));
    await updateNote(a.id, { title: "Touched again" });

    const list = await listNotes();
    expect(list.map((n) => n.id)).toEqual([a.id, b.id]);
  });

  it("deleteNote removes the note from the store permanently", async () => {
    const note = await createNote();
    await deleteNote(note.id);
    expect(await getNote(note.id)).toBeUndefined();
    expect(await listNotes()).toEqual([]);
  });

  it("[AC-022] notes written in one call are still returned by listNotes afterward", async () => {
    const first = await createNote();
    await updateNote(first.id, { title: "Still here", body: "after reopening" });
    const second = await createNote();

    const reopened = await listNotes();
    expect(reopened.map((n) => n.id).sort()).toEqual([first.id, second.id].sort());
    expect(reopened.find((n) => n.id === first.id)?.title).toBe("Still here");
  });

  it("[AC-023][NFR-001] performs no network calls", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const note = await createNote();
    await updateNote(note.id, { title: "x", body: "y" });
    await listNotes();
    await deleteNote(note.id);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("[AC-012][AC-013] deriveTitle prefers explicit title, then first body line, then fallback", () => {
    expect(deriveTitle({ title: "  My title  ", body: "ignored" })).toBe("My title");
    expect(deriveTitle({ title: "", body: "\n  first line  \nsecond" })).toBe("first line");
    expect(deriveTitle({ title: "", body: "\n\n   " })).toBe("Untitled note");
  });
});
