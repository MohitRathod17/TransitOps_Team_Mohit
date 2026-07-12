import asyncio
from sqlalchemy import text
from app.database import AsyncSessionLocal

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(text("SELECT count(*) FROM fuel_logs"))
        print("Fuel logs count:", res.scalar())
        res = await db.execute(text("SELECT count(*) FROM trips"))
        print("Trips count:", res.scalar())
        res = await db.execute(text("SELECT * FROM fuel_logs LIMIT 10"))
        print("Fuel logs sample:", res.all())
        res = await db.execute(text("SELECT * FROM trips LIMIT 10"))
        print("Trips sample:", res.all())

if __name__ == "__main__":
    asyncio.run(check())
