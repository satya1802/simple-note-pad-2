import React from "react";

import * as UI from "@/lib/ui";
import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";
import { useNavigate } from "@/lib/navigate";
import {
  createNote as storeCreateNote,
  deleteNote as storeDeleteNote,
  deriveTitle,
  listNotes,
  updateNote as storeUpdateNote,
  type Note,
} from "@/lib/notesStore";

const { Button, Input: BaseInput, Textarea: BaseTextarea, Label, Badge, Empty } = UI;

// `BaseInput`/`BaseTextarea` are plain function components, not `forwardRef`, so
// their declared prop types omit `ref` even though React 19 lets the underlying
// `...props` spread carry it through to the native element at runtime. These
// typed aliases let the two call sites below attach `searchRef`/`bodyRef`
// without widening the rest of the file to `any`.
const Input = BaseInput as React.ForwardRefExoticComponent<
  React.InputHTMLAttributes<HTMLInputElement> & React.RefAttributes<HTMLInputElement>
>;
const Textarea = BaseTextarea as React.ForwardRefExoticComponent<
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & React.RefAttributes<HTMLTextAreaElement>
>;

const { Plus, Search, Check, ChevronRight, FileText, Clock, Trash, AlertCircle, CheckCircle } =
  Icons;

/* Notes — two-pane legal pad workspace, backed by the on-device notesStore */

const CHAR_LIMIT = 4000;

type SaveState = "saving" | "saved" | "error";

const pad2 = (n: number) => String(n).padStart(2, "0");
const hhmm = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

function previewOf(note: Note): string {
  const lines = note.body
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const rest = note.title && note.title.trim() ? lines : lines.slice(1);
  const text = rest.join("  ·  ");
  return text || "Empty note — nothing typed yet.";
}

function relTime(isoStr: string): string {
  const d = new Date(isoStr);
  const mins = (Date.now() - d.getTime()) / 60000;
  if (mins < 1) return "just now";
  if (mins < 60) return `${Math.round(mins)} min ago`;
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return `Today ${hhmm(d)}`;
  const yest = new Date(now.getTime() - 86400000);
  if (d.toDateString() === yest.toDateString()) return `Yesterday ${hhmm(d)}`;
  if (mins < 60 * 24 * 7)
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function fullTime(isoStr: string): string {
  const d = new Date(isoStr);
  const now = new Date();
  const yest = new Date(now.getTime() - 86400000);
  if (d.toDateString() === now.toDateString()) return `today at ${hhmm(d)}`;
  if (d.toDateString() === yest.toDateString()) return `yesterday at ${hhmm(d)}`;
  return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "long" })} at ${hhmm(d)}`;
}

function matchSnippet(note: Note, q: string): string {
  const body = note.body;
  const i = body.toLowerCase().indexOf(q);
  if (i < 0) return previewOf(note);
  const start = Math.max(0, i - 34);
  const end = Math.min(body.length, i + q.length + 70);
  return (
    (start > 0 ? "…" : "") +
    body.slice(start, end).replace(/\n+/g, "  ·  ") +
    (end < body.length ? "…" : "")
  );
}

export default function Screen() {
  const navigate = useNavigate();
  const ink = brand.primaryColor;
  const neutral = brand.neutralColor;
  const accent = brand.accentColor;
  const paper = "#fbfbf7";
  const rule = "rgba(85,87,92,0.18)";
  const ruleSoft = "rgba(85,87,92,0.12)";
  const danger = "#8c2f1f";
  const headFont = `${brand.fontHeading}, "Libre Franklin", system-ui, sans-serif`;
  const bodyFont = `${brand.fontBody}, "Source Serif 4", Georgia, serif`;

  const [notes, setNotes] = React.useState<Note[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saveState, setSaveState] = React.useState<SaveState>("saved");
  const [savedAt, setSavedAt] = React.useState<string>(new Date().toISOString());
  const [notice, setNotice] = React.useState<string | null>(null);
  const [justCreated, setJustCreated] = React.useState(false);

  const overLimitRef = React.useRef(false);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);

  // Load every note from this browser's IndexedDB on mount (AC-022).
  React.useEffect(() => {
    let cancelled = false;
    listNotes()
      .then((loaded) => {
        if (cancelled) return;
        setNotes(loaded);
        setSelectedId(loaded.length ? loaded[0].id : null);
        setSavedAt(loaded.length ? loaded[0].updated_at : new Date().toISOString());
        setLoading(false);
      })
      .catch(() => {
        // No device storage available (e.g. this browser has no IndexedDB) --
        // fall back to an empty, writable notepad rather than an unhandled
        // rejection or a screen stuck loading forever.
        if (cancelled) return;
        setNotes([]);
        setSelectedId(null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (justCreated && bodyRef.current) {
      bodyRef.current.focus();
      setJustCreated(false);
    }
  }, [justCreated]);

  const selected = notes.find((n) => n.id === selectedId) || null;

  async function handleCreateNote() {
    const note = await storeCreateNote();
    setNotes((prev) => [note, ...prev]);
    setSelectedId(note.id);
    setQuery("");
    setNotice(null);
    setSaveState("saved");
    setSavedAt(note.updated_at);
    setJustCreated(true);
  }

  async function patchSelected(patch: Partial<Pick<Note, "title" | "body">>) {
    const current = notes.find((n) => n.id === selectedId);
    if (!current) return;
    const optimistic: Note = { ...current, ...patch, updated_at: new Date().toISOString() };
    setNotes((prev) => prev.map((n) => (n.id === current.id ? optimistic : n)));
    const nextBody = patch.body !== undefined ? patch.body : current.body;
    overLimitRef.current = nextBody.length > CHAR_LIMIT;
    setSaveState("saving");
    try {
      const updated = await storeUpdateNote(current.id, patch);
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      setSavedAt(updated.updated_at);
      setSaveState(overLimitRef.current ? "error" : "saved");
    } catch {
      setSaveState("error");
    }
  }

  async function removeSelected() {
    if (!selected) return;
    const name = deriveTitle(selected);
    await storeDeleteNote(selected.id);
    const remaining = notes.filter((n) => n.id !== selected.id);
    const nextByRecency = [...remaining].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    setNotes(remaining);
    setSelectedId(nextByRecency.length ? nextByRecency[0].id : null);
    setSaveState("saved");
    setNotice(`“${name}” deleted from this browser.`);
  }

  // Global keys: N for a new note, / to search
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const tag = t && t.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (t && t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        void handleCreateNote();
      } else if (e.key === "/") {
        e.preventDefault();
        if (searchRef.current) searchRef.current.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const q = query.trim().toLowerCase();
  const byRecency = [...notes].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  const filtered = q
    ? byRecency.filter(
        (n) => deriveTitle(n).toLowerCase().includes(q) || n.body.toLowerCase().includes(q),
      )
    : byRecency;

  function highlight(text: string): React.ReactNode {
    if (!q) return text;
    const lower = text.toLowerCase();
    const parts: React.ReactNode[] = [];
    let i = 0;
    let k = 0;
    while (i < text.length) {
      const idx = lower.indexOf(q, i);
      if (idx < 0) {
        parts.push(text.slice(i));
        break;
      }
      if (idx > i) parts.push(text.slice(i, idx));
      parts.push(
        <mark
          key={`m-${k++}`}
          style={{ backgroundColor: "rgba(29,63,255,0.16)", color: "inherit", borderRadius: 2 }}
        >
          {text.slice(idx, idx + q.length)}
        </mark>,
      );
      i = idx + q.length;
    }
    return parts;
  }

  const words = selected && selected.body.trim() ? selected.body.trim().split(/\s+/).length : 0;
  const chars = selected ? selected.body.length : 0;

  const labelCls = "text-[11px] uppercase tracking-[0.12em]";

  const saveLine = (() => {
    if (!selected) return null;
    if (saveState === "saving")
      return {
        icon: <Clock className="h-3.5 w-3.5" aria-hidden="true" />,
        text: "Saving…",
        color: neutral,
      };
    if (saveState === "error")
      return {
        icon: <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />,
        text: "Not saved",
        color: danger,
      };
    return {
      icon: <Check className="h-3.5 w-3.5" aria-hidden="true" />,
      text: `Saved ${relTime(savedAt)}`,
      color: neutral,
    };
  })();

  const railCell = { backgroundColor: brand.backgroundColor, borderColor: rule };
  const editorCell = { borderColor: ruleSoft };

  return (
    <div
      className="np-scope min-h-full px-4 py-8 sm:px-8 lg:px-10"
      style={
        {
          "--np-accent": accent,
          backgroundColor: brand.backgroundColor,
          color: ink,
          fontFamily: headFont,
        } as React.CSSProperties
      }
    >
      <style>{`
.np-scope :focus-visible{outline:2px solid var(--np-accent);outline-offset:2px;border-radius:3px}
.np-row{transition:background-color 140ms ease}
.np-row:hover{background-color:rgba(10,10,10,0.04)}
.np-row[aria-current="true"]:hover{background-color:rgba(29,63,255,0.10)}
.np-ghost{transition:background-color 140ms ease,color 140ms ease}
.np-ghost:hover{background-color:rgba(10,10,10,0.055)}
.np-in{animation:npIn 220ms ease-out both}
@keyframes npIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.np-fade{animation:npFade 260ms ease-out both}
@keyframes npFade{from{opacity:0}to{opacity:1}}
.np-pulse{animation:npPulse 1.5s ease-in-out infinite}
@keyframes npPulse{0%,100%{opacity:.4}50%{opacity:.85}}
.np-clamp2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.np-kbd{font-family:inherit;font-size:11px;line-height:1;padding:4px 6px;border-radius:4px}
@media (prefers-reduced-motion: reduce){.np-scope *{animation:none !important;transition:none !important}}
      `}</style>

      {/* Masthead */}
      <header className="mx-auto mb-6 flex max-w-[1180px] flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            data-wf="b-0-0"
            className="text-[34px] font-semibold leading-none tracking-tight"
            style={{ color: ink }}
          >
            Notes
          </h1>
          <p
            className="mt-2 text-[14px] leading-6"
            style={{ color: neutral, fontFamily: bodyFont }}
          >
            Plain text, kept on this browser. Everything you type saves itself.
          </p>
        </div>
        <span className="hidden items-center gap-2 text-[12px] sm:flex" style={{ color: neutral }}>
          Press
          <kbd
            className="np-kbd"
            style={{ border: `1px solid ${rule}`, backgroundColor: paper, color: ink }}
          >
            N
          </kbd>
          for a new note
        </span>
      </header>

      {/* Workspace — rail cells on the left, editor cells on the right, row by row */}
      <div
        className="mx-auto grid max-w-[1180px] grid-cols-1 overflow-hidden lg:grid-cols-[330px_minmax(0,1fr)]"
        style={{ border: `1px solid ${rule}`, borderRadius: brand.radius, backgroundColor: paper }}
      >
        {/* ── Row 2 · left: search ── */}
        <div className="border-b px-5 pb-5 pt-5 lg:border-r" style={railCell}>
          <div className="mb-3 flex items-baseline justify-between">
            <h2
              id="rail-heading"
              className="text-[13px] font-semibold tracking-tight"
              style={{ color: ink }}
            >
              All notes
            </h2>
            <span
              className="text-[12px]"
              style={{ color: neutral, fontVariantNumeric: "tabular-nums" }}
            >
              {loading ? "—" : `${filtered.length} of ${notes.length}`}
            </span>
          </div>
          <Label
            htmlFor="note-search"
            className={`${labelCls} mb-1.5 block font-semibold`}
            style={{ color: neutral }}
          >
            Search notes by title or text
          </Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: neutral }}
              aria-hidden="true"
            />
            <Input
              id="note-search"
              data-wf="b-1-0"
              ref={searchRef}
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Escape") setQuery("");
              }}
              className="h-11 w-full pl-9 pr-3 text-[14px]"
              style={{
                backgroundColor: paper,
                border: `1px solid ${rule}`,
                borderRadius: brand.radius,
                color: ink,
                fontFamily: bodyFont,
              }}
            />
          </div>
          <p
            className="mt-2 text-[12px] leading-5"
            style={{ color: neutral, fontFamily: bodyFont }}
          >
            Filters the list as you type. Press Esc to clear it.
          </p>
        </div>

        {/* ── Row 2 · right: title field ── */}
        <div className="relative border-b px-6 pb-5 pt-6 sm:px-14" style={editorCell}>
          {/* legal-pad margin rule */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-7 top-0 hidden w-px sm:block"
            style={{ backgroundColor: "rgba(29,63,255,0.35)" }}
          />
          {loading ? (
            <div className="np-pulse">
              <span
                className="block h-3 w-40 rounded"
                style={{ backgroundColor: "rgba(10,10,10,0.08)" }}
              />
              <span
                className="mt-4 block h-6 w-1/2 rounded"
                style={{ backgroundColor: "rgba(10,10,10,0.1)" }}
              />
            </div>
          ) : selected ? (
            <>
              <h2 className="sr-only">Editing {deriveTitle(selected)}</h2>
              <Label
                htmlFor="note-title"
                className={`${labelCls} mb-2 block font-semibold`}
                style={{ color: neutral }}
              >
                Title (left blank: taken from the first line)
              </Label>
              <Input
                id="note-title"
                data-wf="b-1-1"
                value={selected.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  void patchSelected({ title: e.target.value })
                }
                placeholder={deriveTitle(selected)}
                className="h-auto w-full border-0 bg-transparent px-0 py-0 text-[27px] font-semibold leading-tight tracking-tight shadow-none"
                style={{ color: ink, fontFamily: headFont, borderRadius: 2 }}
              />
              <p
                className="mt-2 text-[12px] leading-5"
                style={{ color: neutral, fontFamily: bodyFont }}
              >
                {selected.title && selected.title.trim()
                  ? "Clear this and the first line of the note becomes the title."
                  : `Blank — the list shows the first line: “${deriveTitle(selected)}”.`}
              </p>
            </>
          ) : (
            <>
              <h2 className="text-[20px] font-semibold tracking-tight" style={{ color: ink }}>
                {notes.length === 0 ? "A clean page" : "No note open"}
              </h2>
              <p
                className="mt-2 max-w-[46ch] text-[14px] leading-6"
                style={{ color: neutral, fontFamily: bodyFont }}
              >
                {notes.length === 0
                  ? "Nothing written yet. Press N, or choose New note in the list, to start one."
                  : "Pick a note from the list to read it, or start a new one."}
              </p>
            </>
          )}
        </div>

        {/* ── Row 3 · left: new note ── */}
        <div className="border-b px-5 py-4 lg:border-r" style={railCell}>
          <Button
            data-wf="b-2-0"
            onClick={() => void handleCreateNote()}
            className="h-11 w-full px-5 text-[14px] font-semibold"
            style={{
              backgroundColor: ink,
              color: paper,
              borderRadius: brand.radius,
              fontFamily: headFont,
            }}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            New note
          </Button>
        </div>

        {/* ── Row 3 · right: saved line ── */}
        <div
          data-wf="b-2-1"
          className="relative flex flex-wrap items-center gap-x-5 gap-y-2 border-b px-6 py-3 sm:px-14"
          style={editorCell}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-7 top-0 hidden w-px sm:block"
            style={{ backgroundColor: "rgba(29,63,255,0.35)" }}
          />
          <span
            className="text-[12px]"
            style={{ color: neutral, fontVariantNumeric: "tabular-nums" }}
          >
            {loading
              ? "Opening your notepad from this browser…"
              : selected
                ? `Last edited ${fullTime(selected.updated_at)} · All changes saved automatically`
                : "Nothing open — nothing to save."}
          </span>
          {!loading && selected && saveLine ? (
            <>
              <span
                aria-hidden="true"
                className="hidden h-3 w-px sm:block"
                style={{ backgroundColor: rule }}
              />
              <span
                className="np-fade flex items-center gap-1.5 text-[12px] font-semibold"
                style={{ color: saveLine.color, fontVariantNumeric: "tabular-nums" }}
                aria-live="polite"
              >
                {saveLine.icon}
                {saveLine.text}
              </span>
            </>
          ) : null}
        </div>

        {/* ── Row 4 · left: the list ── */}
        <div
          data-wf="b-3-0"
          className="min-h-[220px] border-b lg:max-h-[560px] lg:overflow-y-auto lg:border-r"
          style={railCell}
        >
          <p className={`${labelCls} px-5 pb-2 pt-3 font-semibold`} style={{ color: neutral }}>
            Most recently edited first
          </p>
          {loading ? (
            <ul className="np-pulse list-none p-0">
              {[0, 1, 2, 3, 4].map((i) => (
                <li key={i} className="px-5 py-4" style={{ borderBottom: `1px solid ${ruleSoft}` }}>
                  <span
                    className="block h-3 w-2/3 rounded"
                    style={{ backgroundColor: "rgba(10,10,10,0.12)" }}
                  />
                  <span
                    className="mt-2.5 block h-2.5 w-full rounded"
                    style={{ backgroundColor: "rgba(10,10,10,0.07)" }}
                  />
                  <span
                    className="mt-1.5 block h-2.5 w-4/5 rounded"
                    style={{ backgroundColor: "rgba(10,10,10,0.07)" }}
                  />
                </li>
              ))}
            </ul>
          ) : notes.length === 0 ? (
            <div className="px-4 py-10">
              <Empty
                title="Nothing written yet"
                description="Press N to start a note — it saves itself as you type, on this browser only."
              />
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-10">
              <Empty
                title={`No note matches “${query.trim()}”`}
                description="Search reads titles and note text. Try a shorter word, or press Esc in the search field to see all notes again."
              />
            </div>
          ) : (
            <ul className="list-none p-0">
              {filtered.map((n) => {
                const sel = n.id === selectedId;
                const title = deriveTitle(n);
                const preview = q ? matchSnippet(n, q) : previewOf(n);
                return (
                  <li key={n.id} className="np-in">
                    <button
                      type="button"
                      className="np-row block w-full px-5 py-4 text-left"
                      aria-current={sel ? "true" : undefined}
                      onClick={() => {
                        setSelectedId(n.id);
                        setNotice(null);
                        setSaveState("saved");
                        setSavedAt(n.updated_at);
                        overLimitRef.current = n.body.length > CHAR_LIMIT;
                      }}
                      style={{
                        backgroundColor: sel ? "rgba(29,63,255,0.07)" : "transparent",
                        borderLeft: `2px solid ${sel ? accent : "transparent"}`,
                        borderBottom: `1px solid ${ruleSoft}`,
                      }}
                    >
                      <span className="flex items-baseline justify-between gap-3">
                        <span
                          className="truncate text-[14px] font-semibold tracking-tight"
                          style={{ color: ink }}
                        >
                          {highlight(title)}
                        </span>
                        <span
                          className="shrink-0 text-[11px]"
                          style={{ color: neutral, fontVariantNumeric: "tabular-nums" }}
                        >
                          {relTime(n.updated_at)}
                        </span>
                      </span>
                      <span
                        className="np-clamp2 mt-1.5 block text-[13px] leading-[1.5]"
                        style={{ color: neutral, fontFamily: bodyFont }}
                      >
                        {highlight(preview)}
                      </span>
                      {!(n.title && n.title.trim()) ? (
                        <span className="mt-2 block">
                          <Badge
                            className="text-[10px] font-medium uppercase tracking-[0.1em]"
                            style={{
                              backgroundColor: "transparent",
                              border: `1px solid ${rule}`,
                              color: neutral,
                              borderRadius: brand.radius,
                            }}
                          >
                            {n.body.trim() ? "Title from first line" : "Empty note"}
                          </Badge>
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── Row 4 · right: the note text ── */}
        <div className="relative border-b px-6 pb-8 pt-6 sm:px-14" style={editorCell}>
          {/* legal-pad margin rule */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-6 left-7 top-0 hidden w-px sm:block"
            style={{ backgroundColor: "rgba(29,63,255,0.35)" }}
          />
          {loading ? (
            <div className="np-pulse">
              <span
                className="block h-3 w-full rounded"
                style={{ backgroundColor: "rgba(10,10,10,0.07)" }}
              />
              <span
                className="mt-3 block h-3 w-11/12 rounded"
                style={{ backgroundColor: "rgba(10,10,10,0.07)" }}
              />
              <span
                className="mt-3 block h-3 w-4/5 rounded"
                style={{ backgroundColor: "rgba(10,10,10,0.07)" }}
              />
              <span
                className="mt-3 block h-3 w-2/3 rounded"
                style={{ backgroundColor: "rgba(10,10,10,0.07)" }}
              />
            </div>
          ) : !selected ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
              <div
                className="mb-6 flex h-14 w-14 items-center justify-center"
                style={{ border: `1px solid ${rule}`, borderRadius: brand.radius }}
              >
                <FileText className="h-6 w-6" style={{ color: accent }} aria-hidden="true" />
              </div>
              <p
                className="max-w-[46ch] text-[15px] leading-7"
                style={{ color: neutral, fontFamily: bodyFont }}
              >
                {notes.length === 0
                  ? "Nothing written yet. Press N to start a note — it saves itself as you type, on this browser only."
                  : "Pick a note from the list on the left and its full text opens here."}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-3">
                <Label
                  htmlFor="note-body"
                  className={`${labelCls} font-semibold`}
                  style={{ color: neutral }}
                >
                  Note text (plain text only)
                </Label>
                <span
                  className="text-[12px]"
                  style={{ color: neutral, fontVariantNumeric: "tabular-nums" }}
                >
                  {words} {words === 1 ? "word" : "words"} · {chars.toLocaleString("en-GB")}/
                  {CHAR_LIMIT.toLocaleString("en-GB")} characters
                </span>
              </div>

              {!selected.body ? (
                <p
                  className="mb-2 text-[13px] leading-6"
                  style={{ color: neutral, fontFamily: bodyFont }}
                >
                  A clean page. Every keystroke is kept, on this browser only.
                </p>
              ) : null}

              <Textarea
                id="note-body"
                data-wf="b-3-1"
                ref={bodyRef}
                value={selected.body}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  void patchSelected({ body: e.target.value })
                }
                spellCheck={true}
                className="block w-full resize-none border-0 bg-transparent p-0 shadow-none"
                style={{
                  minHeight: 384,
                  color: ink,
                  fontFamily: bodyFont,
                  fontSize: 17,
                  lineHeight: "32px",
                  backgroundImage: `repeating-linear-gradient(to bottom, transparent 0px, transparent 31px, ${ruleSoft} 31px, ${ruleSoft} 32px)`,
                  backgroundAttachment: "local",
                  borderRadius: 0,
                }}
              />

              {saveState === "error" ? (
                <div
                  className="np-in mt-6 flex items-start gap-3 p-4"
                  role="alert"
                  style={{
                    border: `1px solid rgba(140,47,31,0.4)`,
                    backgroundColor: "rgba(140,47,31,0.05)",
                    borderRadius: brand.radius,
                  }}
                >
                  <AlertCircle
                    className="mt-0.5 h-4 w-4 shrink-0"
                    style={{ color: danger }}
                    aria-hidden="true"
                  />
                  <p className="text-[13px] leading-6" style={{ color: ink, fontFamily: bodyFont }}>
                    <span className="font-semibold" style={{ fontFamily: headFont }}>
                      Too long to store.
                    </span>{" "}
                    This browser keeps up to {CHAR_LIMIT.toLocaleString("en-GB")} characters per
                    note and you are at{" "}
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>
                      {chars.toLocaleString("en-GB")}
                    </span>
                    . Your text is still on screen — trim it or split it into a second note and it
                    saves itself again.
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* ── Row 5 · left: how many are stored here ── */}
        <div className="border-b px-5 py-4 lg:border-b-0 lg:border-r" style={railCell}>
          <p
            data-wf="b-4-0"
            className="text-[12px] font-semibold"
            style={{ color: ink, fontVariantNumeric: "tabular-nums" }}
          >
            {loading
              ? "Counting what is stored here…"
              : `${notes.length} ${notes.length === 1 ? "note" : "notes"} stored in this browser`}
          </p>
          <p
            className="mt-1 text-[12px] leading-5"
            style={{ color: neutral, fontFamily: bodyFont }}
          >
            Kept on this browser only — not synced, not backed up.
          </p>
        </div>

        {/* ── Row 5 · right: delete and storage link ── */}
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-4 sm:px-14">
          {notice ? (
            <p
              className="np-in flex w-full items-center gap-2 text-[13px]"
              role="status"
              style={{ color: ink, fontFamily: bodyFont }}
            >
              <CheckCircle
                className="h-4 w-4 shrink-0"
                style={{ color: accent }}
                aria-hidden="true"
              />
              {notice}
            </p>
          ) : null}

          <div>
            <button
              type="button"
              data-wf="b-4-1"
              onClick={() => void removeSelected()}
              disabled={!selected || loading}
              className="np-ghost -ml-3 inline-flex h-10 items-center gap-2 px-3 text-[13px] font-semibold disabled:opacity-45"
              style={{ color: danger, borderRadius: brand.radius }}
            >
              <Trash className="h-4 w-4" aria-hidden="true" />
              Delete note
            </button>
            <p
              className="mt-1 text-[12px] leading-5"
              style={{ color: neutral, fontFamily: bodyFont }}
            >
              Removes it from this browser straight away — there is no copy to bring back.
            </p>
          </div>

          <button
            type="button"
            data-wf="b-4-2"
            onClick={() => navigate("about")}
            className="np-ghost inline-flex h-10 items-center gap-1 px-3 text-[12px] font-semibold"
            style={{ color: accent, borderRadius: brand.radius }}
          >
            Where are my notes stored?
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <p
        className="mx-auto mt-5 max-w-[1180px] text-[12px] leading-5"
        style={{ color: neutral, fontFamily: bodyFont }}
      >
        Free to use, no account. Press{" "}
        <span style={{ fontFamily: headFont, fontWeight: 600 }}>/</span> to jump to search.
      </p>
    </div>
  );
}
