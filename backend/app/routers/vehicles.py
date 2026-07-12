<<<<<<< HEAD
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from decimal import Decimal

from app.database import get_db
from app.models import Vehicle, VehicleStatus, Role
from app.schemas import VehicleCreate, VehicleUpdate, VehicleResponse
=======
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional

from app.database import get_db
from app.models import Vehicle, VehicleStatus
from app.schemas import VehicleCreate, VehicleResponse
>>>>>>> 4743ddb1fcc3073d38e552c7334c81c51575aae1
from app.auth import RoleChecker, get_current_user

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

<<<<<<< HEAD
# Security Dependencies
=======
>>>>>>> 4743ddb1fcc3073d38e552c7334c81c51575aae1
fleet_manager_only = RoleChecker(["Fleet Manager"])
any_authenticated = get_current_user

@router.get("/", response_model=List[VehicleResponse])
async def list_vehicles(
<<<<<<< HEAD
    type: Optional[str] = None,
    status: Optional[VehicleStatus] = None,
    region: Optional[str] = None,
=======
    status: Optional[VehicleStatus] = None,
>>>>>>> 4743ddb1fcc3073d38e552c7334c81c51575aae1
    db: AsyncSession = Depends(get_db),
    current_user = Depends(any_authenticated)
):
    query = select(Vehicle)
<<<<<<< HEAD
    if type:
        query = query.filter(Vehicle.type == type)
    if status:
        query = query.filter(Vehicle.status == status)
    if region:
        query = query.filter(Vehicle.region == region)
=======
    if status:
        query = query.filter(Vehicle.status == status)
>>>>>>> 4743ddb1fcc3073d38e552c7334c81c51575aae1
    
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
async def create_vehicle(
    vehicle_in: VehicleCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(fleet_manager_only)
):
<<<<<<< HEAD
    # Unique check
=======
>>>>>>> 4743ddb1fcc3073d38e552c7334c81c51575aae1
    result = await db.execute(
        select(Vehicle).filter(Vehicle.registration_number == vehicle_in.registration_number)
    )
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
<<<<<<< HEAD
            detail=f"Vehicle with registration number {vehicle_in.registration_number} already exists"
=======
            detail="Vehicle already exists"
>>>>>>> 4743ddb1fcc3073d38e552c7334c81c51575aae1
        )
    
    vehicle = Vehicle(
        registration_number=vehicle_in.registration_number,
        model=vehicle_in.model,
        type=vehicle_in.type,
        max_load_capacity=vehicle_in.max_load_capacity,
<<<<<<< HEAD
        odometer=vehicle_in.odometer,
        acquisition_cost=vehicle_in.acquisition_cost,
        status=VehicleStatus.AVAILABLE,
        region=vehicle_in.region
=======
        status=VehicleStatus.AVAILABLE,
>>>>>>> 4743ddb1fcc3073d38e552c7334c81c51575aae1
    )
    db.add(vehicle)
    await db.commit()
    await db.refresh(vehicle)
    return vehicle
<<<<<<< HEAD

@router.get("/{id}", response_model=VehicleResponse)
async def get_vehicle(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(any_authenticated)
):
    result = await db.execute(select(Vehicle).filter(Vehicle.id == id))
    vehicle = result.scalars().first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    return vehicle

@router.put("/{id}", response_model=VehicleResponse)
async def update_vehicle(
    id: int,
    vehicle_in: VehicleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(fleet_manager_only)
):
    result = await db.execute(select(Vehicle).filter(Vehicle.id == id))
    vehicle = result.scalars().first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    
    # Update fields if provided
    update_data = vehicle_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(vehicle, field, value)
        
    await db.commit()
    await db.refresh(vehicle)
    return vehicle

@router.delete("/{id}", response_model=VehicleResponse)
async def delete_vehicle(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(fleet_manager_only)
):
    result = await db.execute(select(Vehicle).filter(Vehicle.id == id))
    vehicle = result.scalars().first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    
    # Instead of deleting physically, we mark as Retired or delete if allowed. Let's retire it.
    vehicle.status = VehicleStatus.RETIRED
    await db.commit()
    await db.refresh(vehicle)
    return vehicle
=======
>>>>>>> 4743ddb1fcc3073d38e552c7334c81c51575aae1
