from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from uuid import UUID

from app.api.deps import SessionDep, CurrentUser
from app.schemas.company import CompanyCreate, CompanyRead
from app.services import company as company_service
from app.models.enums import UserRole

router = APIRouter()

@router.post("/", response_model=CompanyRead)
def create_company(
    session: SessionDep, current_user: CurrentUser, company_in: CompanyCreate
) -> CompanyRead:
    if current_user.role != UserRole.RECRUITER:
        raise HTTPException(status_code=403, detail="Only recruiters can create companies.")
    return company_service.create_company(session=session, company_in=company_in)

@router.get("/", response_model=list[CompanyRead])
def read_companies(session: SessionDep) -> list[CompanyRead]:
    return company_service.get_companies(session=session)

@router.get("/{company_id}", response_model=CompanyRead)
def read_company(session: SessionDep, company_id: UUID) -> CompanyRead:
    company = company_service.get_company(session=session, company_id=company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company
