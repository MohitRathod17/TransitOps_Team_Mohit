import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Dict, Any, Optional

from app.database import get_db
from app.models import Driver, Vehicle, DriverDocument, VehicleDocument, VerifiedStatus, User
from app.schemas import DriverDocumentResponse, VehicleDocumentResponse
from app.auth import RoleChecker, get_current_user

router = APIRouter(prefix="/documents", tags=["Documents & Safety Audit"])

# Security roles
safety_officers_only = RoleChecker(["Safety Officer", "Fleet Manager"])
any_authenticated = get_current_user

UPLOAD_BASE_DIR = "uploads"
os.makedirs(f"{UPLOAD_BASE_DIR}/drivers", exist_ok=True)
os.makedirs(f"{UPLOAD_BASE_DIR}/vehicles", exist_ok=True)

@router.post("/drivers/{driver_id}/upload", response_model=DriverDocumentResponse)
async def upload_driver_document(
    driver_id: int,
    document_type: str = Form(...),
    expiry_date: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(any_authenticated)
):
    # Verify driver exists
    result = await db.execute(select(Driver).filter(Driver.id == driver_id))
    driver = result.scalars().first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
        
    from datetime import datetime
    parsed_expiry = None
    if expiry_date:
        try:
            parsed_expiry = datetime.strptime(expiry_date, "%Y-%m-%d").date()
        except:
            raise HTTPException(status_code=400, detail="Invalid expiry_date format. Must be YYYY-MM-DD")
    
    # Save file
    driver_dir = f"{UPLOAD_BASE_DIR}/drivers/{driver_id}"
    os.makedirs(driver_dir, exist_ok=True)
    
    # Clean filename
    filename = file.filename.replace(" ", "_")
    file_path = f"{driver_dir}/{filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Check if this document type already exists
    result_doc = await db.execute(
        select(DriverDocument).filter(
            DriverDocument.driver_id == driver_id,
            DriverDocument.document_type == document_type
        )
    )
    doc = result_doc.scalars().first()
    
    if doc:
        # Delete old file if path is different
        if doc.file_path != file_path and os.path.exists(doc.file_path):
            try:
                os.remove(doc.file_path)
            except:
                pass
        doc.file_path = file_path
        doc.verified_status = VerifiedStatus.PENDING
        doc.verified_by = None
        doc.expiry_date = parsed_expiry
    else:
        doc = DriverDocument(
            driver_id=driver_id,
            document_type=document_type,
            file_path=file_path,
            verified_status=VerifiedStatus.PENDING,
            expiry_date=parsed_expiry
        )
        db.add(doc)
        
    await db.commit()
    await db.refresh(doc)
    return doc

@router.post("/vehicles/{vehicle_id}/upload", response_model=VehicleDocumentResponse)
async def upload_vehicle_document(
    vehicle_id: int,
    document_type: str = Form(...),
    expiry_date: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(any_authenticated)
):
    # Verify vehicle exists
    result = await db.execute(select(Vehicle).filter(Vehicle.id == vehicle_id))
    vehicle = result.scalars().first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
        
    from datetime import datetime
    parsed_expiry = None
    if expiry_date:
        try:
            parsed_expiry = datetime.strptime(expiry_date, "%Y-%m-%d").date()
        except:
            raise HTTPException(status_code=400, detail="Invalid expiry_date format. Must be YYYY-MM-DD")
            
    # Save file
    vehicle_dir = f"{UPLOAD_BASE_DIR}/vehicles/{vehicle_id}"
    os.makedirs(vehicle_dir, exist_ok=True)
    
    # Clean filename
    filename = file.filename.replace(" ", "_")
    file_path = f"{vehicle_dir}/{filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Check if this document type already exists
    result_doc = await db.execute(
        select(VehicleDocument).filter(
            VehicleDocument.vehicle_id == vehicle_id,
            VehicleDocument.document_type == document_type
        )
    )
    doc = result_doc.scalars().first()
    
    if doc:
        # Delete old file if path is different
        if doc.file_path != file_path and os.path.exists(doc.file_path):
            try:
                os.remove(doc.file_path)
            except:
                pass
        doc.file_path = file_path
        doc.verified_status = VerifiedStatus.PENDING
        doc.verified_by = None
        doc.expiry_date = parsed_expiry
    else:
        doc = VehicleDocument(
            vehicle_id=vehicle_id,
            document_type=document_type,
            file_path=file_path,
            verified_status=VerifiedStatus.PENDING,
            expiry_date=parsed_expiry
        )
        db.add(doc)
        
    await db.commit()
    await db.refresh(doc)
    return doc

@router.get("/pending", response_model=Dict[str, Any])
async def get_pending_documents(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(safety_officers_only)
):
    # Fetch pending driver documents with driver profiles
    stmt_drivers = select(DriverDocument).options(selectinload(DriverDocument.driver)).filter(
        DriverDocument.verified_status == VerifiedStatus.PENDING
    )
    res_drivers = await db.execute(stmt_drivers)
    driver_docs = res_drivers.scalars().all()
    
    # Fetch pending vehicle documents with vehicle profiles
    stmt_vehicles = select(VehicleDocument).options(selectinload(VehicleDocument.vehicle)).filter(
        VehicleDocument.verified_status == VerifiedStatus.PENDING
    )
    res_vehicles = await db.execute(stmt_vehicles)
    vehicle_docs = res_vehicles.scalars().all()
    
    # Map them to lists of responses including parent details
    driver_docs_res = []
    for doc in driver_docs:
        driver_docs_res.append({
            "id": doc.id,
            "driver_id": doc.driver_id,
            "driver_name": doc.driver.name if doc.driver else "Unknown",
            "document_type": doc.document_type,
            "file_path": doc.file_path,
            "uploaded_at": doc.uploaded_at,
            "verified_status": doc.verified_status.value
        })
        
    vehicle_docs_res = []
    for doc in vehicle_docs:
        vehicle_docs_res.append({
            "id": doc.id,
            "vehicle_id": doc.vehicle_id,
            "registration_number": doc.vehicle.registration_number if doc.vehicle else "Unknown",
            "model": doc.vehicle.model if doc.vehicle else "Unknown",
            "document_type": doc.document_type,
            "file_path": doc.file_path,
            "uploaded_at": doc.uploaded_at,
            "verified_status": doc.verified_status.value
        })
        
    return {
        "driver_documents": driver_docs_res,
        "vehicle_documents": vehicle_docs_res
    }

@router.post("/driver/{doc_id}/verify", response_model=DriverDocumentResponse)
async def verify_driver_document(
    doc_id: int,
    status: str, # "Verified" or "Rejected"
    db: AsyncSession = Depends(get_db),
    current_user = Depends(safety_officers_only)
):
    if status not in [VerifiedStatus.VERIFIED.value, VerifiedStatus.REJECTED.value]:
        raise HTTPException(status_code=400, detail="Invalid verification status")
        
    result = await db.execute(select(DriverDocument).filter(DriverDocument.id == doc_id))
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    doc.verified_status = VerifiedStatus(status)
    doc.verified_by = current_user.id
    await db.commit()
    await db.refresh(doc)
    return doc

@router.post("/vehicle/{doc_id}/verify", response_model=VehicleDocumentResponse)
async def verify_vehicle_document(
    doc_id: int,
    status: str, # "Verified" or "Rejected"
    db: AsyncSession = Depends(get_db),
    current_user = Depends(safety_officers_only)
):
    if status not in [VerifiedStatus.VERIFIED.value, VerifiedStatus.REJECTED.value]:
        raise HTTPException(status_code=400, detail="Invalid verification status")
        
    result = await db.execute(select(VehicleDocument).filter(VehicleDocument.id == doc_id))
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    doc.verified_status = VerifiedStatus(status)
    doc.verified_by = current_user.id
    await db.commit()
    await db.refresh(doc)
    return doc
