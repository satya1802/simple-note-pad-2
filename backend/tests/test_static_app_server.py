"""Tests for the one route the approved api_spec declares: `GET /`.

The sandbox never builds the frontend, so these reload `app.main` under each
`STATIC_DIR` to exercise both branches it can take: no build present (what a
bare `pytest` run actually sees here) and a build present (what the Docker
image, or a developer who has run `npm run build`, sees).
"""

import importlib

from fastapi.testclient import TestClient


def _reload_main():
    """`STATIC_DIR` is read once, at import time, so changing it for a test
    requires re-running that import rather than just setting the env var."""
    from app import main as main_module

    return importlib.reload(main_module)


def test_root_without_a_build_reports_service_unavailable(monkeypatch, tmp_path):
    monkeypatch.setenv("STATIC_DIR", str(tmp_path / "missing"))
    main_module = _reload_main()
    client = TestClient(main_module.app)

    response = client.get("/")

    assert response.status_code == 503
    assert "Frontend build not found" in response.json()["detail"]


def test_root_serves_the_built_index_once_present(monkeypatch, tmp_path):
    static_dir = tmp_path / "static"
    static_dir.mkdir()
    (static_dir / "index.html").write_text("<html><body>Notepad</body></html>")
    monkeypatch.setenv("STATIC_DIR", str(static_dir))
    main_module = _reload_main()
    client = TestClient(main_module.app)

    response = client.get("/")

    assert response.status_code == 200
    assert "Notepad" in response.text


def test_an_unknown_client_route_falls_back_to_the_built_index(monkeypatch, tmp_path):
    """`/about` is never a server route -- React Router owns it -- so a direct
    GET (a refresh) still has to come back with `index.html`."""
    static_dir = tmp_path / "static"
    static_dir.mkdir()
    (static_dir / "index.html").write_text("<html><body>Notepad</body></html>")
    monkeypatch.setenv("STATIC_DIR", str(static_dir))
    main_module = _reload_main()
    client = TestClient(main_module.app)

    response = client.get("/about")

    assert response.status_code == 200
    assert "Notepad" in response.text
