from fastapi.testclient import TestClient

from app.main import app


def test_ai_status_unconfigured(client: TestClient, monkeypatch) -> None:
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    response = client.get("/ai/status")

    assert response.status_code == 200
    assert response.json()["configured"] is False


def test_ai_chat_requires_configuration(client: TestClient, monkeypatch) -> None:
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    response = client.post(
        "/ai/chat",
        json={"message": "Explain edge computing in one sentence."},
    )

    assert response.status_code == 503


def test_integration_status(client: TestClient, monkeypatch) -> None:
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    response = client.get("/integrations/status")

    assert response.status_code == 200
    assert response.json() == {
        "api": "connected",
        "ai_configured": False,
        "ai_model": "gpt-4o-mini",
        "assets": "authenticated",
        "module_workbenches": "browser-local",
    }


def test_security_headers_and_status(client: TestClient) -> None:
    health = client.get("/health")
    status = client.get("/security/status")

    assert health.status_code == 200
    assert health.headers["x-content-type-options"] == "nosniff"
    assert health.headers["x-frame-options"] == "DENY"
    assert health.headers["referrer-policy"] == "strict-origin-when-cross-origin"
    assert status.status_code == 200
    assert status.json()["bearer_auth"] is True
    assert status.json()["cors_allowlist"] is True


def test_sensitive_routes_disable_browser_cache(client: TestClient) -> None:
    response = client.get("/ai/status")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"


def test_request_body_limit(client: TestClient) -> None:
    response = client.post(
        "/auth/register",
        content=b"x" * (64 * 1024 + 1),
        headers={"Content-Type": "application/json"},
    )

    assert response.status_code == 413
