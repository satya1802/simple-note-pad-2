<!-- sdlc:auto:start adr -->
# ADR-0002: Use FastAPI 0.115 for Backend

Status: Accepted  
Date: 2026-10-27

## Context and Problem Statement

Which Backend technology does the project use? Decided in architecture v1.

## Considered Options

- FastAPI 0.115
- Flask
- Node/Express

## Decision Outcome

Chosen option: FastAPI 0.115, because The product has no server-side logic by design; FastAPI 0.115 does only the minimal job of serving the built app's static files on first visit and then stays idle.

## Consequences

FastAPI is more capable than a pure static file host needs, but it is the approved option and adds no cost or complexity for this minimal role — it can be dropped entirely in favour of S3+CloudFront if desired.
<!-- sdlc:auto:end adr -->