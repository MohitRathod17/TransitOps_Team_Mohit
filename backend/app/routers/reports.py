from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from decimal import Decimal

from app.database import get_db
from app.models import Vehicle, VehicleStatus, Driver
from app.schemas import DashboardKPIs
from app.auth import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

any_authenticated = get_current_user

@router.get("/dashboard-kpis", response_model=DashboardKPIs)
async def get_dashboard_kpis(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(any_authenticated)
):
    # Active Vehicles (On Trip)
    result_active_v = await db.execute(select(func.count(Vehicle.id)).filter(Vehicle.status == VehicleStatus.ON_TRIP))
    active_vehicles = result_active_v.scalar() or 0

    # Available Vehicles
    result_avail_v = await db.execute(select(func.count(Vehicle.id)).filter(Vehicle.status == VehicleStatus.AVAILABLE))
    available_vehicles = result_avail_v.scalar() or 0

    # In Shop (Maintenance)
    result_shop_v = await db.execute(select(func.count(Vehicle.id)).filter(Vehicle.status == VehicleStatus.IN_SHOP))
    vehicles_in_maintenance = result_shop_v.scalar() or 0

    # Total operational (non-retired) vehicles
    result_total_v = await db.execute(select(func.count(Vehicle.id)).filter(Vehicle.status != VehicleStatus.RETIRED))
    total_non_retired = result_total_v.scalar() or 0

    # Drivers On Duty
    result_drivers = await db.execute(select(func.count(Driver.id)))
    drivers_on_duty = result_drivers.scalar() or 0

    # Fleet Utilization: (Active / Total Non-Retired) * 100
    fleet_utilization = Decimal("0.00")
    if total_non_retired > 0:
        fleet_utilization = (Decimal(active_vehicles) / Decimal(total_non_retired)) * Decimal("100.00")

    return {
        "active_vehicles": active_vehicles,
        "available_vehicles": available_vehicles,
        "vehicles_in_maintenance": vehicles_in_maintenance,
        "active_trips": 0,
        "pending_trips": 0,
        "drivers_on_duty": drivers_on_duty,
        "fleet_utilization": round(fleet_utilization, 2)
    }
