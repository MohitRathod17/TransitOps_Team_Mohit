import asyncio
from sqlalchemy import text
from app.database import AsyncSessionLocal

async def verify_all():
    async with AsyncSessionLocal() as db:
        await db.execute(text("UPDATE users SET is_verified = 1"))
        await db.commit()
    print("All users updated to is_verified = 1")

if __name__ == "__main__":
    asyncio.run(verify_all())
