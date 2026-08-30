from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional

class Company(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(index=True)
    slug: str = Field(unique=True, index=True)
    website: Optional[str] = None
    verification_doc_url: Optional[str] = None
    employee_proof_doc_url: Optional[str] = None
    is_verified: bool = Field(default=False)
    created_by_user_id: Optional[UUID] = Field(default=None, foreign_key="user.id", index=True)
    median_response_hours: Optional[float] = None
    ghosting_rate: Optional[float] = None
    interview_to_offer_rate: Optional[float] = None
    total_tracked_applications: int = Field(default=0)
    score_last_computed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
