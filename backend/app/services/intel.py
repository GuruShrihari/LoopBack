from sqlmodel import Session, select
from datetime import datetime
from uuid import UUID
from fastapi import HTTPException
from app.models.application import InterviewIntel, Application
from app.models.job import JobPosting
from app.models.company import Company
from app.schemas.intel import InterviewIntelCreate

def create_intel(session: Session, intel_in: InterviewIntelCreate, user_id: UUID) -> dict:
    application = session.exec(
        select(Application).where(
            Application.user_id == user_id,
            Application.posting_id == intel_in.posting_id
        )
    ).first()
    
    if not application:
        raise HTTPException(status_code=403, detail="You can only submit intel for jobs you have applied to.")
        
    job = session.get(JobPosting, intel_in.posting_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    new_intel = InterviewIntel(
        author_id=user_id,
        posting_id=intel_in.posting_id,
        company_id=job.company_id,
        verified_via_application_id=application.id,
        rounds=intel_in.rounds,
        overall_difficulty=intel_in.overall_difficulty,
        outcome=intel_in.outcome,
        is_anonymous=intel_in.is_anonymous,
        created_at=datetime.utcnow()
    )
    
    session.add(new_intel)
    session.commit()
    session.refresh(new_intel)
    
    company = session.get(Company, job.company_id)
    
    return {
        **new_intel.model_dump(),
        "job_title": job.title,
        "company_name": company.name if company else "Unknown"
    }

def get_recent_intel(session: Session) -> list[dict]:
    statement = select(InterviewIntel, JobPosting, Company).join(
        JobPosting, InterviewIntel.posting_id == JobPosting.id
    ).join(
        Company, InterviewIntel.company_id == Company.id
    ).order_by(InterviewIntel.created_at.desc()).limit(50)
    
    results = session.exec(statement).all()
    
    final_list = []
    for intel, job, company in results:
        data = intel.model_dump()
        data["job_title"] = job.title
        data["company_name"] = company.name
        final_list.append(data)
        
    return final_list
