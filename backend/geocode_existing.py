import asyncio
import httpx
from decimal import Decimal
from sqlalchemy.future import select
from app.database import engine, AsyncSessionLocal
from app.models import Trip

async def update_existing_trips():
    async with AsyncSessionLocal() as db:
        # Find trips missing coordinates
        result = await db.execute(select(Trip).filter(Trip.source_lat.is_(None)))
        trips = result.scalars().all()
        
        if not trips:
            print("No trips need updating.")
            return

        async with httpx.AsyncClient() as client:
            headers = {"User-Agent": "TransitOps/1.0 (transitops@local)"}
            for trip in trips:
                print(f"Updating Trip #{trip.id}: {trip.source} -> {trip.destination}")
                try:
                    # Geocode source
                    src_res = await client.get(
                        "https://nominatim.openstreetmap.org/search",
                        params={"q": trip.source, "format": "json", "limit": 1},
                        headers=headers,
                        timeout=5.0
                    )
                    if src_res.status_code == 200 and src_res.json():
                        trip.source_lat = Decimal(src_res.json()[0]["lat"])
                        trip.source_lng = Decimal(src_res.json()[0]["lon"])
                    
                    # Geocode destination
                    dest_res = await client.get(
                        "https://nominatim.openstreetmap.org/search",
                        params={"q": trip.destination, "format": "json", "limit": 1},
                        headers=headers,
                        timeout=5.0
                    )
                    if dest_res.status_code == 200 and dest_res.json():
                        trip.dest_lat = Decimal(dest_res.json()[0]["lat"])
                        trip.dest_lng = Decimal(dest_res.json()[0]["lon"])
                        
                    await db.commit()
                    print(f"  [OK] Saved coordinates for Trip #{trip.id}")
                except Exception as e:
                    print(f"  [Error] Failed to geocode Trip #{trip.id}: {e}")
                    
if __name__ == "__main__":
    asyncio.run(update_existing_trips())
