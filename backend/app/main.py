from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy.future import select

from app.database import init_db, AsyncSessionLocal
from app.models import Role
from app.routers.auth import router as auth_router
from app.routers.vehicles import router as vehicles_router
<<<<<<< HEAD
from app.routers.drivers import router as drivers_router
from app.routers.reports import router as reports_router
=======
>>>>>>> 4743ddb1fcc3073d38e552c7334c81c51575aae1

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB (create tables if they do not exist)
    await init_db()
    
    # Seed mandatory Roles
    async with AsyncSessionLocal() as db:
        roles = ["Fleet Manager", "Driver", "Safety Officer", "Financial Analyst"]
        for role_name in roles:
            result = await db.execute(select(Role).filter(Role.name == role_name))
            if not result.scalars().first():
                db.add(Role(name=role_name))
        await db.commit()
    
    yield

app = FastAPI(
    title="TransitOps API",
<<<<<<< HEAD
    description="Smart Transport Operations Platform API for Hackathon",
=======
    description="Smart Transport Operations Platform API",
>>>>>>> 4743ddb1fcc3073d38e552c7334c81c51575aae1
    version="1.0.0",
    lifespan=lifespan
)

<<<<<<< HEAD
# Configure CORS for Next.js dev server communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins during local hackathon build
=======
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
>>>>>>> 4743ddb1fcc3073d38e552c7334c81c51575aae1
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router, prefix="/api")
app.include_router(vehicles_router, prefix="/api")
<<<<<<< HEAD
app.include_router(drivers_router, prefix="/api")
app.include_router(reports_router, prefix="/api")
=======
>>>>>>> 4743ddb1fcc3073d38e552c7334c81c51575aae1

@app.get("/")
async def root():
    return {"message": "Welcome to TransitOps API", "docs": "/docs"}
