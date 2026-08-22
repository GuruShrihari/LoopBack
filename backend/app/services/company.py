from sqlmodel import Session, select
from datetime import datetime
import re
from fastapi import HTTPException
from app.models.company import Company
from app.schemas.company import CompanyCreate

def generate_slug(name: str) -> str:
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    return slug

def create_company(session: Session, company_in: CompanyCreate) -> Company:
    slug = generate_slug(company_in.name)
    existing = session.exec(select(Company).where(Company.slug == slug)).first()
    if existing:
        raise HTTPException(status_code=400, detail="A company with a similar name already exists.")
        
    company = Company(
        name=company_in.name,
        slug=slug,
        website=company_in.website,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    session.add(company)
    session.commit()
    session.refresh(company)
    return company

def get_companies(session: Session) -> list[Company]:
    return session.exec(select(Company)).all()

def get_company(session: Session, company_id) -> Company | None:
    return session.get(Company, company_id)
