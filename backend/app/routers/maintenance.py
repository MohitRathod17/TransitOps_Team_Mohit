from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.models import MaintenanceLog, MaintenanceStatus, Vehicle, VehicleStatus, Expense, ExpenseType
from app.schemas import MaintenanceCreate, MaintenanceClose, MaintenanceResponse
from app.auth import PermissionChecker, get_current_user

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])

# Maintenance is its own module separate from fleet
maintenance_view = PermissionChecker("maintenance", "view")
maintenance_full = PermissionChecker("maintenance", "full")

@router.get("/", response_model=List[MaintenanceResponse])
async def list_maintenance(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(maintenance_view)
):
    result = await db.execute(
        select(MaintenanceLog).options(selectinload(MaintenanceLog.vehicle))
    )
    return result.scalars().all()

@router.post("/start", response_model=MaintenanceResponse, status_code=status.HTTP_201_CREATED)
async def start_maintenance(
    maint_in: MaintenanceCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(maintenance_full)
):
    # Get vehicle
    result = await db.execute(select(Vehicle).filter(Vehicle.id == maint_in.vehicle_id))
    vehicle = result.scalars().first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
        
    if vehicle.status == VehicleStatus.RETIRED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot maintain a retired vehicle")
        
    # Set vehicle status to In Shop
    vehicle.status = VehicleStatus.IN_SHOP
    
    # Create log
    maint = MaintenanceLog(
        vehicle_id=maint_in.vehicle_id,
        description=maint_in.description,
        start_date=maint_in.start_date,
        status=MaintenanceStatus.ACTIVE
    )
    db.add(maint)
    await db.commit()
    
    # Reload relation fields
    result = await db.execute(
        select(MaintenanceLog)
        .options(selectinload(MaintenanceLog.vehicle))
        .filter(MaintenanceLog.id == maint.id)
    )
    return result.scalars().first()

@router.post("/{id}/close", response_model=MaintenanceResponse)
async def close_maintenance(
    id: int,
    close_in: MaintenanceClose,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(maintenance_full)
):
    result = await db.execute(
        select(MaintenanceLog)
        .options(selectinload(MaintenanceLog.vehicle))
        .filter(MaintenanceLog.id == id)
    )
    maint = result.scalars().first()
    if not maint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance log not found")
        
    if maint.status != MaintenanceStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Maintenance log is already closed")
        
    # Close log
    maint.status = MaintenanceStatus.CLOSED
    maint.cost = close_in.cost
    maint.end_date = close_in.end_date
    
    # Restore vehicle status to Available (unless retired)
    if maint.vehicle.status != VehicleStatus.RETIRED:
        maint.vehicle.status = VehicleStatus.AVAILABLE
        
    # Create a matching operational expense log for this maintenance activity
    expense = Expense(
        vehicle_id=maint.vehicle_id,
        type=ExpenseType.MAINTENANCE,
        cost=close_in.cost,
        date=close_in.end_date,
        description=f"Maintenance Activity Closed: {maint.description}"
    )
    db.add(expense)
    
    await db.commit()
    await db.refresh(maint)
    return maint
