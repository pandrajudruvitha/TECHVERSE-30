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
