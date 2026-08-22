from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.models.enums import PostingStatus

class JobPostingBase(BaseModel):
    title: str
    description: str
    requirements: Optional[str] = None
    location: Optional[str] = None
    is_remote: bool = False
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    tags: list[str] = []

class JobPostingCreate(JobPostingBase):
    company_id: UUID

class JobPostingRead(JobPostingBase):
    id: UUID
    company_id: UUID
    posted_by_user_id: UUID
    status: PostingStatus
    scam_risk_score: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
