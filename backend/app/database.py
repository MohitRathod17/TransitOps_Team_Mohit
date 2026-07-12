from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.config import settings

from urllib.parse import quote_plus

# Determine DB URL: support SQLite for offline local verification if DB_HOST is set to sqlite
if settings.DB_HOST == "sqlite":
    DATABASE_URL = "sqlite+aiosqlite:///./transitops.db"
else:
    escaped_password = quote_plus(settings.DB_PASSWORD) if settings.DB_PASSWORD else ""
    DB_PASS_PART = f":{escaped_password}" if escaped_password else ""
    DATABASE_URL = f"mysql+aiomysql://{settings.DB_USER}{DB_PASS_PART}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"

connect_args = {}
if settings.DB_HOST != "sqlite" and settings.DB_SSL:
    if settings.DB_SSL_CA_PATH:
        connect_args["ssl"] = {"ca": settings.DB_SSL_CA_PATH}
    else:
        connect_args["ssl"] = True

engine = create_async_engine(
    DATABASE_URL, 
    connect_args=connect_args, 
    echo=False, 
    future=True,
    pool_recycle=30,
    pool_pre_ping=True
)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    async with engine.begin() as conn:
        # Import all models here to register them with Base.metadata
        from app.models import Base as ModelsBase
        await conn.run_sync(ModelsBase.metadata.create_all)

    # Dynamic schema upgrades: add new columns if they don't exist
    from sqlalchemy import text
    for sql in [
        "ALTER TABLE users ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT FALSE",
        "ALTER TABLE driver_documents ADD COLUMN expiry_date DATE NULL",
        "ALTER TABLE vehicle_documents ADD COLUMN expiry_date DATE NULL"
    ]:
        try:
            async with engine.begin() as conn:
                await conn.execute(text(sql))
                print(f"[SCHEMA UPGRADE SUCCESS] Executed: {sql}")
        except Exception as e:
            # Column might already exist, log warning but continue
            error_msg = str(e)
            if "Duplicate column name" in error_msg or "already exists" in error_msg.lower():
                print(f"[SCHEMA UPGRADE INFO] Skipping/already exists: {sql}")
            else:
                print(f"[SCHEMA UPGRADE ERROR] Failed to execute {sql}: {e}")
