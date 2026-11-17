from fastapi.testclient import TestClient


def test_register_login_and_read_current_user(client: TestClient) -> None:
    registration = client.post(
        "/auth/register",
        json={"email": "Person@Example.com", "password": "a-strong-password-123"},
    )

    assert registration.status_code == 201
    assert registration.json()["email"] == "person@example.com"
    assert "hashed_password" not in registration.json()

    login = client.post(
        "/auth/login",
        json={"email": "PERSON@example.com", "password": "a-strong-password-123"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]

    current_user = client.get(
        "/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert current_user.status_code == 200
    assert current_user.json()["email"] == "person@example.com"


def test_duplicate_email_is_rejected(client: TestClient) -> None:
    response = client.post(
        "/auth/register",
        json={"email": "person@example.com", "password": "a-strong-password-123"},
    )
    assert response.status_code == 201

    duplicate = client.post(
        "/auth/register",
        json={"email": "PERSON@example.com", "password": "a-different-password-456"},
    )
    assert duplicate.status_code == 409


def test_invalid_credentials_and_missing_token_are_rejected(client: TestClient) -> None:
    client.post(
        "/auth/register",
        json={"email": "person@example.com", "password": "a-strong-password-123"},
    )

    login = client.post(
        "/auth/login",
        json={"email": "person@example.com", "password": "incorrect-password"},
    )
    assert login.status_code == 401
    assert client.get("/auth/me").status_code == 401
    assert client.get(
        "/auth/me", headers={"Authorization": "Bearer not-a-token"}
    ).status_code == 401


def test_registration_rejects_short_password(client: TestClient) -> None:
    response = client.post(
        "/auth/register",
        json={"email": "person@example.com", "password": "short"},
    )
    assert response.status_code == 422
