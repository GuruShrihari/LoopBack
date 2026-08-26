from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from uuid import UUID

from app.api.deps import SessionDep, CurrentUser
from app.schemas.intel import InterviewIntelCreate, InterviewIntelRead
from app.services import intel as intel_service
from app.models.enums import UserRole

router = APIRouter()

@router.post("/", response_model=InterviewIntelRead)
def submit_intel(
    session: SessionDep, current_user: CurrentUser, intel_in: InterviewIntelCreate
) -> InterviewIntelRead:
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(status_code=403, detail="Only candidates can submit interview intel.")
    return intel_service.create_intel(session=session, intel_in=intel_in, user_id=current_user.id)

@router.get("/", response_model=list[InterviewIntelRead])
def get_intel_feed(session: SessionDep) -> list[InterviewIntelRead]:
    return intel_service.get_recent_intel(session=session)
