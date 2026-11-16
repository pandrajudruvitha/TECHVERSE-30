import os
from functools import lru_cache
from collections.abc import Iterator

from fastapi import HTTPException
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import DeclarativeBase, Session


class Base(DeclarativeBase):
    pass


@lru_cache(maxsize=4)
def _engine_for_url(database_url: str) -> Engine:
    return create_engine(database_url, pool_pre_ping=True)


def get_engine() -> Engine:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise HTTPException(
            status_code=503,
            detail="Database is not configured. Set DATABASE_URL to enable authentication.",
        )
    return _engine_for_url(database_url)


def get_db() -> Iterator[Session]:
    with Session(get_engine()) as session:
        yield session
