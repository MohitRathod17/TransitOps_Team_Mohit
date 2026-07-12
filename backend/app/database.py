from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.config import settings

<<<<<<< HEAD
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

engine = create_async_engine(DATABASE_URL, connect_args=connect_args, echo=False, future=True)
=======
# SQLite database for easy local setup
DATABASE_URL = "sqlite+aiosqlite:///./transitops.db"

engine = create_async_engine(DATABASE_URL, echo=False, future=True)
>>>>>>> 4743ddb1fcc3073d38e552c7334c81c51575aae1
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
<<<<<<< HEAD
        # Import all models here to register them with Base.metadata
=======
>>>>>>> 4743ddb1fcc3073d38e552c7334c81c51575aae1
        from app.models import Base as ModelsBase
        await conn.run_sync(ModelsBase.metadata.create_all)
