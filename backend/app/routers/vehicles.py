from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional

from app.database import get_db
from app.models import Vehicle, VehicleStatus
from app.schemas import VehicleCreate, VehicleResponse
from app.auth import RoleChecker, get_current_user

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

fleet_manager_only = RoleChecker(["Fleet Manager"])
any_authenticated = get_current_user

@router.get("/", response_model=List[VehicleResponse])
async def list_vehicles(
    status: Optional[VehicleStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(any_authenticated)
):
    query = select(Vehicle)
    if status:
        query = query.filter(Vehicle.status == status)
    
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
async def create_vehicle(
    vehicle_in: VehicleCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(fleet_manager_only)
):
    result = await db.execute(
        select(Vehicle).filter(Vehicle.registration_number == vehicle_in.registration_number)
    )
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle already exists"
        )
    
    vehicle = Vehicle(
        registration_number=vehicle_in.registration_number,
        model=vehicle_in.model,
        type=vehicle_in.type,
        max_load_capacity=vehicle_in.max_load_capacity,
        status=VehicleStatus.AVAILABLE,
    )
    db.add(vehicle)
    await db.commit()
    await db.refresh(vehicle)
    return vehicle
