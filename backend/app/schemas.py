from pydantic import BaseModel, EmailStr, Field, ConfigDict
from decimal import Decimal
from datetime import date, datetime
from typing import Optional, List
from app.models import VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus, ExpenseType

# Common configurations
class BaseConfigModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

# Role
class RoleResponse(BaseConfigModel):
    id: int
    name: str

# User
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    role_name: str # e.g. "Fleet Manager", "Driver", "Safety Officer", "Financial Analyst"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseConfigModel):
    id: int
    email: EmailStr
    full_name: str
    role: RoleResponse

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    email: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# Vehicle
class VehicleCreate(BaseModel):
    registration_number: str = Field(..., min_length=2, max_length=50)
    model: str = Field(..., min_length=1, max_length=100)
    type: str = Field(..., min_length=1, max_length=50) # e.g. Truck, Van, Car
    max_load_capacity: Decimal = Field(..., gt=0)
    odometer: Decimal = Field(default=Decimal("0.0"), ge=0)
    acquisition_cost: Decimal = Field(..., gt=0)
    region: Optional[str] = None

class VehicleUpdate(BaseModel):
    model: Optional[str] = None
    type: Optional[str] = None
    max_load_capacity: Optional[Decimal] = None
    odometer: Optional[Decimal] = None
    acquisition_cost: Optional[Decimal] = None
    status: Optional[VehicleStatus] = None
    region: Optional[str] = None

class VehicleResponse(BaseConfigModel):
    id: int
    registration_number: str
    model: str
    type: str
    max_load_capacity: Decimal
    odometer: Decimal
    acquisition_cost: Decimal
    status: VehicleStatus
    region: Optional[str] = None
    created_at: datetime
    updated_at: datetime

# Driver
class DriverCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    license_number: str = Field(..., min_length=1, max_length=100)
    license_category: str = Field(..., min_length=1, max_length=20)
    license_expiry_date: date
    contact_number: str = Field(..., min_length=5, max_length=20)
    user_id: Optional[int] = None

class DriverUpdate(BaseModel):
    name: Optional[str] = None
    license_number: Optional[str] = None
    license_category: Optional[str] = None
    license_expiry_date: Optional[date] = None
    contact_number: Optional[str] = None
    safety_score: Optional[Decimal] = None
    status: Optional[DriverStatus] = None

class DriverResponse(BaseConfigModel):
    id: int
    user_id: Optional[int] = None
    name: str
    license_number: str
    license_category: str
    license_expiry_date: date
    contact_number: str
    safety_score: Decimal
    status: DriverStatus
    created_at: datetime
    updated_at: datetime

# Trip
class TripCreate(BaseModel):
    source: str
    destination: str
    vehicle_id: int
    driver_id: int
    cargo_weight: Decimal = Field(..., gt=0)
    planned_distance: Decimal = Field(..., gt=0)

class TripComplete(BaseModel):
    final_odometer: Decimal = Field(..., gt=0)
    fuel_consumed: Decimal = Field(..., gt=0)
    revenue: Decimal = Field(default=Decimal("0.0"), ge=0)

class TripResponse(BaseConfigModel):
    id: int
    source: str
    destination: str
    vehicle_id: int
    driver_id: int
    cargo_weight: Decimal
    planned_distance: Decimal
    actual_distance: Optional[Decimal] = None
    status: TripStatus
    revenue: Decimal
    fuel_consumed: Optional[Decimal] = None
    final_odometer: Optional[Decimal] = None
    dispatched_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    vehicle: Optional[VehicleResponse] = None
    driver: Optional[DriverResponse] = None

# Maintenance
class MaintenanceCreate(BaseModel):
    vehicle_id: int
    description: str
    start_date: date

class MaintenanceClose(BaseModel):
    cost: Decimal = Field(..., ge=0)
    end_date: date

class MaintenanceResponse(BaseConfigModel):
    id: int
    vehicle_id: int
    description: str
    cost: Decimal
    start_date: date
    end_date: Optional[date] = None
    status: MaintenanceStatus
    created_at: datetime
    vehicle: Optional[VehicleResponse] = None

# Fuel Log
class FuelLogCreate(BaseModel):
    vehicle_id: int
    trip_id: Optional[int] = None
    liters: Decimal = Field(..., gt=0)
    cost: Decimal = Field(..., gt=0)
    date: date

class FuelLogResponse(BaseConfigModel):
    id: int
    vehicle_id: int
    trip_id: Optional[int] = None
    liters: Decimal
    cost: Decimal
    date: date
    created_at: datetime

# Expense
class ExpenseCreate(BaseModel):
    vehicle_id: int
    type: ExpenseType
    cost: Decimal = Field(..., gt=0)
    date: date
    description: Optional[str] = None

class ExpenseResponse(BaseConfigModel):
    id: int
    vehicle_id: int
    type: ExpenseType
    cost: Decimal
    date: date
    description: Optional[str] = None
    created_at: datetime

# Dashboard & Reports
class DashboardKPIs(BaseModel):
    active_vehicles: int
    available_vehicles: int
    vehicles_in_maintenance: int
    active_trips: int
    pending_trips: int
    drivers_on_duty: int
    fleet_utilization: Decimal # percentage

class FuelEfficiencyAnalytics(BaseModel):
    vehicle_id: int
    registration_number: str
    model: str
    total_distance: Decimal
    total_fuel: Decimal
    efficiency: Decimal # distance / fuel (km/L)

class VehicleROIAnalytics(BaseModel):
    vehicle_id: int
    registration_number: str
    model: str
    acquisition_cost: Decimal
    total_revenue: Decimal
    total_maintenance: Decimal
    total_fuel: Decimal
    roi: Decimal # (revenue - (maintenance + fuel)) / acquisition_cost
