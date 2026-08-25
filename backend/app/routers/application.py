from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from uuid import UUID

from app.api.deps import SessionDep, CurrentUser
from app.schemas.application import ApplicationCreate, ApplicationRead, ApplicationUpdateStatus
from app.services import application as application_service
from app.models.enums import UserRole
from app.models.job import JobPosting

router = APIRouter()

@router.post("/", response_model=ApplicationRead)
def apply_to_job(
    session: SessionDep, current_user: CurrentUser, app_in: ApplicationCreate
) -> ApplicationRead:
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(status_code=403, detail="Only candidates can apply to jobs.")
    return application_service.create_application(session=session, app_in=app_in, user_id=current_user.id)

@router.get("/me", response_model=list[ApplicationRead])
def get_my_applications(session: SessionDep, current_user: CurrentUser) -> list[ApplicationRead]:
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(status_code=403, detail="Only candidates can fetch their applications.")
    return application_service.get_my_applications(session=session, user_id=current_user.id)

@router.get("/job/{job_id}", response_model=list[ApplicationRead])
def get_applications_for_job(session: SessionDep, current_user: CurrentUser, job_id: UUID) -> list[ApplicationRead]:
    if current_user.role != UserRole.RECRUITER:
        raise HTTPException(status_code=403, detail="Only recruiters can view applications for a job.")
    
    job = session.get(JobPosting, job_id)
    if not job or job.posted_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to view this job's applications.")
        
    return application_service.get_job_applications(session=session, job_id=job_id)

@router.patch("/{app_id}/status", response_model=ApplicationRead)
def update_status(
    session: SessionDep, current_user: CurrentUser, app_id: UUID, status_in: ApplicationUpdateStatus
) -> ApplicationRead:
    actor = "employer" if current_user.role == UserRole.RECRUITER else "candidate"
    return application_service.update_application_status(session=session, app_id=app_id, status_in=status_in, actor=actor)
