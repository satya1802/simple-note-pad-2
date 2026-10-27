<!-- sdlc:auto:start adr -->
# ADR-0004: Use AWS for Cloud

Status: Accepted  
Date: 2026-10-27

## Context and Problem Statement

Which Cloud technology does the project use? Decided in architecture v1.

## Considered Options

- AWS
- Netlify
- Cloudflare Pages

## Decision Outcome

Chosen option: AWS, because AWS hosts the static app reliably and cheaply over HTTPS via S3 and CloudFront — the only hosting this product needs, with room to grow if backup or sync are reconsidered later.

## Consequences

AWS static hosting involves slightly more setup than a one-click host, but gives durable, low-cost delivery and headroom for future server-side features.
<!-- sdlc:auto:end adr -->