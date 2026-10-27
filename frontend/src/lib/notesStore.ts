// Device-local note store, backed by IndexedDB via `idb`.
//
// No network calls happen here, ever (AC-023 / NFR-001): every note a user
// writes stays on the device where it was written. This module does not
// import `./api` and never will -- that is the whole point of it.
import { openDB, type IDBPDatabase } from "idb";

export interface Note {
  id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
}

const DB_NAME = "notepad";
const DB_VERSION = 1;
const STORE_NAME = "notes";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `note-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function createNote(): Promise<Note> {
  const db = await getDB();
  const now = new Date().toISOString();
  const note: Note = { id: makeId(), title: "", body: "", created_at: now, updated_at: now };
  await db.put(STORE_NAME, note);
  return note;
}

export async function getNote(id: string): Promise<Note | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, id);
}

export async function updateNote(
  id: string,
  patch: Partial<Pick<Note, "title" | "body">>,
): Promise<Note> {
  const db = await getDB();
  const existing = await db.get(STORE_NAME, id);
  if (!existing) {
    throw new Error(`Note not found: ${id}`);
  }
  const updated: Note = {
    ...existing,
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.body !== undefined ? { body: patch.body } : {}),
    updated_at: new Date().toISOString(),
  };
  await db.put(STORE_NAME, updated);
  return updated;
}

export async function listNotes(): Promise<Note[]> {
  const db = await getDB();
  const notes: Note[] = await db.getAll(STORE_NAME);
  return notes.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

/** Explicit title, else the first non-empty line of the body, else a fallback (AC-012/013). */
export function deriveTitle(note: Pick<Note, "title" | "body">): string {
  const trimmedTitle = note.title.trim();
  if (trimmedTitle) return trimmedTitle;
  const firstLine = note.body
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  return firstLine ?? "Untitled note";
}
