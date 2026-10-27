# Product Requirements

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start narrative -->
## Summary

### REQ-TECH-001 · approved · source: requirements:technology-stack

Product owner approved a fixed technology stack for the lightweight MVP, despite the app having effectively no server-side or database workload by design.

Approved stack: Backend = FastAPI 0.115 (used only to serve static app files on first load; idle thereafter since all note actions happen client-side); Cloud = AWS (hosts the static app for browser access; no server logic or data processing required); Database = PostgreSQL 16 (named only because a choice was required for this layer; holds no user data since notes live solely in browser storage); Frontend = React 19 (the entire product -- handles note creation, auto-save, live filtering list, and reading/writing directly to browser storage such as IndexedDB/localStorage). Explicitly out of scope: cross-device sync/cloud backup of notes, and rich-text formatting, tags, folders, checklists.

**Related:** EPIC-001, EPIC-002, EPIC-003, EPIC-004

- ⚠ No architecture documentation yet translates this approved stack into concrete component/service design.
- ⚠ No confirmation of exact browser storage mechanism (localStorage vs IndexedDB) -- requirements mention both as options.

### REQ-EPIC-001 · draft · source: requirements:EPIC-001

Core note lifecycle for a single-user, plain-text notepad: create, view, edit, delete notes; each note has a title (entered or auto-derived from first line) and a last-edited timestamp. Assumes no accounts, sign-up, or login.

US-001 (critical): Create a new empty note that opens for editing; only plain text is captured, no rich formatting/tags/folders/checklists (AC-001, AC-002, AC-003). US-002 (critical): Selecting a note from the list opens it showing full text, title, and last-edited timestamp (AC-004, AC-005). US-003 (critical): Editing an existing note's text persists the update and shows the latest content on reopen (AC-006, AC-007). US-004 (high): Deleting a note removes it from the list permanently, even after app reopen (AC-008, AC-009). US-005 (critical): Edits to title or body auto-save without a manual save action, and persist across close/reopen on the same browser/device (AC-010, AC-011); this satisfies NFR-004 (usability -- no save button needed). US-006 (high): Note title is either user-entered or auto-derived from the first line of text if not provided (AC-012, AC-013). US-007 (medium): Last-edited timestamp updates on every save and is visible in the list and on the open note (AC-014, AC-015).

**Related:** US-001, US-002, US-003, US-004, US-005, US-006, US-007, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013, AC-014, AC-015, NFR-004

### REQ-EPIC-002 · draft · source: requirements:EPIC-002

Note list is ordered by most recently edited, and supports live, case-insensitive search across title and body text.

US-008 (high): Notes are listed with the most recently edited at the top; editing a note moves it to the top immediately (AC-016, AC-017). US-009 (high): Typing in the search field filters the list live to notes whose title or body contains the typed text, case-insensitively; clearing the search restores the full list ordered by most recently edited (AC-018, AC-019, AC-020). This fulfills NFR-003 (performance -- live filtering without a submit/refresh step).

**Related:** US-008, US-009, AC-016, AC-017, AC-018, AC-019, AC-020, NFR-003

### REQ-EPIC-003 · draft · source: requirements:EPIC-003

App requires no sign-up or login and stores all notes only in local browser storage on the device where they were written; no backend server or database is involved in practice, and there is no backup or cross-device sync.

US-010 (high): App is usable immediately on first load with no account/sign-up/login step (AC-021). US-011 (critical): Notes persist in local browser storage across close/reopen on the same browser and device; no note data is ever sent to a server and notes do not sync across devices (AC-022, AC-023) -- this satisfies NFR-001 (privacy: notes stay on device). Clearing browser data or switching browser/device loses access to notes, since there is no backup (AC-024) -- this is NFR-002, an explicitly accepted availability risk, surfaced to the user by design. Cross-device sync and cloud backup are explicitly out of scope.

**Related:** US-010, US-011, AC-021, AC-022, AC-023, AC-024, NFR-001, NFR-002

- ⚠ No design yet specifies exactly how/where this accepted data-loss risk (NFR-002) is communicated to the user in the UI.

### REQ-EPIC-004 · draft · source: requirements:EPIC-004

The app is entirely free to use, with no payments, billing, or subscriptions for any feature.

US-012 (medium): All features -- create, edit, delete, search -- are accessible without any payment, billing, or subscription requirement at any point (AC-025).

**Related:** US-012, AC-025
<!-- sdlc:auto:end narrative -->

<!-- sdlc:auto:start summary -->
**Requirements version:** v1  
**Delivery scope:** lightweight  
**Approved:** 2026-10-27

**Capabilities in scope:** Create plain-text notes, View a note's full text, Edit note contents, Delete notes, Automatic saving of edits, Note title, or title derived from the first line, Last-edited timestamp on each note, Note list ordered by most recently edited, Live search of the note list by title and body text, Free to use, with no payments or subscriptions

**Approved technology stack:**

| Layer | Choice | Rationale |
|---|---|---|
| backend | FastAPI | Your app has no backend by design — notes never leave the device and nothing is sent to a server. So this layer does almost nothing here: at most it serves the app's files to the browser the first time someone visits. FastAPI is the available option and is more than capable of that minimal job; it stays idle thereafter because every note action happens in the browser. |
| cloud | AWS | You need somewhere to put the app so people can open it in a browser — that is the only hosting this product requires, since there is no server logic or data to run in the cloud. AWS can host the static app reliably and cheaply for a free tool, and gives you room to grow if you later reconsider backup or sync. |
| database | PostgreSQL | There is genuinely no database in this product: you confirmed notes are stored only in the local browser and never sent anywhere, so the browser's own storage is the database. PostgreSQL is the available option but will hold none of your users' notes. I am naming it only because a choice is required for this layer; in practice it stays empty unless you later decide to add cloud backup or cross-device sync, which you put out of scope. |
| frontend | React | This is the whole product: a notepad that runs entirely in the browser. Everything you described — typing a note, auto-save, the live list that filters as you type, reading notes back from the device — happens on the screen with no server involved. React handles exactly this kind of instant, interactive single-page app well, and it reads and writes the browser's own storage (IndexedDB/localStorage) directly, which is where you said the notes must live. |
<!-- sdlc:auto:end summary -->

<!-- sdlc:auto:start epics -->
## EPIC-001: Note Management

Core note lifecycle for a single-user, plain-text notepad: creating, viewing, editing, and deleting notes. Each note holds plain text, has a title (entered by the user or auto-derived from its first line) and a last-edited timestamp. This covers the fundamental capabilities of the Lightweight MVP. Assumption: this is a single-user tool with no accounts, sign-up, or login.

### US-001: Create a plain-text note

**Priority:** critical

> As a notepad user, I want to create a new plain-text note, so that I can capture my thoughts quickly without signing up or logging in.

| ID | Given | When | Then |
|---|---|---|---|
| AC-001 | I have the notepad app open | I choose to create a new note | an empty note is created and opened for editing so I can begin typing plain text |
| AC-002 | I have created a new note and typed plain text into it | the note is saved | it appears in the note list and can be reopened later |
| AC-003 | I am creating or editing a note | I enter text | only plain text is captured (no rich-text formatting, tags, folders, or checklists are available) |

### US-002: View a note's full text

**Priority:** critical

> As a notepad user, I want to open a note and see its full text, so that I can read back everything I have written.

| ID | Given | When | Then |
|---|---|---|---|
| AC-004 | I have one or more saved notes | I select a note from the list | the note opens and its full plain-text content and title are displayed |
| AC-005 | a note is open | I view it | its last-edited timestamp is shown |

### US-003: Edit note contents

**Priority:** critical

> As a notepad user, I want to edit the text of an existing note, so that I can update or correct what I previously wrote.

| ID | Given | When | Then |
|---|---|---|---|
| AC-006 | an existing note is open | I change its text | the updated plain-text content is reflected in the note |
| AC-007 | I have edited a note | I reopen it later | the most recent edited content is shown |

### US-004: Delete a note

**Priority:** high

> As a notepad user, I want to delete a note I no longer need, so that I can keep my note list free of clutter.

| ID | Given | When | Then |
|---|---|---|---|
| AC-008 | I have a saved note | I choose to delete it | the note is removed from the note list and is no longer accessible |
| AC-009 | I have deleted a note | I reopen the app | the deleted note does not reappear |

### US-005: Automatic saving of edits

**Priority:** critical

> As a notepad user, I want my changes to be saved automatically as I type, so that I never lose work by forgetting to press a save button.

| ID | Given | When | Then |
|---|---|---|---|
| AC-010 | I am editing a note | I make changes to the title or body | the changes are saved automatically without requiring a manual save action |
| AC-011 | I have made changes that were auto-saved | I close and reopen the app on the same browser and device | my latest changes are still present |

### US-006: Note title or auto-derived first-line title

**Priority:** high

> As a notepad user, I want each note to have a title, derived from its first line if I do not set one, so that I can recognise notes in the list without naming each one.

| ID | Given | When | Then |
|---|---|---|---|
| AC-012 | I am creating or editing a note and provide a title | the note is saved | the title I entered is used as the note's title in the list |
| AC-013 | I create a note without entering a separate title | the note is saved | the title is automatically derived from the first line of the note's text |

### US-007: Last-edited timestamp on each note

**Priority:** medium

> As a notepad user, I want each note to record when it was last edited, so that I know how recent each note is.

| ID | Given | When | Then |
|---|---|---|---|
| AC-014 | I create or edit a note | the change is saved | the note's last-edited timestamp is updated to the current time |
| AC-015 | I view the note list or an open note | I look at a note | its last-edited timestamp is displayed |

## EPIC-002: Note List, Ordering & Search

Presents all notes in a list ordered by most recently edited, and lets the user filter the list live by typing a search query that matches note titles and bodies case-insensitively. Assumptions: the standard ordering is by most recently edited; search matches title and body text case-insensitively as the user types.

### US-008: View notes ordered by most recently edited

**Priority:** high

> As a notepad user, I want my notes listed with the most recently edited first, so that the notes I am actively working on are easiest to find.

| ID | Given | When | Then |
|---|---|---|---|
| AC-016 | I have multiple saved notes | I view the note list | notes are ordered by last-edited time with the most recently edited note at the top |
| AC-017 | I edit a note that was lower in the list | the edit is saved | that note moves to the top of the list as the most recently edited |

### US-009: Live search of notes by title and body

**Priority:** high

> As a notepad user, I want to filter my note list as I type a search term, so that I can quickly find a specific note.

| ID | Given | When | Then |
|---|---|---|---|
| AC-018 | I have several saved notes | I type text into the search field | the list updates live to show only notes whose title or body text contains the typed text |
| AC-019 | I type a search term in a different letter case than the stored text | the list filters | matching is case-insensitive so notes match regardless of upper or lower case |
| AC-020 | I have an active search term | I clear the search field | the full note list is shown again, ordered by most recently edited |

## EPIC-003: Local Browser Storage & Access

Notes are stored only in the local browser on the device where they were written, using client-side browser storage (e.g. localStorage/IndexedDB), with no backend server, database, sign-up, or login. Assumptions: built as a client-side web app with no backend; because notes live only in the browser, clearing browser data or switching devices/browsers will lose access to them (no backup). Out of scope: cross-device sync and cloud backup.

### US-010: Use the app without sign-up or login

**Priority:** high

> As a notepad user, I want to use the notepad immediately without creating an account or logging in, so that I can start taking notes with no friction.

| ID | Given | When | Then |
|---|---|---|---|
| AC-021 | I open the notepad app for the first time | the app loads | I can create and manage notes without any sign-up, login, or account step |

### US-011: Persist notes in the local browser

**Priority:** critical

> As a notepad user, I want my notes saved locally in my browser on this device, so that they remain available when I return, without anything being sent to a server.

| ID | Given | When | Then |
|---|---|---|---|
| AC-022 | I have created notes | I close and reopen the app in the same browser on the same device | my notes are still present, loaded from local browser storage |
| AC-023 | I am using the app | I create or edit notes | no note data is sent to a server and notes do not sync across devices (assumption: client-side storage only, no backend server or database) |
| AC-024 | I clear my browser data, or switch to a different browser or device | I open the app there | previously written notes are not available, because notes live only in the local browser with no backup (assumption surfaced to the user) |

## EPIC-004: Free to Use

The app is free to use with no payments, billing, or subscriptions. Assumption: the app is free with no payments or subscriptions.

### US-012: Access all features for free

**Priority:** medium

> As a notepad user, I want to use all notepad features without paying, so that I can take notes freely with no cost.

| ID | Given | When | Then |
|---|---|---|---|
| AC-025 | I am using the notepad app | I access any feature such as creating, editing, deleting, or searching notes | no payment, billing, or subscription is required at any point |
<!-- sdlc:auto:end epics -->
