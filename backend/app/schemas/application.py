from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, Any
from app.models.enums import ApplicationStatus

class ApplicationCreate(BaseModel):
    posting_id: UUID
    resume_url: str
    cover_note: Optional[str] = None

class ApplicationUpdateStatus(BaseModel):
    status: ApplicationStatus
    note: Optional[str] = None

class ApplicationRead(BaseModel):
    id: UUID
    user_id: UUID
    posting_id: UUID
    status: ApplicationStatus
    resume_url: Optional[str] = None
    referred_by_id: Optional[UUID] = None
    status_history: list[Any]
    cover_note: Optional[str] = None
    applied_at: datetime
    last_employer_response_at: Optional[datetime] = None
    is_ghosted: bool
    created_at: datetime
    updated_at: datetime
    
    job_title: str
    company_name: str
