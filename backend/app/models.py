from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, Date, DateTime, Text, Enum, func, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class VehicleStatus(str, enum.Enum):
    AVAILABLE = "Available"
    ON_TRIP = "On Trip"
    IN_SHOP = "In Shop"
    RETIRED = "Retired"

class DriverStatus(str, enum.Enum):
    AVAILABLE = "Available"
    ON_TRIP = "On Trip"
    OFF_DUTY = "Off Duty"
    SUSPENDED = "Suspended"

class TripStatus(str, enum.Enum):
    DRAFT = "Draft"
    DISPATCHED = "Dispatched"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

class MaintenanceStatus(str, enum.Enum):
    ACTIVE = "Active"
    CLOSED = "Closed"

class ExpenseType(str, enum.Enum):
    TOLL = "Toll"
    MAINTENANCE = "Maintenance"
    INSURANCE = "Insurance"
    OTHER = "Other"

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False) # e.g., "Fleet Manager", "Driver", "Safety Officer", "Financial Analyst"

    users = relationship("User", back_populates="role")

class RolePermission(Base):
    __tablename__ = "role_permissions"

    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    module = Column(String(50), nullable=False) # e.g., "fleet", "drivers", "trips", "expenses", "analytics"
    access_level = Column(String(20), nullable=False) # e.g., "full", "view", "none"

    role = relationship("Role")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    failed_attempts = Column(Integer, nullable=False, default=0)
    is_locked = Column(Boolean, nullable=False, default=False)
    is_verified = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, server_default=func.now())

    role = relationship("Role", back_populates="users")
    driver_profile = relationship("Driver", back_populates="user", uselist=False)

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String(50), unique=True, nullable=False, index=True)
    model = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False) # e.g., Van, Truck, Semi, Car
    max_load_capacity = Column(Numeric(10, 2), nullable=False) # in kg
    odometer = Column(Numeric(12, 2), nullable=False, default=0.00) # in km
    acquisition_cost = Column(Numeric(12, 2), nullable=False)
    status = Column(Enum(VehicleStatus), nullable=False, default=VehicleStatus.AVAILABLE)
    region = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    trips = relationship("Trip", back_populates="vehicle")
    maintenance_logs = relationship("MaintenanceLog", back_populates="vehicle")
    fuel_logs = relationship("FuelLog", back_populates="vehicle")
    expenses = relationship("Expense", back_populates="vehicle")
    documents = relationship("VehicleDocument", back_populates="vehicle", cascade="all, delete-orphan", lazy="selectin")

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=True)
    name = Column(String(100), nullable=False)
    license_number = Column(String(100), unique=True, nullable=False, index=True)
    license_category = Column(String(20), nullable=False)
    license_expiry_date = Column(Date, nullable=False)
    contact_number = Column(String(20), nullable=False)
    safety_score = Column(Numeric(5, 2), default=100.00)
    status = Column(Enum(DriverStatus), nullable=False, default=DriverStatus.AVAILABLE)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="driver_profile")
    trips = relationship("Trip", back_populates="driver")
    documents = relationship("DriverDocument", back_populates="driver", cascade="all, delete-orphan", lazy="selectin")

class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(255), nullable=False)
    destination = Column(String(255), nullable=False)
    source_lat = Column(Numeric(10, 7), nullable=True)
    source_lng = Column(Numeric(10, 7), nullable=True)
    dest_lat = Column(Numeric(10, 7), nullable=True)
    dest_lng = Column(Numeric(10, 7), nullable=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    cargo_weight = Column(Numeric(10, 2), nullable=False) # in kg
    planned_distance = Column(Numeric(10, 2), nullable=False) # in km
    actual_distance = Column(Numeric(10, 2), nullable=True) # in km
    status = Column(Enum(TripStatus), nullable=False, default=TripStatus.DRAFT)
    revenue = Column(Numeric(12, 2), default=0.00)
    fuel_consumed = Column(Numeric(8, 2), nullable=True) # in liters
    final_odometer = Column(Numeric(12, 2), nullable=True) # in km
    dispatched_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    vehicle = relationship("Vehicle", back_populates="trips")
    driver = relationship("Driver", back_populates="trips")
    fuel_logs = relationship("FuelLog", back_populates="trip")

class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    description = Column(Text, nullable=False)
    cost = Column(Numeric(10, 2), nullable=False, default=0.00)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    status = Column(Enum(MaintenanceStatus), nullable=False, default=MaintenanceStatus.ACTIVE)
    created_at = Column(DateTime, server_default=func.now())

    vehicle = relationship("Vehicle", back_populates="maintenance_logs")

class FuelLog(Base):
    __tablename__ = "fuel_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)
    liters = Column(Numeric(8, 2), nullable=False)
    cost = Column(Numeric(10, 2), nullable=False)
    date = Column(Date, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    vehicle = relationship("Vehicle", back_populates="fuel_logs")
    trip = relationship("Trip", back_populates="fuel_logs")

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    type = Column(Enum(ExpenseType), nullable=False)
    cost = Column(Numeric(10, 2), nullable=False)
    date = Column(Date, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    vehicle = relationship("Vehicle", back_populates="expenses")

class VerifiedStatus(str, enum.Enum):
    PENDING = "Pending"
    VERIFIED = "Verified"
    REJECTED = "Rejected"

class DriverDocument(Base):
    __tablename__ = "driver_documents"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    document_type = Column(String(50), nullable=False) # e.g. 'license', 'id_proof'
    file_path = Column(String(255), nullable=False)
    uploaded_at = Column(DateTime, server_default=func.now())
    verified_status = Column(Enum(VerifiedStatus), nullable=False, default=VerifiedStatus.PENDING)
    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    expiry_date = Column(Date, nullable=True)

    driver = relationship("Driver", back_populates="documents")
    verifier = relationship("User")

class VehicleDocument(Base):
    __tablename__ = "vehicle_documents"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    document_type = Column(String(50), nullable=False) # e.g. 'registration', 'insurance'
    file_path = Column(String(255), nullable=False)
    uploaded_at = Column(DateTime, server_default=func.now())
    verified_status = Column(Enum(VerifiedStatus), nullable=False, default=VerifiedStatus.PENDING)
    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    expiry_date = Column(Date, nullable=True)

    vehicle = relationship("Vehicle", back_populates="documents")
    verifier = relationship("User")
