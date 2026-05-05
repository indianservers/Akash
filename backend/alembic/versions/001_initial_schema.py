"""initial schema

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-05-05 09:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # users
    op.create_table(
        "users",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("User", "Admin", "SuperAdmin", name="userrole"), default="User", nullable=False),
        sa.Column("status", sa.Enum("Active", "Suspended", "Deleted", name="userstatus"), default="Active", nullable=False),
        sa.Column("email_verified", sa.Boolean(), default=False),
        sa.Column("phone_verified", sa.Boolean(), default=False),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_users_email", "users", ["email"])

    # stars
    op.create_table(
        "stars",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("catalog_id", sa.String(100), nullable=True),
        sa.Column("hip_id", sa.String(50), nullable=True),
        sa.Column("hd_id", sa.String(50), nullable=True),
        sa.Column("gaia_id", sa.String(100), nullable=True),
        sa.Column("bayer_designation", sa.String(100), nullable=True),
        sa.Column("flamsteed_designation", sa.String(100), nullable=True),
        sa.Column("common_name", sa.String(255), nullable=True),
        sa.Column("scientific_name", sa.String(255), nullable=True),
        sa.Column("custom_name", sa.String(255), nullable=True),
        sa.Column("ra", sa.DECIMAL(10, 6), nullable=False),
        sa.Column("ra_unit", sa.Enum("degrees", "hours", name="raunit"), default="degrees"),
        sa.Column("dec", sa.DECIMAL(10, 6), nullable=False),
        sa.Column("magnitude", sa.DECIMAL(6, 3), nullable=True),
        sa.Column("absolute_magnitude", sa.DECIMAL(6, 3), nullable=True),
        sa.Column("constellation", sa.String(100), nullable=True),
        sa.Column("constellation_abbr", sa.String(10), nullable=True),
        sa.Column("spectral_class", sa.String(50), nullable=True),
        sa.Column("star_type", sa.Enum(
            "Main Sequence Star", "Red Giant", "Blue Giant", "White Dwarf", "Red Dwarf",
            "Yellow Dwarf", "Supergiant", "Hypergiant", "Neutron Star", "Binary Star",
            "Variable Star", "Cepheid Variable", "Pulsating Variable", "Brown Dwarf",
            "Protostar", "Wolf-Rayet Star", "Carbon Star", "T Tauri Star", "Subgiant",
            "Unknown / Unclassified", name="startype"
        ), default="Unknown / Unclassified"),
        sa.Column("color_index_bv", sa.DECIMAL(6, 3), nullable=True),
        sa.Column("distance_light_years", sa.DECIMAL(15, 4), nullable=True),
        sa.Column("parallax", sa.DECIMAL(10, 6), nullable=True),
        sa.Column("radial_velocity", sa.DECIMAL(10, 3), nullable=True),
        sa.Column("proper_motion_ra", sa.DECIMAL(10, 4), nullable=True),
        sa.Column("proper_motion_dec", sa.DECIMAL(10, 4), nullable=True),
        sa.Column("temperature_kelvin", sa.DECIMAL(10, 2), nullable=True),
        sa.Column("luminosity", sa.DECIMAL(15, 6), nullable=True),
        sa.Column("mass_solar", sa.DECIMAL(10, 4), nullable=True),
        sa.Column("radius_solar", sa.DECIMAL(10, 4), nullable=True),
        sa.Column("age_million_years", sa.DECIMAL(15, 2), nullable=True),
        sa.Column("is_visible_naked_eye", sa.Boolean(), default=True),
        sa.Column("is_named", sa.Boolean(), default=False),
        sa.Column("is_available_for_naming", sa.Boolean(), default=True),
        sa.Column("is_reserved", sa.Boolean(), default=False),
        sa.Column("registry_status", sa.Enum(
            "Available", "Pending", "Approved", "Expired", "Rejected", name="registrystatus"
        ), default="Available"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_stars_catalog_id", "stars", ["catalog_id"])
    op.create_index("ix_stars_hip_id", "stars", ["hip_id"])
    op.create_index("ix_stars_magnitude", "stars", ["magnitude"])
    op.create_index("ix_stars_constellation", "stars", ["constellation"])
    op.create_index("ix_stars_is_named", "stars", ["is_named"])
    op.create_index("ix_stars_is_available_for_naming", "stars", ["is_available_for_naming"])
    op.create_index("ix_stars_registry_status", "stars", ["registry_status"])

    # star_naming_requests
    op.create_table(
        "star_naming_requests",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("star_id", sa.BigInteger(), sa.ForeignKey("stars.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("user_id", sa.BigInteger(), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("requested_name", sa.String(255), nullable=False),
        sa.Column("dedication_type", sa.Enum(
            "In Memory Of", "Dedicated To", "Self", "Gift", "Birthday", "Anniversary",
            "Wedding", "Graduation", "New Born Baby", "Friendship", "Parents",
            "Spiritual Dedication", "Teacher / Mentor", "Corporate Gift", "Custom Dedication",
            name="dedicationtype"
        ), nullable=False),
        sa.Column("dedication_message", sa.Text(), nullable=True),
        sa.Column("relationship", sa.String(100), nullable=True),
        sa.Column("occasion", sa.String(100), nullable=True),
        sa.Column("occasion_date", sa.DateTime(), nullable=True),
        sa.Column("recipient_name", sa.String(255), nullable=True),
        sa.Column("applicant_name", sa.String(255), nullable=False),
        sa.Column("certificate_name", sa.String(255), nullable=True),
        sa.Column("validity_plan", sa.Enum("1year", "5years", "lifetime", "custom", name="validityplan"), default="1year"),
        sa.Column("visibility_preference", sa.Enum("Public", "Private", "Link Only", name="visibilitypreference"), default="Public"),
        sa.Column("status", sa.Enum("Pending", "Approved", "Rejected", "Expired", "Cancelled", name="requeststatus"), default="Pending"),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("approved_by", sa.BigInteger(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("approved_at", sa.DateTime(), nullable=True),
        sa.Column("expiry_date", sa.DateTime(), nullable=True),
        sa.Column("renewal_allowed", sa.Boolean(), default=True),
        sa.Column("renewal_count", sa.Integer(), default=0),
        sa.Column("payment_status", sa.Enum("Pending", "Paid", "Failed", "Refunded", "Free", name="paymentstatus"), default="Free"),
        sa.Column("payment_reference", sa.String(255), nullable=True),
        sa.Column("certificate_id", sa.String(100), unique=True, nullable=True),
        sa.Column("certificate_url", sa.String(500), nullable=True),
        sa.Column("share_slug", sa.String(100), unique=True, nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_snr_star_id", "star_naming_requests", ["star_id"])
    op.create_index("ix_snr_user_id", "star_naming_requests", ["user_id"])
    op.create_index("ix_snr_status", "star_naming_requests", ["status"])
    op.create_index("ix_snr_expiry_date", "star_naming_requests", ["expiry_date"])
    op.create_index("ix_snr_certificate_id", "star_naming_requests", ["certificate_id"])
    op.create_index("ix_snr_share_slug", "star_naming_requests", ["share_slug"])

    # audit_logs
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("actor_user_id", sa.BigInteger(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", sa.String(100), nullable=True),
        sa.Column("old_value", sa.JSON(), nullable=True),
        sa.Column("new_value", sa.JSON(), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_audit_action", "audit_logs", ["action"])
    op.create_index("ix_audit_entity_type", "audit_logs", ["entity_type"])
    op.create_index("ix_audit_entity_id", "audit_logs", ["entity_id"])
    op.create_index("ix_audit_created_at", "audit_logs", ["created_at"])


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("star_naming_requests")
    op.drop_table("stars")
    op.drop_table("users")
