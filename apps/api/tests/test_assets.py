from fastapi.testclient import TestClient


def _register_and_login(client: TestClient, email: str) -> dict[str, str]:
    password = "a-strong-password-123"
    registration = client.post(
        "/auth/register",
        json={"email": email, "password": password},
    )
    assert registration.status_code == 201

    login = client.post(
        "/auth/login",
        json={"email": email, "password": password},
    )
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def test_asset_endpoints_require_authentication(client: TestClient) -> None:
    assert client.get("/assets").status_code == 401
    assert client.post(
        "/assets",
        json={"name": "Laptop", "asset_tag": "LT-001"},
    ).status_code == 401


def test_cors_preflight_allows_browser_requests(client: TestClient) -> None:
    response = client.options(
        "/assets",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Authorization, Content-Type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
    assert "POST" in response.headers["access-control-allow-methods"]
    assert "OPTIONS" in response.headers["access-control-allow-methods"]


def test_asset_inventory_crud_and_duplicate_tag_rejection(
    client: TestClient,
) -> None:
    headers = _register_and_login(client, "owner@example.com")
    asset_payload = {
        "name": "Engineering laptop",
        "asset_tag": "lt-001",
        "category": "Laptop",
        "assigned_to": "Alex",
        "location": "Floor 2",
    }

    created = client.post("/assets", json=asset_payload, headers=headers)
    assert created.status_code == 201
    asset = created.json()
    assert asset["asset_tag"] == "LT-001"
    assert asset["status"] == "active"
    assert "owner_id" not in asset

    duplicate = client.post(
        "/assets",
        json={**asset_payload, "asset_tag": "LT-001"},
        headers=headers,
    )
    assert duplicate.status_code == 409

    updated = client.patch(
        f"/assets/{asset['id']}",
        json={"status": "maintenance", "assigned_to": None},
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "maintenance"
    assert updated.json()["assigned_to"] is None

    listed = client.get("/assets", headers=headers)
    assert listed.status_code == 200
    assert [item["id"] for item in listed.json()] == [asset["id"]]

    deleted = client.delete(f"/assets/{asset['id']}", headers=headers)
    assert deleted.status_code == 204
    assert client.get("/assets", headers=headers).json() == []


def test_asset_records_are_isolated_between_users(client: TestClient) -> None:
    owner_headers = _register_and_login(client, "owner@example.com")
    other_headers = _register_and_login(client, "other@example.com")
    created = client.post(
        "/assets",
        json={"name": "Router", "asset_tag": "NET-01"},
        headers=owner_headers,
    )
    asset_id = created.json()["id"]

    assert client.get("/assets", headers=other_headers).json() == []
    assert client.patch(
        f"/assets/{asset_id}", json={"status": "retired"}, headers=other_headers
    ).status_code == 404
    assert client.delete(
        f"/assets/{asset_id}", headers=other_headers
    ).status_code == 404


def test_asset_updates_require_a_valid_change(client: TestClient) -> None:
    headers = _register_and_login(client, "owner@example.com")
    created = client.post(
        "/assets",
        json={"name": "Router", "asset_tag": "NET-01"},
        headers=headers,
    )
    asset_id = created.json()["id"]

    empty_update = client.patch(f"/assets/{asset_id}", json={}, headers=headers)
    null_name = client.patch(
        f"/assets/{asset_id}", json={"name": None}, headers=headers
    )

    assert empty_update.status_code == 422
    assert null_name.status_code == 422
