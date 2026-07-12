from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import Dict, Optional
import random
import secrets
from datetime import datetime, timedelta

from app.database import get_db
from app.models import User, Role, RolePermission
from app.schemas import (
    UserCreate, UserResponse, Token,
    VerifyOTPRequest, ResendOTPRequest, ForgotPasswordRequest, ResetPasswordRequest
)
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user
from app.utils.mailer import send_otp_email

router = APIRouter(prefix="/auth", tags=["Authentication"])

# In-memory OTP Store: { email: { "otp": str, "expires_at": datetime, "purpose": str } }
otp_store = {}

def generate_otp() -> str:
    return f"{random.randint(100000, 999999)}"

async def ensure_role(db: AsyncSession, role_name: str) -> Role:
    result = await db.execute(select(Role).filter(Role.name == role_name))
    role = result.scalars().first()
    if not role:
        role = Role(name=role_name)
        db.add(role)
        await db.commit()
        await db.refresh(role)
    return role

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    result = await db.execute(select(User).filter(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate and get/create role
    allowed_roles = ["Fleet Manager", "Driver", "Safety Officer", "Financial Analyst"]
    if user_in.role_name not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Allowed roles are: {allowed_roles}"
        )
    
    role = await ensure_role(db, user_in.role_name)
    
    hashed_password = get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        password_hash=hashed_password,
        full_name=user_in.full_name,
        role_id=role.id,
        is_verified=False
    )
    db.add(user)
    await db.commit()
    
    # Generate verification OTP
    otp = generate_otp()
    otp_store[user_in.email] = {
        "otp": otp,
        "expires_at": datetime.now() + timedelta(minutes=10),
        "purpose": "verify"
    }
    send_otp_email(user_in.email, otp, purpose="verify")
    
    # Re-fetch user with loaded role
    result = await db.execute(
        select(User).options(selectinload(User.role)).filter(User.id == user.id)
    )
    return result.scalars().first()

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).options(selectinload(User.role)).filter(User.email == form_data.username)
    )
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if user.is_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is locked due to multiple failed login attempts. Please contact support.",
        )
        
    if not verify_password(form_data.password, user.password_hash):
        user.failed_attempts += 1
        if user.failed_attempts >= 5:
            user.is_locked = True
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Incorrect password. Account has been locked due to 5 failed attempts.",
            )
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Incorrect email or password. Attempt {user.failed_attempts}/5",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_verified:
        # Regenerate verification OTP and resend email
        otp = generate_otp()
        otp_store[user.email] = {
            "otp": otp,
            "expires_at": datetime.now() + timedelta(minutes=10),
            "purpose": "verify"
        }
        send_otp_email(user.email, otp, purpose="verify")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="email_unverified"
        )
        
    if user.failed_attempts > 0:
        user.failed_attempts = 0
        await db.commit()
        
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.name}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role.name,
        "email": user.email
    }

@router.post("/verify-otp", response_model=Token)
async def verify_otp(payload: VerifyOTPRequest, db: AsyncSession = Depends(get_db)):
    email = payload.email
    otp_code = payload.otp_code
    purpose = payload.purpose or "verify"
    
    otp_data = otp_store.get(email)
    if not otp_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OTP code requested for this email address."
        )
        
    if otp_data["purpose"] != purpose:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP purpose."
        )
        
    if datetime.now() > otp_data["expires_at"]:
        otp_store.pop(email, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP code has expired. Please request a new one."
        )
        
    if not secrets.compare_digest(otp_data["otp"], otp_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code."
        )
        
    if purpose == "verify":
        # Fetch user & update verification flag in DB
        result = await db.execute(
            select(User).options(selectinload(User.role)).filter(User.email == email)
        )
        user = result.scalars().first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
            
        user.is_verified = True
        await db.commit()
        
        # Clean OTP
        otp_store.pop(email, None)
        
        # Automatically sign-in and return token
        access_token = create_access_token(
            data={"sub": user.email, "role": user.role.name}
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "role": user.role.name,
            "email": user.email
        }
        
    # If reset purpose, return a success flag so frontend can proceed to reset password page
    return {
        "access_token": "reset_auth_token",
        "token_type": "bearer",
        "role": "Guest",
        "email": email
    }

@router.post("/resend-otp")
async def resend_otp(payload: ResendOTPRequest):
    email = payload.email
    purpose = payload.purpose or "verify"
    
    otp = generate_otp()
    otp_store[email] = {
        "otp": otp,
        "expires_at": datetime.now() + timedelta(minutes=10),
        "purpose": purpose
    }
    
    send_otp_email(email, otp, purpose=purpose)
    return {"message": "OTP resent successfully."}

@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    result = await db.execute(select(User).filter(User.email == payload.email))
    user = result.scalars().first()
    if not user:
        # Silently return success to prevent email enumeration attacks
        return {"message": "If this email exists in our records, a reset link/code has been sent."}
        
    otp = generate_otp()
    otp_store[payload.email] = {
        "otp": otp,
        "expires_at": datetime.now() + timedelta(minutes=10),
        "purpose": "reset"
    }
    
    send_otp_email(payload.email, otp, purpose="reset")
    return {"message": "Reset OTP sent successfully."}

@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    email = payload.email
    otp_code = payload.otp_code
    
    otp_data = otp_store.get(email)
    if not otp_data or otp_data["purpose"] != "reset":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No reset request found for this email address."
        )
        
    if datetime.now() > otp_data["expires_at"]:
        otp_store.pop(email, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset code has expired. Please try again."
        )
        
    if not secrets.compare_digest(otp_data["otp"], otp_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset OTP code."
        )
        
    # OTP is valid, hash new password and update
    result = await db.execute(select(User).filter(User.email == email))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    user.password_hash = get_password_hash(payload.new_password)
    user.failed_attempts = 0
    user.is_locked = False
    await db.commit()
    
    # Remove from memory store
    otp_store.pop(email, None)
    return {"message": "Password reset successfully. You can now log in."}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/permissions", response_model=Dict[str, str])
async def get_my_permissions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns a mapping of module -> access_level for the current user's role."""
    result = await db.execute(
        select(RolePermission).filter(RolePermission.role_id == current_user.role_id)
    )
    perms = result.scalars().all()
    return {p.module: p.access_level for p in perms}

@router.get("/debug/otp")
async def debug_get_otp(email: str):
    data = otp_store.get(email)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No OTP code found")
    return {"otp_code": data["otp"]}
