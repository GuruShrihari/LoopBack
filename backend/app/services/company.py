import re
import uuid
from datetime import datetime

from fastapi import HTTPException
from sqlmodel import Session, select
from uuid import UUID

from app.models.company import Company
from app.models.user import User
from app.schemas.company import CompanyCreate


def _generate_slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def create_company(session: Session, company_in: CompanyCreate, creator_id: UUID | None = None) -> Company:
    slug = _generate_slug(company_in.name)
    if session.exec(select(Company).where(Company.slug == slug)).first():
        raise HTTPException(status_code=400, detail="A company with a similar name already exists.")

    company = Company(
        name=company_in.name,
        slug=slug,
        website=company_in.website,
        verification_doc_url=company_in.verification_doc_url,
        employee_proof_doc_url=company_in.employee_proof_doc_url,
        is_verified=bool(company_in.verification_doc_url or company_in.employee_proof_doc_url),
        created_by_user_id=creator_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
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


def get_company(session: Session, company_id: UUID) -> Company | None:
    return session.get(Company, company_id)
