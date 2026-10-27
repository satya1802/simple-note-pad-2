<!-- sdlc:auto:start adr -->
# ADR-0003: Use PostgreSQL 16 for Database

Status: Accepted  
Date: 2026-10-27

## Context and Problem Statement

Which Database technology does the project use? Decided in architecture v1.

## Considered Options

- PostgreSQL 16
- None (browser storage only)

## Decision Outcome

Chosen option: PostgreSQL 16, because Named because the database layer requires a choice, but it holds none of the users' notes: the browser's IndexedDB is the system of record, as notes never leave the device.

## Consequences

PostgreSQL 16 stays empty and unprovisioned for note data; it exists only as the sanctioned layer choice should cloud backup or sync ever move into scope (currently out of scope).
<!-- sdlc:auto:end adr -->