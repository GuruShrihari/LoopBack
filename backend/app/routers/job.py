from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from uuid import UUID

from app.api.deps import SessionDep, CurrentUser
from app.schemas.job import JobPostingCreate, JobPostingRead
from app.services import job as job_service
from app.models.enums import UserRole

router = APIRouter()

from app.models.company import Company

@router.post("/", response_model=JobPostingRead)
def create_job(
    session: SessionDep, current_user: CurrentUser, job_in: JobPostingCreate
) -> JobPostingRead:
    company_id = job_in.company_id or current_user.employer_id
    if not company_id:
        raise HTTPException(status_code=400, detail="You must select a company before posting jobs.")

    company = session.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found.")

    if company.created_by_user_id and company.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Job postings are restricted to the user who created the company.")

    return job_service.create_job(session=session, job_in=job_in, user_id=current_user.id, company_id=company_id)

@router.get("/", response_model=list[JobPostingRead])
def read_jobs(session: SessionDep) -> list[JobPostingRead]:
    return job_service.get_jobs(session=session)

@router.get("/me", response_model=list[JobPostingRead])
def read_my_jobs(session: SessionDep, current_user: CurrentUser) -> list[JobPostingRead]:
    if current_user.role != UserRole.RECRUITER:
        raise HTTPException(status_code=403, detail="Only recruiters have posted jobs.")
    return job_service.get_my_jobs(session=session, user_id=current_user.id)

@router.get("/{job_id}", response_model=JobPostingRead)
def read_job(session: SessionDep, job_id: UUID) -> JobPostingRead:
    job = job_service.get_job(session=session, job_id=job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
