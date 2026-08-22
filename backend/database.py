from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./helpdesk.db"

# connect_args={"check_same_thread": False} is needed only for SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def ensure_schema_columns():
    """Ensure newly added columns exist in SQLite database if it was previously created."""
    with engine.connect() as conn:
        try:
            result = conn.exec_driver_sql("PRAGMA table_info(tickets);")
            existing_cols = {row[1] for row in result.fetchall()}
            if existing_cols:  # table exists
                new_cols = {
                    "resolver_comment": "TEXT",
                    "resolved_at": "DATETIME",
                    "resolver_updated_at": "DATETIME",
                    "resolver_rejection_reason": "TEXT"
                }
                for col_name, col_type in new_cols.items():
                    if col_name not in existing_cols:
                        conn.exec_driver_sql(f"ALTER TABLE tickets ADD COLUMN {col_name} {col_type};")
        except Exception as e:
            # Table might not exist yet before create_all
            pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()