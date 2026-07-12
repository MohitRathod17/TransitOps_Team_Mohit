from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, date
from decimal import Decimal
import httpx

from app.database import get_db
from app.models import Trip, TripStatus, Vehicle, VehicleStatus, Driver, DriverStatus, FuelLog, VerifiedStatus
from app.schemas import TripCreate, TripComplete, TripResponse
from app.auth import PermissionChecker, get_current_user

router = APIRouter(prefix="/trips", tags=["Trips"])

# Security
trips_view = PermissionChecker("trips", "view")
trips_full = PermissionChecker("trips", "full")

@router.get("/", response_model=List[TripResponse])
async def list_trips(
    status: Optional[TripStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(trips_view)
):
    query = select(Trip).options(
        selectinload(Trip.vehicle),
        selectinload(Trip.driver)
    )
    if status:
        query = query.filter(Trip.status == status)
        
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
async def create_trip(
    trip_in: TripCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(trips_full)
):
    # 1. Verify vehicle exists and is Available (cannot be In Shop, Retired, or On Trip)
    result_v = await db.execute(select(Vehicle).filter(Vehicle.id == trip_in.vehicle_id))
    vehicle = result_v.scalars().first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    if vehicle.status != VehicleStatus.AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle is not available. Current status: {vehicle.status.value}"
        )
        
    # Check if vehicle has verified registration and insurance documents
    has_verified_reg = any(d.document_type == "registration" and d.verified_status == VerifiedStatus.VERIFIED for d in vehicle.documents)
    has_verified_ins = any(d.document_type == "insurance" and d.verified_status == VerifiedStatus.VERIFIED for d in vehicle.documents)
    if not (has_verified_reg and has_verified_ins):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle '{vehicle.registration_number}' is unverified by a Safety Officer and cannot be assigned to a trip. Please upload and verify registration & insurance."
        )
        
    # 2. Verify driver exists and is Available (cannot be Off Duty, Suspended, or On Trip)
    result_d = await db.execute(select(Driver).filter(Driver.id == trip_in.driver_id))
    driver = result_d.scalars().first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
    if driver.status != DriverStatus.AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Driver is not available. Current status: {driver.status.value}"
        )
        
    # Check if driver has verified license document
    has_verified_license = any(d.document_type == "license" and d.verified_status == VerifiedStatus.VERIFIED for d in driver.documents)
    if not has_verified_license:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Driver '{driver.name}' is unverified by a Safety Officer and cannot be assigned to a trip. Please upload and verify driving license."
        )
        
    # 3. Verify driver's license is not expired
    if driver.license_expiry_date < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Driver license has expired on {driver.license_expiry_date}"
        )
        
    # 4. Verify cargo weight does not exceed vehicle capacity
    if trip_in.cargo_weight > vehicle.max_load_capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cargo weight ({trip_in.cargo_weight} kg) exceeds vehicle maximum capacity ({vehicle.max_load_capacity} kg)"
        )
        
    # Geocode coordinates using Nominatim
    source_lat, source_lng = None, None
    dest_lat, dest_lng = None, None
    try:
        async with httpx.AsyncClient() as client:
            headers = {"User-Agent": "TransitOps/1.0 (transitops@local)"}
            src_res = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": trip_in.source, "format": "json", "limit": 1},
                headers=headers,
                timeout=5.0
            )
            if src_res.status_code == 200 and src_res.json():
                source_lat = Decimal(src_res.json()[0]["lat"])
                source_lng = Decimal(src_res.json()[0]["lon"])
                
            dest_res = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": trip_in.destination, "format": "json", "limit": 1},
                headers=headers,
                timeout=5.0
            )
            if dest_res.status_code == 200 and dest_res.json():
                dest_lat = Decimal(dest_res.json()[0]["lat"])
                dest_lng = Decimal(dest_res.json()[0]["lon"])
    except Exception as e:
        print(f"Geocoding failed: {e}")

    # Create trip in Draft mode
    trip = Trip(
        source=trip_in.source,
        destination=trip_in.destination,
        source_lat=source_lat,
        source_lng=source_lng,
        dest_lat=dest_lat,
        dest_lng=dest_lng,
        vehicle_id=trip_in.vehicle_id,
        driver_id=trip_in.driver_id,
        cargo_weight=trip_in.cargo_weight,
        planned_distance=trip_in.planned_distance,
        status=TripStatus.DRAFT,
        revenue=Decimal("0.00")
    )
    db.add(trip)
    await db.commit()
    
    # Reload relation fields
    result = await db.execute(
        select(Trip)
        .options(selectinload(Trip.vehicle), selectinload(Trip.driver))
        .filter(Trip.id == trip.id)
    )
    return result.scalars().first()
 
@router.post("/{id}/dispatch", response_model=TripResponse)
async def dispatch_trip(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(trips_full)
):
    result = await db.execute(
        select(Trip)
        .options(selectinload(Trip.vehicle), selectinload(Trip.driver))
        .filter(Trip.id == id)
    )
    trip = result.scalars().first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
        
    if trip.status != TripStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only Draft trips can be dispatched. Current status: {trip.status.value}"
        )
        
    # Verify vehicle and driver are still available
    if trip.vehicle.status != VehicleStatus.AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Assigned vehicle is no longer available (Status: {trip.vehicle.status.value})"
        )
        
    # Check if vehicle is verified
    has_verified_reg = any(d.document_type == "registration" and d.verified_status == VerifiedStatus.VERIFIED for d in trip.vehicle.documents)
    has_verified_ins = any(d.document_type == "insurance" and d.verified_status == VerifiedStatus.VERIFIED for d in trip.vehicle.documents)
    if not (has_verified_reg and has_verified_ins):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Assigned vehicle '{trip.vehicle.registration_number}' is unverified by a Safety Officer and cannot be dispatched."
        )
    if trip.driver.status != DriverStatus.AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Assigned driver is no longer available (Status: {trip.driver.status.value})"
        )
        
    # Check if driver is verified
    has_verified_license = any(d.document_type == "license" and d.verified_status == VerifiedStatus.VERIFIED for d in trip.driver.documents)
    if not has_verified_license:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Assigned driver '{trip.driver.name}' is unverified by a Safety Officer and cannot be dispatched."
        )
    if trip.driver.license_expiry_date < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver license is expired"
        )
        
    # Atomic transition: Set both driver and vehicle to On Trip, and trip to Dispatched
    trip.status = TripStatus.DISPATCHED
    trip.dispatched_at = datetime.now()
    trip.vehicle.status = VehicleStatus.ON_TRIP
    trip.driver.status = DriverStatus.ON_TRIP
    
    await db.commit()
    await db.refresh(trip)
    return trip
 
@router.post("/{id}/complete", response_model=TripResponse)
async def complete_trip(
    id: int,
    complete_in: TripComplete,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(trips_full)
):
    result = await db.execute(
        select(Trip)
        .options(selectinload(Trip.vehicle), selectinload(Trip.driver))
        .filter(Trip.id == id)
    )
    trip = result.scalars().first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
        
    if trip.status != TripStatus.DISPATCHED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only Dispatched trips can be completed. Current status: {trip.status.value}"
        )
        
    if complete_in.final_odometer < trip.vehicle.odometer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Final odometer ({complete_in.final_odometer} km) cannot be less than initial vehicle odometer ({trip.vehicle.odometer} km)"
        )
        
    # Calculate actual distance
    actual_dist = complete_in.final_odometer - trip.vehicle.odometer
    
    # Update trip
    trip.status = TripStatus.COMPLETED
    trip.completed_at = datetime.now()
    trip.actual_distance = actual_dist
    trip.fuel_consumed = complete_in.fuel_consumed
    trip.revenue = complete_in.revenue
    trip.final_odometer = complete_in.final_odometer
    
    # Update vehicle odometer and restore availability
    trip.vehicle.odometer = complete_in.final_odometer
    trip.vehicle.status = VehicleStatus.AVAILABLE
    
    # Restore driver availability
    trip.driver.status = DriverStatus.AVAILABLE
    
    # Automatically log a fuel entry
    fuel_price_per_liter = Decimal("1.40") # standard mock price
    fuel_cost = complete_in.fuel_consumed * fuel_price_per_liter
    fuel_log = FuelLog(
        vehicle_id=trip.vehicle_id,
        trip_id=trip.id,
        liters=complete_in.fuel_consumed,
        cost=fuel_cost,
        date=date.today()
    )
    db.add(fuel_log)
    
    await db.commit()
    await db.refresh(trip)
    return trip
 
@router.post("/{id}/cancel", response_model=TripResponse)
async def cancel_trip(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(trips_full)
):
    result = await db.execute(
        select(Trip)
        .options(selectinload(Trip.vehicle), selectinload(Trip.driver))
        .filter(Trip.id == id)
    )
    trip = result.scalars().first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
        
    if trip.status not in [TripStatus.DRAFT, TripStatus.DISPATCHED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel a trip that is already {trip.status.value}"
        )
        
    # If it was already dispatched, restore vehicle and driver availability
    if trip.status == TripStatus.DISPATCHED:
        trip.vehicle.status = VehicleStatus.AVAILABLE
        trip.driver.status = DriverStatus.AVAILABLE
        
    trip.status = TripStatus.CANCELLED
    await db.commit()
    await db.refresh(trip)
    return trip
