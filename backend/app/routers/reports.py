from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List, Optional
from decimal import Decimal
import io
import csv

from app.database import get_db
from app.models import Vehicle, VehicleStatus, Driver, DriverStatus, Trip, TripStatus, MaintenanceLog, MaintenanceStatus, FuelLog, Expense
from app.schemas import DashboardKPIs, FuelEfficiencyAnalytics, VehicleROIAnalytics, DashboardChartsResponse
from app.auth import PermissionChecker, get_current_user
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta, date

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

analytics_view = PermissionChecker("analytics", "view")
# Dashboard KPIs are visible to ALL authenticated roles (dashboard module = view for everyone)
dashboard_kpis_auth = get_current_user

@router.get("/dashboard-kpis", response_model=DashboardKPIs)
async def get_dashboard_kpis(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(dashboard_kpis_auth)
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

    # Active Trips (Dispatched)
    result_active_t = await db.execute(select(func.count(Trip.id)).filter(Trip.status == TripStatus.DISPATCHED))
    active_trips = result_active_t.scalar() or 0

    # Pending Trips (Draft)
    result_pending_t = await db.execute(select(func.count(Trip.id)).filter(Trip.status == TripStatus.DRAFT))
    pending_trips = result_pending_t.scalar() or 0

    # Drivers On Duty (On Trip)
    result_drivers = await db.execute(select(func.count(Driver.id)).filter(Driver.status == DriverStatus.ON_TRIP))
    drivers_on_duty = result_drivers.scalar() or 0

    # Fleet Utilization: (Active / Total Non-Retired) * 100
    fleet_utilization = Decimal("0.00")
    if total_non_retired > 0:
        fleet_utilization = (Decimal(active_vehicles) / Decimal(total_non_retired)) * Decimal("100.00")

    # Delayed Trips: active trips (dispatched) where driver safety score < 95.00
    # If no dispatched trips, defaults to 0. If some exist, we count the delayed ones.
    result_delayed_t = await db.execute(
        select(func.count(Trip.id))
        .join(Driver, Trip.driver_id == Driver.id)
        .filter(Trip.status == TripStatus.DISPATCHED, Driver.safety_score < 95.00)
    )
    delayed_trips = result_delayed_t.scalar() or 0

    return {
        "active_vehicles": active_vehicles,
        "available_vehicles": available_vehicles,
        "vehicles_in_maintenance": vehicles_in_maintenance,
        "active_trips": active_trips,
        "pending_trips": pending_trips,
        "drivers_on_duty": drivers_on_duty,
        "fleet_utilization": round(fleet_utilization, 2),
        "delayed_trips": delayed_trips
    }

@router.get("/fuel-efficiency", response_model=List[FuelEfficiencyAnalytics])
async def get_fuel_efficiency(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(analytics_view)
):
    # Fetch all non-retired vehicles
    v_result = await db.execute(select(Vehicle).filter(Vehicle.status != VehicleStatus.RETIRED))
    vehicles = v_result.scalars().all()
    
    analytics = []
    for vehicle in vehicles:
        # Sum actual distance and fuel consumed for completed trips
        result = await db.execute(
            select(
                func.sum(Trip.actual_distance).label("total_distance"),
                func.sum(Trip.fuel_consumed).label("total_fuel")
            )
            .filter(Trip.vehicle_id == vehicle.id, Trip.status == TripStatus.COMPLETED)
        )
        data = result.first()
        total_distance = Decimal(data.total_distance or 0)
        total_fuel = Decimal(data.total_fuel or 0)
        
        # Fuel efficiency = Distance / Fuel
        efficiency = Decimal("0.00")
        if total_fuel > 0:
            efficiency = total_distance / total_fuel
            
        analytics.append({
            "vehicle_id": vehicle.id,
            "registration_number": vehicle.registration_number,
            "model": vehicle.model,
            "total_distance": round(total_distance, 2),
            "total_fuel": round(total_fuel, 2),
            "efficiency": round(efficiency, 2)
        })
    return analytics

@router.get("/vehicle-roi", response_model=List[VehicleROIAnalytics])
async def get_vehicle_roi(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(analytics_view)
):
    v_result = await db.execute(select(Vehicle).filter(Vehicle.status != VehicleStatus.RETIRED))
    vehicles = v_result.scalars().all()
    
    analytics = []
    for vehicle in vehicles:
        # Total revenue from completed trips
        rev_res = await db.execute(
            select(func.sum(Trip.revenue)).filter(Trip.vehicle_id == vehicle.id, Trip.status == TripStatus.COMPLETED)
        )
        total_revenue = Decimal(rev_res.scalar() or 0)
        
        # Total maintenance cost (from closed maintenance logs)
        maint_res = await db.execute(
            select(func.sum(MaintenanceLog.cost))
            .filter(MaintenanceLog.vehicle_id == vehicle.id, MaintenanceLog.status == MaintenanceStatus.CLOSED)
        )
        total_maintenance = Decimal(maint_res.scalar() or 0)
        
        # Total fuel cost (from fuel logs)
        fuel_res = await db.execute(
            select(func.sum(FuelLog.cost)).filter(FuelLog.vehicle_id == vehicle.id)
        )
        total_fuel = Decimal(fuel_res.scalar() or 0)
        
        # ROI: (Revenue - (Maintenance + Fuel)) / Acquisition Cost
        roi = Decimal("0.00")
        if vehicle.acquisition_cost > 0:
            roi = (total_revenue - (total_maintenance + total_fuel)) / vehicle.acquisition_cost
            
        analytics.append({
            "vehicle_id": vehicle.id,
            "registration_number": vehicle.registration_number,
            "model": vehicle.model,
            "acquisition_cost": vehicle.acquisition_cost,
            "total_revenue": round(total_revenue, 2),
            "total_maintenance": round(total_maintenance, 2),
            "total_fuel": round(total_fuel, 2),
            "roi": round(roi, 4) # decimal scale
        })
    return analytics

@router.get("/export-csv")
async def export_csv(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(analytics_view)
):
    # Combine ROI and Fuel efficiency data into a CSV file stream
    v_result = await db.execute(select(Vehicle).filter(Vehicle.status != VehicleStatus.RETIRED))
    vehicles = v_result.scalars().all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Vehicle ID", "Registration Number", "Model", "Type", "Status", "Odometer (km)", 
        "Acquisition Cost ($)", "Total Revenue ($)", "Total Maintenance Cost ($)", 
        "Total Fuel Cost ($)", "Total Distance Travelled (km)", "Total Fuel Consumed (L)", 
        "Fuel Efficiency (km/L)", "ROI"
    ])
    
    for vehicle in vehicles:
        # Distance & Fuel
        dist_res = await db.execute(
            select(
                func.sum(Trip.actual_distance).label("dist"),
                func.sum(Trip.fuel_consumed).label("fuel")
            )
            .filter(Trip.vehicle_id == vehicle.id, Trip.status == TripStatus.COMPLETED)
        )
        d_data = dist_res.first()
        dist = Decimal(d_data.dist or 0)
        fuel = Decimal(d_data.fuel or 0)
        efficiency = (dist / fuel) if fuel > 0 else Decimal("0.00")
        
        # Revenue
        rev_res = await db.execute(
            select(func.sum(Trip.revenue)).filter(Trip.vehicle_id == vehicle.id, Trip.status == TripStatus.COMPLETED)
        )
        revenue = Decimal(rev_res.scalar() or 0)
        
        # Maintenance
        maint_res = await db.execute(
            select(func.sum(MaintenanceLog.cost))
            .filter(MaintenanceLog.vehicle_id == vehicle.id, MaintenanceLog.status == MaintenanceStatus.CLOSED)
        )
        maintenance = Decimal(maint_res.scalar() or 0)
        
        # Fuel Cost
        fuel_cost_res = await db.execute(
            select(func.sum(FuelLog.cost)).filter(FuelLog.vehicle_id == vehicle.id)
        )
        fuel_cost = Decimal(fuel_cost_res.scalar() or 0)
        
        # ROI
        roi = ((revenue - (maintenance + fuel_cost)) / vehicle.acquisition_cost) if vehicle.acquisition_cost > 0 else Decimal("0.00")
        
        writer.writerow([
            vehicle.id, vehicle.registration_number, vehicle.model, vehicle.type, vehicle.status.value,
            float(vehicle.odometer), float(vehicle.acquisition_cost), float(revenue), float(maintenance),
            float(fuel_cost), float(dist), float(fuel), float(round(efficiency, 2)), float(round(roi, 4))
        ])
        
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=fleet_analytics_report.csv"}
    )

@router.get("/dashboard-charts", response_model=DashboardChartsResponse)
async def get_dashboard_charts(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(dashboard_kpis_auth)
):
    today = date.today()
    start_date = datetime.combine(today - timedelta(days=6), datetime.min.time())
    
    trips_res = await db.execute(
        select(Trip)
        .options(selectinload(Trip.vehicle))
        .filter(Trip.created_at >= start_date)
    )
    trips = trips_res.scalars().all()
    
    fuel_res = await db.execute(
        select(FuelLog)
        .filter(FuelLog.date >= (today - timedelta(days=6)))
    )
    fuel_logs = fuel_res.scalars().all()
    
    days_data = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        days_data.append({
            "date": d.isoformat(),
            "day": d.strftime("%a"),
            "trips": [],
            "fuel_cost": Decimal("0.00")
        })
        
    for trip in trips:
        trip_date = trip.created_at.date()
        for day in days_data:
            if day["date"] == trip_date.isoformat():
                day["trips"].append(trip)
                break
                
    for log in fuel_logs:
        log_date = log.date
        for day in days_data:
            if day["date"] == log_date.isoformat():
                day["fuel_cost"] += Decimal(str(log.cost))
                break
                
    utilization_trend = []
    fuel_costs = []
    
    for day in days_data:
        day_trips = day["trips"]
        if not day_trips:
            util = 0.0
        else:
            total_pct = 0.0
            valid_trips = 0
            for t in day_trips:
                if t.vehicle and t.vehicle.max_load_capacity > 0:
                    total_pct += (float(t.cargo_weight) / float(t.vehicle.max_load_capacity)) * 100.0
                    valid_trips += 1
            util = total_pct / valid_trips if valid_trips > 0 else 0.0
            
        utilization_trend.append({
            "date": day["date"],
            "day": day["day"],
            "value": round(util, 1)
        })
        
        fuel_costs.append({
            "date": day["date"],
            "day": day["day"],
            "value": float(round(day["fuel_cost"], 2))
        })
        
    return {
        "utilization_trend": utilization_trend,
        "fuel_costs": fuel_costs
    }

