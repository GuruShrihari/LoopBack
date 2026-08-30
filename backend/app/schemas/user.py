from pydantic import BaseModel, EmailStr, ConfigDict
from uuid import UUID
from app.models.enums import UserRole

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.CANDIDATE

class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    full_name: str
    role: UserRole
    employer_id: UUID | None = None
    employment_doc_url: str | None = None
