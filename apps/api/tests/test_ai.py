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
