<!-- sdlc:auto:start adr -->
# ADR-0001: Use React 19 for Frontend

Status: Accepted  
Date: 2026-10-27

## Context and Problem Statement

Which Frontend technology does the project use? Decided in architecture v1.

## Considered Options

- React 19
- Vue
- Svelte

## Decision Outcome

Chosen option: React 19, because React 19 is the entire product: a single-page notepad that handles instant editing, auto-save, recency ordering and live search, and reads/writes the browser's own IndexedDB directly where the notes must live.

## Consequences

React brings a build step and bundle for what is a small app, but its component model and mature ecosystem make the interactive list-and-editor UX straightforward and maintainable.
<!-- sdlc:auto:end adr -->