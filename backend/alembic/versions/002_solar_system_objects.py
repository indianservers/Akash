"""solar system objects

Revision ID: 002_solar_system_objects
Revises: 001_initial_schema
Create Date: 2026-05-05 20:30:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002_solar_system_objects"
down_revision: Union[str, None] = "001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "solar_system_objects",
        sa.Column("id", sa.String(40), primary_key=True),
        sa.Column("common_name", sa.String(100), nullable=False),
        sa.Column(
            "object_type",
            sa.Enum("Planet", "Dwarf Planet", "Moon", name="solarsystemobjecttype"),
            nullable=False,
        ),
        sa.Column("astronomy_body", sa.String(40), nullable=False),
        sa.Column("mean_radius_km", sa.DECIMAL(12, 3), nullable=True),
        sa.Column("orbital_period_days", sa.DECIMAL(12, 4), nullable=True),
        sa.Column("average_magnitude", sa.DECIMAL(6, 3), nullable=True),
        sa.Column("naked_eye_visible", sa.Boolean(), default=False),
        sa.Column("notes", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("solar_system_objects")
