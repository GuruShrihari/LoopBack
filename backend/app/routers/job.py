from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from uuid import UUID

from app.api.deps import SessionDep, CurrentUser
from app.schemas.job import JobPostingCreate, JobPostingRead
from app.services import job as job_service
from app.models.enums import UserRole

router = APIRouter()

from app.models.company import Company
from app.core.rate_limiter import SlidingWindowRateLimiter
from app.core.event_bus import event_bus

job_rate_limiter = SlidingWindowRateLimiter(requests=15, window_seconds=60)

@router.post("/", response_model=JobPostingRead, dependencies=[Depends(job_rate_limiter)])
async def create_job(
    session: SessionDep, current_user: CurrentUser, job_in: JobPostingCreate
) -> JobPostingRead:
    if current_user.role not in (UserRole.RECRUITER, UserRole.BOTH):
        raise HTTPException(status_code=403, detail="Only recruiters can post job openings.")

    company_id = job_in.company_id or current_user.employer_id
    if not company_id:
        raise HTTPException(status_code=400, detail="You must select a company before posting jobs.")

    company = session.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found.")

    if company.created_by_user_id is None:
        company.created_by_user_id = current_user.id
        session.add(company)
        session.commit()
    elif company.created_by_user_id != current_user.id and current_user.employer_id != company.id:
        raise HTTPException(status_code=403, detail="Job postings are restricted to recruiters associated with this company.")

    new_job = job_service.create_job(session=session, job_in=job_in, user_id=current_user.id, company_id=company_id)
    await event_bus.publish("job_created", {
        "job_id": str(new_job.id),
        "title": new_job.title,
        "company_id": str(company_id),
        "creator_id": str(current_user.id)
    })
    return new_job

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
