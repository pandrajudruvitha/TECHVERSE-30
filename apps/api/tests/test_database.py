import pytest

from app.database import normalize_database_url


@pytest.mark.parametrize(
    ("database_url", "expected"),
    [
        (
            "postgresql://user:secret@db.example:5432/techverse?sslmode=require",
            "postgresql+psycopg://user:secret@db.example:5432/techverse?sslmode=require",
        ),
        (
            "postgresql+psycopg://user:secret@db.example:5432/techverse",
            "postgresql+psycopg://user:secret@db.example:5432/techverse",
        ),
        ("sqlite:///./test.db", "sqlite:///./test.db"),
    ],
)
def test_normalize_database_url(database_url: str, expected: str) -> None:
    assert normalize_database_url(database_url) == expected
