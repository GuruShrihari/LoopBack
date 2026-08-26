from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, Any

class InterviewIntelCreate(BaseModel):
    posting_id: UUID
    rounds: list[Any]
    overall_difficulty: Optional[int] = Field(None, ge=1, le=5)
    outcome: Optional[str] = None
    is_anonymous: bool = True

class InterviewIntelRead(BaseModel):
    id: UUID
    posting_id: UUID
    company_id: UUID
    verified_via_application_id: UUID
    rounds: list[Any]
    overall_difficulty: Optional[int] = None
    outcome: Optional[str] = None
    is_anonymous: bool
    created_at: datetime
    
    job_title: str
    company_name: str
