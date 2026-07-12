from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime, Enum, func
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class VehicleStatus(str, enum.Enum):
    AVAILABLE = "Available"
    ON_TRIP = "On Trip"
    IN_SHOP = "In Shop"
    RETIRED = "Retired"

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)

    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    role = relationship("Role", back_populates="users")

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String(50), unique=True, nullable=False, index=True)
    model = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)
    max_load_capacity = Column(Numeric(10, 2), nullable=False)
    status = Column(Enum(VehicleStatus), nullable=False, default=VehicleStatus.AVAILABLE)
    created_at = Column(DateTime, server_default=func.now())
