from sqlmodel import SQLModel, Field
from sqlalchemy import Column, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional

from app.models.enums import ApplicationStatus

class Application(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    posting_id: UUID = Field(foreign_key="jobposting.id", index=True)
    status: ApplicationStatus = Field(default=ApplicationStatus.APPLIED)
    resume_url: Optional[str] = None
    referred_by_id: Optional[UUID] = Field(default=None, foreign_key="user.id")
    notes: Optional[str] = None
    status_history: list[dict] = Field(sa_column=Column(JSONB))
    cover_note: Optional[str] = None
    applied_at: datetime = Field(default_factory=datetime.utcnow)
    last_employer_response_at: Optional[datetime] = None
    is_ghosted: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "posting_id", name="uq_user_posting_application"),
        Index("ix_application_posting_id_status", "posting_id", "status"),
    )

class InterviewIntel(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    author_id: UUID = Field(foreign_key="user.id")
    posting_id: UUID = Field(foreign_key="jobposting.id", index=True)
    company_id: UUID = Field(foreign_key="company.id", index=True)
    verified_via_application_id: UUID = Field(foreign_key="application.id")
    rounds: list[dict] = Field(sa_column=Column(JSONB))
    overall_difficulty: Optional[int] = None
    outcome: Optional[str] = None
    is_anonymous: bool = Field(default=True)
    created_at: datetime
