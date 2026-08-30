from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID
from typing import Optional, List
from datetime import datetime


class ReferralOfferCreate(BaseModel):
    company_id: UUID
    posting_id: UUID
    tags: List[str]
    weekly_capacity: int = Field(default=3)


class ReferralOfferPublic(BaseModel):
    id: UUID
    referrer_id: UUID
    company_id: UUID
    posting_id: UUID
    tags: List[str]
    weekly_capacity: int
    current_week_count: int
    accepted_count: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReferralRequestCreate(BaseModel):
    posting_id: UUID
    resume_url: str
    message: Optional[str] = None


class ReferralRequestPublic(BaseModel):
    id: UUID
    offer_id: UUID
    requester_id: UUID
    posting_id: UUID
    resume_url: Optional[str] = None
    match_score: Optional[float] = None
    message: Optional[str] = None
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ReferralRequestUpdate(BaseModel):
    status: str

