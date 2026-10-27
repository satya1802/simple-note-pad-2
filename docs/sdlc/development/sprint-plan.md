# Sprint Plan

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start sprints -->
## Sprint 1: Sprint 1

Stand up local browser storage for notes, let users create and view notes with a derived title and timestamp, and confirm the app is open-access (no login, no cost) with notes listed most-recent-first.

Capacity: 20 points · Committed: 19

| Key | Type | Title | Points | Role | Depends on |
|---|---|---|---|---|---|
| US-001 | Story | Create a plain-text note | 3 | frontend-agent | US-011 |
| US-002 | Story | View a note's full text | 2 | frontend-agent | US-001 |
| US-006 | Story | Note title or auto-derived first-line title | 2 | frontend-agent | US-001 |
| US-007 | Story | Last-edited timestamp on each note | 2 | frontend-agent | US-001 |
| US-008 | Story | View notes ordered by most recently edited | 3 | frontend-agent | US-001, US-007 |
| US-010 | Story | Use the app without sign-up or login | 1 | frontend-agent | — |
| US-011 | Story | Persist notes in the local browser | 5 | frontend-agent | — |
| US-012 | Story | Access all features for free | 1 | frontend-agent | — |

## Sprint 2: Sprint 2

Complete the note lifecycle: editing with automatic saving, deletion, and live case-insensitive search across the note list.

Capacity: 20 points · Committed: 13

| Key | Type | Title | Points | Role | Depends on |
|---|---|---|---|---|---|
| US-003 | Story | Edit note contents | 3 | frontend-agent | US-001, US-007 |
| US-004 | Story | Delete a note | 2 | frontend-agent | US-001 |
| US-005 | Story | Automatic saving of edits | 5 | frontend-agent | US-001, US-003 |
| US-009 | Story | Live search of notes by title and body | 3 | frontend-agent | US-008 |

## Unscheduled

_Nothing unscheduled._
<!-- sdlc:auto:end sprints -->
