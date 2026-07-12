import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import get_db
from app.models import User, Role
from app.schemas import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm="HS256")
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email, role=role)
    except jwt.PyJWTError:
        raise credentials_exception
    
    # Eagerly load the role object using selectinload
    result = await db.execute(
        select(User)
        .options(selectinload(User.role))
        .filter(User.email == token_data.email)
    )
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if not current_user.role or current_user.role.name not in self.allowed_roles:
            role_name = current_user.role.name if current_user.role else "Unknown"
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role '{role_name}'. Required roles: {self.allowed_roles}",
            )
        return current_user

class PermissionChecker:
    def __init__(self, module: str, min_level: str = "view"):
        self.module = module
        self.min_level = min_level

    async def __call__(self, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> User:
        from app.models import RolePermission
        
        result = await db.execute(
            select(RolePermission).filter(
                RolePermission.role_id == current_user.role_id,
                RolePermission.module == self.module
            )
        )
        permission = result.scalars().first()
        access_level = permission.access_level if permission else "none"
        
        level_map = {"none": 0, "view": 1, "full": 2}
        user_score = level_map.get(access_level, 0)
        required_score = level_map.get(self.min_level, 1)
        
        if user_score < required_score:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Insufficient permissions for module '{self.module}' (Required: {self.min_level}, Has: {access_level}).",
            )
        return current_user
