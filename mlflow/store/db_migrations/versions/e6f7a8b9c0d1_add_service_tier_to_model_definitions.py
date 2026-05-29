"""add service_tier to model_definitions

Create Date: 2026-05-29 00:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "e6f7a8b9c0d1"
down_revision = "da6fb0208061"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("model_definitions", schema=None) as batch_op:
        batch_op.add_column(sa.Column("service_tier", sa.String(length=255), nullable=True))


def downgrade():
    with op.batch_alter_table("model_definitions", schema=None) as batch_op:
        batch_op.drop_column("service_tier")
