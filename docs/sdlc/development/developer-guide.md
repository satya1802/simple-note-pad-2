# Developer Guide

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start status -->
_Up to date._
<!-- sdlc:auto:end status -->

<!-- sdlc:auto:start source -->
Generated from commit `bb0cad4` · model `claude-sonnet-5`
<!-- sdlc:auto:end source -->

<!-- sdlc:auto:start overview -->
Simple note pad is a generated scaffold from the Quorq AI SDLC platform, consisting of a React 19 + Vite frontend (approved screens running on seeded sample data) and a FastAPI backend that currently only exposes a health check endpoint, with no architecture or data model approved yet. The backend uses SQLAlchemy over SQLite by default (swappable to Postgres via DATABASE_URL), and the repo includes a docker-compose file that stands up a Postgres 16 database for when the backend is wired up.
<!-- sdlc:auto:end overview -->

<!-- sdlc:auto:start prerequisites -->
- Node.js (for Vite 6 / React 19 frontend tooling)
- Python 3.12
- pip
- Docker and Docker Compose (optional, for the Postgres database service)
<!-- sdlc:auto:end prerequisites -->

<!-- sdlc:auto:start setup -->
1. Clone the repository
2. cd frontend && npm install
3. cd backend && pip install -r requirements.txt
4. (optional) docker compose up -d to start the Postgres database if you want to point DATABASE_URL at it instead of the default SQLite file
5. (optional) set ALLOWED_ORIGINS, DATABASE_URL, VITE_API_BASE_URL, VITE_API_SECRET_KEY as needed per .env.example
<!-- sdlc:auto:end setup -->

<!-- sdlc:auto:start run -->
| Name | Command | Description |
|---|---|---|
| frontend dev | `npm run dev` | Starts the Vite dev server for the React SPA |
| frontend build | `npm run build` | Bundles the app with Vite (does not typecheck) |
| frontend preview | `npm run preview` | Serves the production build locally |
| backend dev | `uvicorn app.main:app --reload` | Runs the FastAPI backend with auto-reload from the backend/ directory |
| docker compose | `docker compose up -d` | Starts the Postgres 16 database container defined in docker-compose.yml |
<!-- sdlc:auto:end run -->

<!-- sdlc:auto:start structure -->
| Path | Purpose |
|---|---|
| `frontend/` | React + Vite SPA; approved screens running on seeded sample data |
| `frontend/src` | Application source: entry point, shared UI/icon libraries, API client (src/lib) |
| `frontend/e2e` | Playwright end-to-end acceptance tests |
| `backend/` | FastAPI service; currently only a health check, scaffolded for future routers |
| `backend/app` | App package: main entrypoint, database setup, SQLAlchemy models, Pydantic schemas, routers package |
| `backend/tests` | Pytest tests for the backend (currently health check) |
| `.quorq/` | Platform handoff metadata |
<!-- sdlc:auto:end structure -->

<!-- sdlc:auto:start conventions -->
- Backend: one router per architecture component, one route per API spec endpoint; unimplemented routes return a typed StubResponse
- SQLAlchemy models all inherit from the shared Base in app/database.py; models.py is imported in main.py before create_all so tables register
- Backend defaults to SQLite (app.db) via DATABASE_URL env var so the service starts without a database server; set DATABASE_URL to use Postgres
- CORS allowed origins are driven by the ALLOWED_ORIGINS env var (comma-separated), falling back to local Vite dev origins
- Frontend screens live under src/screens (per README) and currently render seeded sample data rather than calling the API
- Frontend API calls go through the shared apiFetch helper in src/lib/api.ts, which reads VITE_API_BASE_URL and VITE_API_SECRET_KEY at build time and attaches a bearer token
- Component tests (Vitest) live beside the components they cover under src/; Playwright e2e specs live in e2e/ and are excluded from Vitest's include pattern
<!-- sdlc:auto:end conventions -->

<!-- sdlc:auto:start testing -->
| Name | Command | Description |
|---|---|---|
| frontend unit tests | `npm test` | Runs Vitest component tests under src/ |
| frontend e2e tests | `npm run test:e2e` | Runs Playwright acceptance tests from e2e/; builds/serves the app locally unless E2E_BASE_URL is set (run npm run test:e2e:install first to fetch Chromium) |
| frontend lint | `npm run lint` | Runs ESLint over the app (gate during development) |
| backend tests | `pytest` | Runs backend pytest suite (from backend/ directory) |
| backend lint | `ruff check .` | Lints the backend with Ruff |
<!-- sdlc:auto:end testing -->

<!-- sdlc:auto:start troubleshooting -->
| Problem | Solution |
|---|---|
| Frontend build succeeds but tsc fails | Run npm run typecheck (tsc --noEmit) to catch type errors that npm run build does not check |
| Backend calls from the frontend are blocked by CORS | Set the ALLOWED_ORIGINS env var on the backend to include the frontend's origin |
| pytest fails with 'cannot import app' when run from backend/ | pytest.ini sets pythonpath = . so run pytest from the backend/ directory |
| Want to use Postgres instead of the default SQLite | Start the db service with docker compose up -d, then set DATABASE_URL to point at it before starting uvicorn |
<!-- sdlc:auto:end troubleshooting -->
