from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from uuid import UUID

from app.api.deps import SessionDep, CurrentUser
from app.schemas.job import JobPostingCreate, JobPostingRead
from app.services import job as job_service
from app.models.enums import UserRole

router = APIRouter()

@router.post("/", response_model=JobPostingRead)
def create_job(
    session: SessionDep, current_user: CurrentUser, job_in: JobPostingCreate
) -> JobPostingRead:
    if current_user.role != UserRole.RECRUITER:
        raise HTTPException(status_code=403, detail="Only recruiters can post jobs.")
    return job_service.create_job(session=session, job_in=job_in, user_id=current_user.id)

@router.get("/", response_model=list[JobPostingRead])
def read_jobs(session: SessionDep) -> list[JobPostingRead]:
    return job_service.get_jobs(session=session)

@router.get("/{job_id}", response_model=JobPostingRead)
def read_job(session: SessionDep, job_id: UUID) -> JobPostingRead:
    job = job_service.get_job(session=session, job_id=job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
