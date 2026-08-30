from sqlmodel import Session, select
from datetime import datetime
from uuid import UUID
from fastapi import HTTPException
from app.models.application import Application
from app.models.job import JobPosting
from app.models.company import Company
from app.models.enums import ApplicationStatus
from app.schemas.application import ApplicationCreate, ApplicationUpdateStatus

def create_application(session: Session, app_in: ApplicationCreate, user_id: UUID) -> dict:
    job = session.get(JobPosting, app_in.posting_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    existing = session.exec(
        select(Application).where(
            Application.user_id == user_id, 
            Application.posting_id == app_in.posting_id
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="You have already applied to this job")
        
    history_entry = {
        "status": ApplicationStatus.APPLIED.value,
        "at": datetime.utcnow().isoformat(),
        "actor": "candidate",
        "note": "Initial application submitted."
    }
    
    new_app = Application(
        user_id=user_id,
        posting_id=app_in.posting_id,
        resume_url=app_in.resume_url,
        cover_note=app_in.cover_note,
        status=ApplicationStatus.APPLIED,
        status_history=[history_entry],
        applied_at=datetime.utcnow(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    session.add(new_app)
    session.commit()
    session.refresh(new_app)
    
    company = session.get(Company, job.company_id)
    
    return {
        **new_app.model_dump(),
        "job_title": job.title,
        "company_name": company.name if company else "Unknown"
    }

def get_my_applications(session: Session, user_id: UUID) -> list[dict]:
    statement = select(Application, JobPosting, Company).join(
        JobPosting, Application.posting_id == JobPosting.id
    ).join(
        Company, JobPosting.company_id == Company.id
    ).where(Application.user_id == user_id).order_by(Application.applied_at.desc())
    
    results = session.exec(statement).all()
    
    final_list = []
    for app, job, company in results:
        data = app.model_dump()
        data["job_title"] = job.title
        data["company_name"] = company.name
        final_list.append(data)
        
    return final_list

def get_job_applications(session: Session, job_id: UUID) -> list[dict]:
    statement = select(Application, JobPosting, Company).join(
        JobPosting, Application.posting_id == JobPosting.id
    ).join(
        Company, JobPosting.company_id == Company.id
    ).where(Application.posting_id == job_id).order_by(Application.applied_at.desc())
    
    results = session.exec(statement).all()
    
    final_list = []
    for app, job, company in results:
        data = app.model_dump()
        data["job_title"] = job.title
        data["company_name"] = company.name
        final_list.append(data)
        
    return final_list

def update_application_status(session: Session, app_id: UUID, status_in: ApplicationUpdateStatus, actor: str) -> dict:
    app = session.get(Application, app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    app.status = status_in.status
    
    history = list(app.status_history)
    history.append({
        "status": status_in.status.value,
        "at": datetime.utcnow().isoformat(),
        "actor": actor,
        "note": status_in.note
    })
    
    app.status_history = history
    app.updated_at = datetime.utcnow()
    
    if actor == "employer":
        app.last_employer_response_at = datetime.utcnow()
        
    job = session.get(JobPosting, app.posting_id)
    
    if status_in.status == ApplicationStatus.OFFER_ACCEPTED:
        from app.models.user import User
        user = session.get(User, app.user_id)
        if user and job:
            user.employer_id = job.company_id
            session.add(user)
        
    session.add(app)
    session.commit()
    session.refresh(app)
    
    job = session.get(JobPosting, app.posting_id)
    company = session.get(Company, job.company_id) if job else None
    
    return {
        **app.model_dump(),
        "job_title": job.title if job else "Unknown",
        "company_name": company.name if company else "Unknown"
    }
