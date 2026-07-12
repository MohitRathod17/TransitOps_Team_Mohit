"""
Migration script: Add source_lat, source_lng, dest_lat, dest_lng to trips table.
Run once with: python migrate_map.py
"""
import asyncio
from sqlalchemy import text
from app.database import engine

async def run_migrations():
    async with engine.begin() as conn:
        columns_to_add = [
            ("source_lat", "DECIMAL(10, 7)"),
            ("source_lng", "DECIMAL(10, 7)"),
            ("dest_lat", "DECIMAL(10, 7)"),
            ("dest_lng", "DECIMAL(10, 7)"),
        ]

        for col_name, col_type in columns_to_add:
            try:
                await conn.execute(text(f"ALTER TABLE trips ADD COLUMN {col_name} {col_type}"))
                print(f"[OK] Added column: trips.{col_name}")
            except Exception as e:
                if "duplicate column name" in str(e).lower() or "1060" in str(e):
                    print(f"[SKIP] trips.{col_name} already exists")
                else:
                    raise

    print("\nMigration complete.")

if __name__ == "__main__":
    asyncio.run(run_migrations())
