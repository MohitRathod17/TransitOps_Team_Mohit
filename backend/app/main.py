from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
import os
import asyncio
from datetime import date, timedelta

from app.database import init_db, AsyncSessionLocal
from app.models import Role, RolePermission, Driver, Vehicle, DriverDocument, VehicleDocument
from app.utils.mailer import send_document_expiry_email
from app.routers.auth import router as auth_router
from app.routers.vehicles import router as vehicles_router
from app.routers.drivers import router as drivers_router
from app.routers.trips import router as trips_router
from app.routers.maintenance import router as maintenance_router
from app.routers.expenses import router as expenses_router
from app.routers.reports import router as reports_router
from app.routers.documents import router as documents_router
from app.utils.seed_historical import seed_historical

async def check_expiring_documents_task():
    """Background task running daily to check for documents and driver licenses expiring in exactly 7 days."""
    # Run once on startup, then every 24 hours
    while True:
        try:
            async with AsyncSessionLocal() as db:
                target_date = date.today() + timedelta(days=7)
                
                # 1. Driver License expiries
                res_d = await db.execute(select(Driver).filter(Driver.license_expiry_date == target_date))
                exp_drivers = res_d.scalars().all()
                for d in exp_drivers:
                    send_document_expiry_email(
                        email="manager@transitops.com",
                        asset_name=f"Driver: {d.name}",
                        doc_name="Driving License",
                        days_left=7,
                        expiry_date_str=str(d.license_expiry_date)
                    )
                
                # 2. Driver Document expiries
                res_ddoc = await db.execute(
                    select(DriverDocument).options(selectinload(DriverDocument.driver)).filter(DriverDocument.expiry_date == target_date)
                )
                exp_ddocs = res_ddoc.scalars().all()
                for doc in exp_ddocs:
                    d_name = doc.driver.name if doc.driver else "Unknown"
                    send_document_expiry_email(
                        email="manager@transitops.com",
                        asset_name=f"Driver: {d_name}",
                        doc_name=doc.document_type.capitalize().replace("_", " "),
                        days_left=7,
                        expiry_date_str=str(doc.expiry_date)
                    )
                
                # 3. Vehicle Document expiries
                res_vdoc = await db.execute(
                    select(VehicleDocument).options(selectinload(VehicleDocument.vehicle)).filter(VehicleDocument.expiry_date == target_date)
                )
                exp_vdocs = res_vdoc.scalars().all()
                for doc in exp_vdocs:
                    v_reg = doc.vehicle.registration_number if doc.vehicle else "Unknown"
                    send_document_expiry_email(
                        email="manager@transitops.com",
                        asset_name=f"Vehicle: {v_reg}",
                        doc_name=doc.document_type.capitalize().replace("_", " "),
                        days_left=7,
                        expiry_date_str=str(doc.expiry_date)
                    )
        except Exception as e:
            print(f"[BACKGROUND CRON WARNING] Expiry check failed: {e}")
            
        await asyncio.sleep(86400)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB (create tables if they do not exist)
    await init_db()
    
    # Seed historical completed trips and fuel logs if needed
    try:
        await seed_historical()
    except Exception as e:
        print(f"[STARTUP WARNING] Failed to seed historical data: {e}")
    
    # Seed mandatory Roles and permissions matrix
    async with AsyncSessionLocal() as db:
        roles_list = ["Fleet Manager", "Driver", "Safety Officer", "Financial Analyst"]
        roles_map = {}
        for role_name in roles_list:
            result = await db.execute(select(Role).filter(Role.name == role_name))
            role = result.scalars().first()
            if not role:
                role = Role(name=role_name)
                db.add(role)
                await db.commit()
                await db.refresh(role)
            roles_map[role_name] = role
            
        # Permission matrix — matches the UI table exactly
        # Modules: dashboard, fleet, drivers, trips, maintenance, expenses, analytics, settings
        matrix = {
            "Fleet Manager": {
                "dashboard":   "view",
                "fleet":       "full",
                "drivers":     "full",
                "trips":       "full",
                "maintenance": "full",
                "expenses":    "view",
                "analytics":   "view",
                "settings":    "full",
            },
            "Driver": {
                "dashboard":   "view",
                "fleet":       "none",
                "drivers":     "none",
                "trips":       "full",
                "maintenance": "none",
                "expenses":    "none",
                "analytics":   "none",
                "settings":    "none",
            },
            "Safety Officer": {
                "dashboard":   "view",
                "fleet":       "none",
                "drivers":     "full",
                "trips":       "none",
                "maintenance": "none",
                "expenses":    "none",
                "analytics":   "view",
                "settings":    "none",
            },
            "Financial Analyst": {
                "dashboard":   "view",
                "fleet":       "view",
                "drivers":     "none",
                "trips":       "view",
                "maintenance": "view",
                "expenses":    "full",
                "analytics":   "full",
                "settings":    "none",
            },
        }
        
        for r_name, modules in matrix.items():
            role_obj = roles_map[r_name]
            for module_name, level in modules.items():
                res = await db.execute(
                    select(RolePermission).filter(
                        RolePermission.role_id == role_obj.id,
                        RolePermission.module == module_name
                    )
                )
                perm = res.scalars().first()
                if not perm:
                    db.add(RolePermission(
                        role_id=role_obj.id,
                        module=module_name,
                        access_level=level
                    ))
                else:
                    perm.access_level = level
        await db.commit()
        
    # Start compliance document expiry background task
    asyncio.create_task(check_expiring_documents_task())
    
    yield

app = FastAPI(
    title="TransitOps API",
    description="Smart Transport Operations Platform API for Hackathon",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for Next.js dev server communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins during local hackathon build
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Files folder for uploads serving
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include Routers
app.include_router(auth_router, prefix="/api")
app.include_router(vehicles_router, prefix="/api")
app.include_router(drivers_router, prefix="/api")
app.include_router(trips_router, prefix="/api")
app.include_router(maintenance_router, prefix="/api")
app.include_router(expenses_router, prefix="/api")
app.include_router(reports_router, prefix="/api")
app.include_router(documents_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Welcome to TransitOps API", "docs": "/docs"}
