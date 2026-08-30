from sqlmodel import SQLModel, Field
from sqlalchemy import Column, String, Index
from sqlalchemy.dialects.postgresql import ARRAY
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional

from app.models.enums import PostingStatus

class JobPosting(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    company_id: UUID = Field(foreign_key="company.id", index=True)
    posted_by_user_id: UUID = Field(foreign_key="user.id")
    title: str
    description: str
    requirements: Optional[str] = None
    location: Optional[str] = None
    is_remote: bool = Field(default=False)
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    tags: list[str] = Field(sa_column=Column(ARRAY(String)))  # simple keyword tags, replaces embeddings for matching
    status: PostingStatus = Field(default=PostingStatus.ACTIVE)
    scam_risk_score: Optional[float] = None
    response_timeframe_days: int = Field(default=30)
    referral_limit: int = Field(default=5)
    created_at: datetime
    updated_at: datetime

    __table_args__ = (
        Index("ix_job_posting_company_id_status", "company_id", "status"),
    )

class PrepBriefCache(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    posting_id: UUID = Field(foreign_key="jobposting.id", index=True, unique=True)
    summary_markdown: str
    source_intel_count: int
    generated_at: datetime
