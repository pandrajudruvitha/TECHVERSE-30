"""Create user-owned IT inventory assets.

Revision ID: 0002_create_assets
Revises: 0001_create_users
"""
from typing import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0002_create_assets"
down_revision: str | None = "0001_create_users"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "assets",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("asset_tag", sa.String(length=64), nullable=False),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column("assigned_to", sa.String(length=160), nullable=True),
        sa.Column("location", sa.String(length=160), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("owner_id", "asset_tag", name="uq_assets_owner_asset_tag"),
    )
    op.create_index("ix_assets_owner_id", "assets", ["owner_id"])


def downgrade() -> None:
    op.drop_index("ix_assets_owner_id", table_name="assets")
    op.drop_table("assets")
