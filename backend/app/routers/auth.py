from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import User, Role
from app.schemas import UserCreate, UserResponse, Token
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

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
    result = await db.execute(select(User).filter(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    allowed_roles = ["Fleet Manager", "Driver", "Safety Officer", "Financial Analyst"]
    if user_in.role_name not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role"
        )
    
    role = await ensure_role(db, user_in.role_name)
    hashed_password = get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        password_hash=hashed_password,
        full_name=user_in.full_name,
        role_id=role.id
    )
    db.add(user)
    await db.commit()
    
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
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.name}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role.name,
        "email": user.email
    }

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
