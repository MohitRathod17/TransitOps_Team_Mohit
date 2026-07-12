"""
Migration script: Add failed_attempts, is_locked to users table
and create role_permissions table if it doesn't exist.
Run once with: .\venv\Scripts\python.exe migrate.py
"""
import asyncio
from sqlalchemy import text
from app.database import engine, AsyncSessionLocal
from app.models import Base

async def run_migrations():
    async with engine.begin() as conn:
        # ---- users table: add failed_attempts ----
        try:
            await conn.execute(text(
                "ALTER TABLE users ADD COLUMN failed_attempts INT NOT NULL DEFAULT 0"
            ))
            print("[OK] Added column: users.failed_attempts")
        except Exception as e:
            if "Duplicate column" in str(e) or "1060" in str(e):
                print("[SKIP] users.failed_attempts already exists")
            else:
                raise

        # ---- users table: add is_locked ----
        try:
            await conn.execute(text(
                "ALTER TABLE users ADD COLUMN is_locked TINYINT(1) NOT NULL DEFAULT 0"
            ))
            print("[OK] Added column: users.is_locked")
        except Exception as e:
            if "Duplicate column" in str(e) or "1060" in str(e):
                print("[SKIP] users.is_locked already exists")
            else:
                raise

        # ---- create role_permissions table ----
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS role_permissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                role_id INT NOT NULL,
                module VARCHAR(50) NOT NULL,
                access_level VARCHAR(20) NOT NULL,
                FOREIGN KEY (role_id) REFERENCES roles(id)
            )
        """))
        print("[OK] Ensured table: role_permissions")

    print("\nMigration complete. Restarting app will seed permissions.")

if __name__ == "__main__":
    asyncio.run(run_migrations())
