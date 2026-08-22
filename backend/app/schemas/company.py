from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

class CompanyBase(BaseModel):
    name: str
    website: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyRead(CompanyBase):
    id: UUID
    slug: str
    is_verified: bool
    median_response_hours: Optional[float] = None
    ghosting_rate: Optional[float] = None
    interview_to_offer_rate: Optional[float] = None
    total_tracked_applications: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
