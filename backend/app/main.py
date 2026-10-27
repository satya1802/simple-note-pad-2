"""Application entrypoint.

Generated from the approved architecture: one router per component that owns
endpoints, one route per endpoint the API spec declares. Every generated route
is a stub that returns a typed placeholder, so the service starts, serves its
OpenAPI document and passes its tests before a single handler is implemented.

The approved api_spec names exactly one endpoint for this service, `GET /`:
serve the built Notepad SPA. Everything else the product does (creating,
editing, deleting, filtering notes) happens entirely in the browser against
IndexedDB (NFR-001) -- there is no route to stub for any of that.
"""

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app import models  # noqa: F401 -- imported so the tables register before create_all
from app.database import Base, engine

app = FastAPI(
    title="simple note pad",
    description="simple note pad",
    version="0.1.0",
)

# The SPA runs on a different origin than the API, so the browser refuses its calls
# unless that origin is allowed here. In development that is the Vite dev server; when
# deployed, the platform injects the frontend's real URL as ALLOWED_ORIGINS (comma
# separated). Point ALLOWED_ORIGINS at the real thing and nothing else has to change.
_dev_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
_allowed_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins or _dev_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# The scaffold ships no migrations, so the tables are created from the models on
# startup. The approved data model's only entity, `note`, lives entirely in the
# browser's IndexedDB (NFR-001, ADR-0003) -- `models.py` declares no tables, so
# this stays a no-op kept for the day a server-side feature actually needs it.
Base.metadata.create_all(bind=engine)


@app.get("/health")
async def health() -> dict[str, str]:
    """Liveness probe, and the only route here that is not serving the SPA."""
    return {"status": "ok"}


# The one route the approved api_spec declares: `GET /` serves the built Notepad
# SPA's static files. `backend/Dockerfile` builds `frontend/` and copies its
# output to `STATIC_DIR` (default: a `static/` folder next to `app/`); setting
# `STATIC_DIR` lets a local `uvicorn --reload` point at a build without
# rebuilding the image. Left unset with no build present (a backend-only
# `pytest` run, for instance), the service still starts -- see the `else`
# branch below -- rather than fail at import time.
STATIC_DIR = Path(os.getenv("STATIC_DIR", Path(__file__).resolve().parent.parent / "static"))
_INDEX_HTML = STATIC_DIR / "index.html"

if _INDEX_HTML.is_file():
    _assets_dir = STATIC_DIR / "assets"
    if _assets_dir.is_dir():
        # Vite's own bundle output (`/assets/*.js`, `/assets/*.css`), hashed
        # filenames safe to cache hard.
        app.mount("/assets", StaticFiles(directory=_assets_dir), name="assets")

    @app.get("/")
    async def index() -> FileResponse:
        """Serve the built Notepad SPA (HTML/JS/CSS) to the browser on first
        visit -- the only server interaction in the product (api_spec `GET /`)."""
        return FileResponse(_INDEX_HTML)

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str) -> FileResponse:
        """React Router owns every other path client-side (`/notes`, `/about`);
        a direct GET -- a refresh, a bookmark -- has to get the same
        `index.html` so the router can take over, rather than a 404 from this
        server. Serves any other built file the SPA references by path first."""
        candidate = STATIC_DIR / full_path
        if candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(_INDEX_HTML)

else:

    @app.get("/")
    async def index_not_built() -> JSONResponse:
        """No frontend build is present: a backend-only `pytest`/`uvicorn
        --reload` run, or an image built without the frontend stage. A clear
        503 instead of a crash at import time or a silent 404."""
        return JSONResponse(
            {
                "detail": (
                    "Frontend build not found. Run `npm run build` in frontend/ "
                    "and point STATIC_DIR at its output (frontend/dist), or build "
                    "the Docker image, which does this automatically."
                )
            },
            status_code=503,
        )
