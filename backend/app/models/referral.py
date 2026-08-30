from sqlmodel import SQLModel, Field
from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import ARRAY
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional

class ReferralOffer(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    referrer_id: UUID = Field(foreign_key="user.id", index=True)
    posting_id: UUID = Field(foreign_key="jobposting.id", index=True)
    company_id: UUID = Field(foreign_key="company.id", index=True)
    tags: list[str] = Field(sa_column=Column(ARRAY(String)))  # role/skill areas
    weekly_capacity: int = Field(default=3)
    current_week_count: int = Field(default=0)
    accepted_count: int = Field(default=0)
    is_active: bool = Field(default=True)
    created_at: datetime

class ReferralRequest(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    offer_id: UUID = Field(foreign_key="referraloffer.id", index=True)
    requester_id: UUID = Field(foreign_key="user.id", index=True)
    posting_id: UUID = Field(foreign_key="jobposting.id", index=True)
    resume_url: Optional[str] = None
    match_score: Optional[float] = None
    message: Optional[str] = None
    status: str = Field(default="pending")  # pending | accepted | declined | expired
    created_at: datetime
    resolved_at: Optional[datetime] = None

