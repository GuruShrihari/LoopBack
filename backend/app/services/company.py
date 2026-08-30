from sqlmodel import Session, select
from datetime import datetime
import re
from fastapi import HTTPException
from app.models.company import Company
from app.schemas.company import CompanyCreate

def generate_slug(name: str) -> str:
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    return slug

from uuid import UUID
from app.models.user import User

def create_company(session: Session, company_in: CompanyCreate, creator_id: UUID | None = None) -> Company:
    slug = generate_slug(company_in.name)
    existing = session.exec(select(Company).where(Company.slug == slug)).first()
    if existing:
        raise HTTPException(status_code=400, detail="A company with a similar name already exists.")
        
    is_verified_bool = bool(company_in.verification_doc_url or company_in.employee_proof_doc_url)
    company = Company(
        name=company_in.name,
        slug=slug,
        website=company_in.website,
        verification_doc_url=company_in.verification_doc_url,
        employee_proof_doc_url=company_in.employee_proof_doc_url,
        is_verified=is_verified_bool,
        created_by_user_id=creator_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    session.add(company)
    
    if creator_id:
        user = session.get(User, creator_id)
        if user:
            user.employer_id = company.id
            session.add(user)

    session.commit()
    session.refresh(company)
    return company

def get_companies(session: Session) -> list[Company]:
    return session.exec(select(Company)).all()

def get_company(session: Session, company_id) -> Company | None:
    return session.get(Company, company_id)
