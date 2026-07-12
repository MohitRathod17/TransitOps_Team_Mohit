import asyncio
from datetime import date, timedelta, datetime
from decimal import Decimal
from sqlalchemy.future import select
from app.database import AsyncSessionLocal
from app.models import Vehicle, VehicleStatus, Driver, DriverStatus, Trip, TripStatus, FuelLog

async def seed_historical():
    async with AsyncSessionLocal() as db:
        # Check if we already have seeded historical data
        trips_count_res = await db.execute(select(Trip))
        trips_count = len(trips_count_res.scalars().all())
        # If we have less than 10 trips, let's seed some historical completed trips across the last 7 days!
        if trips_count >= 10:
            print("Already have enough trips. Skipping historical seed.")
            return
            
        print("Seeding historical completed trips and fuel logs for the last 7 days...")
        
        # 1. Fetch some vehicles
        v_res = await db.execute(select(Vehicle).filter(Vehicle.status != VehicleStatus.RETIRED))
        vehicles = v_res.scalars().all()
        if not vehicles:
            print("No vehicles found! Make sure to run test_workflow.py first or register vehicles.")
            # Let's seed a vehicle if none exists so that seeder runs clean
            vehicle = Vehicle(
                registration_number="SEMI-01",
                model="Volvo FH16",
                type="Semi",
                max_load_capacity=Decimal("20000.0"),
                odometer=Decimal("15000.0"),
                acquisition_cost=Decimal("120000.0"),
                status=VehicleStatus.AVAILABLE,
                region="North"
            )
            db.add(vehicle)
            await db.commit()
            await db.refresh(vehicle)
            vehicles = [vehicle]
            
        # 2. Fetch some drivers
        d_res = await db.execute(select(Driver))
        drivers = d_res.scalars().all()
        if not drivers:
            print("No drivers found! Make sure to onboard drivers first.")
            # Let's see if we have a user
            from app.models import User, Role
            role_res = await db.execute(select(Role).filter(Role.name == "Driver"))
            role = role_res.scalars().first()
            if not role:
                role = Role(name="Driver")
                db.add(role)
                await db.commit()
                await db.refresh(role)
                
            user = User(
                email="driver@transitops.com",
                password_hash="hashedpassword",
                full_name="Alex Smith",
                role_id=role.id,
                is_verified=True
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            
            driver = Driver(
                user_id=user.id,
                name="Alex Smith",
                license_number="DL-9834571",
                license_category="Class C",
                license_expiry_date=date(2030, 12, 31),
                contact_number="+1 555-0199",
                status=DriverStatus.AVAILABLE
            )
            db.add(driver)
            await db.commit()
            await db.refresh(driver)
            drivers = [driver]

        today = date.today()
        # Seed completed trips for the last 6 days (excluding today to let today's trips be created by test/user)
        for i in range(6, 0, -1):
            d = today - timedelta(days=i)
            trip_date = datetime.combine(d, datetime.min.time()) + timedelta(hours=10) # 10:00 AM
            
            vehicle = vehicles[i % len(vehicles)]
            driver = drivers[i % len(drivers)]
            
            # Cargo weight between 30% and 90% of max load capacity
            cargo_weight = vehicle.max_load_capacity * Decimal(f"0.{30 + i * 10}")
            if cargo_weight > vehicle.max_load_capacity:
                cargo_weight = vehicle.max_load_capacity * Decimal("0.75")
                
            planned_distance = Decimal("150.0") + Decimal(str(i * 20))
            actual_distance = planned_distance
            
            fuel_consumed = actual_distance * Decimal("0.12") # ~8.3 km/L
            revenue = actual_distance * Decimal("2.5") # ₹2.5 per km
            
            trip = Trip(
                source="Warehouse A",
                destination="Retail Outlet B",
                vehicle_id=vehicle.id,
                driver_id=driver.id,
                cargo_weight=cargo_weight,
                planned_distance=planned_distance,
                actual_distance=actual_distance,
                status=TripStatus.COMPLETED,
                revenue=revenue,
                fuel_consumed=fuel_consumed,
                final_odometer=vehicle.odometer + actual_distance,
                created_at=trip_date,
                dispatched_at=trip_date + timedelta(minutes=15),
                completed_at=trip_date + timedelta(hours=4)
            )
            db.add(trip)
            await db.flush()
            
            # Create a Fuel Log
            fuel_price_per_liter = Decimal("1.40")
            fuel_cost = fuel_consumed * fuel_price_per_liter
            
            fuel_log = FuelLog(
                vehicle_id=vehicle.id,
                trip_id=trip.id,
                liters=fuel_consumed,
                cost=fuel_cost,
                date=d,
                created_at=trip_date + timedelta(hours=4)
            )
            db.add(fuel_log)
            
        await db.commit()
        print("Historical seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed_historical())
