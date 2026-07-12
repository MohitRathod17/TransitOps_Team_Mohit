from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from decimal import Decimal

from app.database import get_db
from app.models import Driver, DriverStatus
from app.schemas import DriverCreate, DriverUpdate, DriverResponse
from app.auth import PermissionChecker, get_current_user

router = APIRouter(prefix="/drivers", tags=["Drivers"])

# Security Dependencies
drivers_view = PermissionChecker("drivers", "view")
drivers_full = PermissionChecker("drivers", "full")

@router.get("/", response_model=List[DriverResponse])
async def list_drivers(
    status: Optional[DriverStatus] = None,
    min_safety_score: Optional[Decimal] = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(drivers_view)
):
    query = select(Driver)
    if status:
        query = query.filter(Driver.status == status)
    if min_safety_score is not None:
        query = query.filter(Driver.safety_score >= min_safety_score)
        
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/", response_model=DriverResponse, status_code=status.HTTP_201_CREATED)
async def create_driver(
    driver_in: DriverCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(drivers_full)
):
    # Unique check for license_number
    result = await db.execute(
        select(Driver).filter(Driver.license_number == driver_in.license_number)
    )
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Driver with license number {driver_in.license_number} already exists"
        )
    
    driver = Driver(
        user_id=driver_in.user_id,
        name=driver_in.name,
        license_number=driver_in.license_number,
        license_category=driver_in.license_category,
        license_expiry_date=driver_in.license_expiry_date,
        contact_number=driver_in.contact_number,
        status=DriverStatus.AVAILABLE,
        safety_score=Decimal("100.0")
    )
    db.add(driver)
    await db.commit()
    await db.refresh(driver)
    return driver

@router.get("/{id}", response_model=DriverResponse)
async def get_driver(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(drivers_view)
):
    result = await db.execute(select(Driver).filter(Driver.id == id))
    driver = result.scalars().first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )
    return driver

@router.put("/{id}", response_model=DriverResponse)
async def update_driver(
    id: int,
    driver_in: DriverUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(drivers_full)
):
    result = await db.execute(select(Driver).filter(Driver.id == id))
    driver = result.scalars().first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )
    
    update_data = driver_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(driver, field, value)
        
    await db.commit()
    await db.refresh(driver)
    return driver

@router.delete("/{id}", response_model=DriverResponse)
async def suspend_driver(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(drivers_full)
):
    result = await db.execute(select(Driver).filter(Driver.id == id))
    driver = result.scalars().first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )
    
    driver.status = DriverStatus.SUSPENDED
    await db.commit()
    await db.refresh(driver)
    return driver
