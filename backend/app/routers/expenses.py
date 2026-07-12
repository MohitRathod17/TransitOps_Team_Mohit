from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.models import Expense, ExpenseType, Vehicle
from app.schemas import ExpenseCreate, ExpenseResponse
from app.auth import PermissionChecker, get_current_user

router = APIRouter(prefix="/expenses", tags=["Expenses"])

# Security: Financial Analyst and Fleet Manager can manage expenses.
expenses_view = PermissionChecker("expenses", "view")
expenses_full = PermissionChecker("expenses", "full")

@router.get("/", response_model=List[ExpenseResponse])
async def list_expenses(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(expenses_view)
):
    result = await db.execute(
        select(Expense).order_by(Expense.date.desc())
    )
    return result.scalars().all()

@router.post("/", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    expense_in: ExpenseCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(expenses_full)
):
    # Verify vehicle exists
    result = await db.execute(select(Vehicle).filter(Vehicle.id == expense_in.vehicle_id))
    if not result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
        
    expense = Expense(
        vehicle_id=expense_in.vehicle_id,
        type=expense_in.type,
        cost=expense_in.cost,
        date=expense_in.date,
        description=expense_in.description
    )
    db.add(expense)
    await db.commit()
    await db.refresh(expense)
    return expense

@router.get("/vehicle/{vehicle_id}", response_model=List[ExpenseResponse])
async def list_vehicle_expenses(
    vehicle_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(expenses_view)
):
    result = await db.execute(
        select(Expense)
        .filter(Expense.vehicle_id == vehicle_id)
        .order_by(Expense.date.desc())
    )
    return result.scalars().all()
