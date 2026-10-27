# simple note pad — SDLC Documentation

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start overview -->
simple note pad

**Documentation version:** v3
<!-- sdlc:auto:end overview -->

## Contents

<!-- sdlc:auto:start contents -->
| Document | State |
|---|---|
| [Requirements](requirements/README.md) | v1 approved |
| [Architecture](architecture/README.md) | 14 entries |
| [Development](development/README.md) | 19 entries |
| [Testing](testing/README.md) | 1 entry |
| [Deployment](deployment/README.md) | 1 entry |
| [Maintenance](maintenance/README.md) | 1 entry |
| [Data model](architecture/data-model.md) | generated |
| [API (OpenAPI)](architecture/api/openapi.yaml) | generated |
| [Decisions (ADRs)](architecture/adr/README.md) | 4 decisions |
| [Sprint plan](development/sprint-plan.md) | 2 sprints |
| [Developer guide](development/developer-guide.md) | generated |
| [API reference](development/api-reference.md) | 1 route |
| [Test report](testing/test-report.md) | not run yet |
| [Tests](testing/test-cases.md) | 0 tests |
| [Deployment guide](deployment/deployment-guide.md) | not deployed yet |
| [Runbook](deployment/runbook.md) | not deployed yet |
| [Release notes](deployment/release-notes.md) | 0 releases |
| [Traceability matrix](traceability-matrix.md) | 12 requirements |
| [Changelog](CHANGELOG.md) | 3 versions |
<!-- sdlc:auto:end contents -->

## Open gaps

<!-- sdlc:auto:start open-gaps -->
### Requirements

- No architecture documentation yet translates this approved stack into concrete component/service design.
- No confirmation of exact browser storage mechanism (localStorage vs IndexedDB) -- requirements mention both as options.
- No design yet specifies exactly how/where this accepted data-loss risk (NFR-002) is communicated to the user in the UI.

### Architecture

- No explicit mapping was provided linking individual requirements (US-001..US-012) to specific architecture components; the related_ids above reflect that this architecture is intended to cover the full requirement set, not a confirmed per-requirement trace.
- No architecture diagram included in input.
- No direct requirement IDs were attached to this component in the input.
- NFR-001 and NFR-002 are referenced by the architecture input but were not included in the known requirement-keys list for this phase; confirm these NFR ids exist in the requirements set.
- Input does not specify how S3/CloudFront and the FastAPI static server interact (e.g. whether FastAPI serves from S3 or CloudFront fronts the FastAPI server directly) -- deployment wiring detail is not fully specified.
- PostgreSQL is listed as an approved technology decision but is not used by any component, critical path, or entity in this architecture -- confirm with the architecture owner whether this is intentional placeholder/future-proofing or should be removed from the stack.

### Development

- No actual development execution data provided (no code artifacts, commits, PR links, or ticket completion status) -- this entry reflects the plan only, not build progress.
- Epics themselves have no assigned role ('(unassigned)') -- unclear if epic-level work (vs. story-level) is tracked separately.
- The input did not explicitly map individual story IDs to Sprint 1 -- this story list was inferred from the sprint goal wording and point totals, and should be confirmed against the actual plan.
- No evidence provided that these stories were actually completed in Sprint 1 (no ticket/dev status).
- Story-to-sprint mapping is inferred (not explicitly stated in input); point total (13) is well under stated capacity (20), which could mean additional unlisted work or simply planned slack -- should be confirmed.
- No evidence provided that these stories were actually completed in Sprint 2.
- No implementation or completion status available for this epic's stories.
- No implementation or completion status available for this epic's story.
- No development completion evidence (code, ticket, or test result) provided for this story.
- No development completion evidence provided for this story.

### Testing

- Testing phase has not started -- none of the 25 acceptance criteria (AC-001 through AC-025) have recorded test coverage or results.

### Deployment

- No deployment recorded yet -- the approved AWS static hosting setup has not been documented as implemented or released.

### Maintenance

- No post-deployment maintenance notes exist -- expected, since the app has not yet been deployed.
<!-- sdlc:auto:end open-gaps -->
