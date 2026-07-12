"""
Re-seed migration: update role_permissions to match the correct matrix from the UI image.
Run with: .\venv\Scripts\python.exe reseed_permissions.py
"""
import asyncio
from sqlalchemy import text
from app.database import AsyncSessionLocal
from sqlalchemy.future import select
from app.models import Role, RolePermission

MATRIX = {
    "Fleet Manager": {
        "dashboard": "view", "fleet": "full", "drivers": "full",
        "trips": "full", "maintenance": "full", "expenses": "view",
        "analytics": "view", "settings": "full",
    },
    "Driver": {
        "dashboard": "view", "fleet": "none", "drivers": "none",
        "trips": "full", "maintenance": "none", "expenses": "none",
        "analytics": "none", "settings": "none",
    },
    "Safety Officer": {
        "dashboard": "view", "fleet": "none", "drivers": "full",
        "trips": "none", "maintenance": "none", "expenses": "none",
        "analytics": "view", "settings": "none",
    },
    "Financial Analyst": {
        "dashboard": "view", "fleet": "view", "drivers": "none",
        "trips": "view", "maintenance": "view", "expenses": "full",
        "analytics": "full", "settings": "none",
    },
}

async def reseed():
    async with AsyncSessionLocal() as db:
        # Clear existing permissions
        await db.execute(text("DELETE FROM role_permissions"))
        await db.commit()
        print("[OK] Cleared role_permissions table")

        for role_name, modules in MATRIX.items():
            res = await db.execute(select(Role).filter(Role.name == role_name))
            role = res.scalars().first()
            if not role:
                role = Role(name=role_name)
                db.add(role)
                await db.commit()
                await db.refresh(role)
                print(f"[OK] Created role: {role_name}")
            
            for module, level in modules.items():
                db.add(RolePermission(role_id=role.id, module=module, access_level=level))
            print(f"[OK] Seeded permissions for: {role_name}")
        
        await db.commit()
        print("\nAll permissions reseeded successfully.")

if __name__ == "__main__":
    asyncio.run(reseed())
