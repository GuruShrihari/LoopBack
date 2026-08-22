from sqlmodel import Session, select
from datetime import datetime
from uuid import UUID
from app.models.job import JobPosting
from app.schemas.job import JobPostingCreate

def create_job(session: Session, job_in: JobPostingCreate, user_id: UUID) -> JobPosting:
    job = JobPosting(
        **job_in.model_dump(),
        posted_by_user_id=user_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    session.add(job)
    session.commit()
    session.refresh(job)
    return job

def get_jobs(session: Session) -> list[JobPosting]:
    # In the future, this can be filtered by active status, tags, etc.
    return session.exec(select(JobPosting).order_by(JobPosting.created_at.desc())).all()

def get_job(session: Session, job_id: UUID) -> JobPosting | None:
    return session.get(JobPosting, job_id)
