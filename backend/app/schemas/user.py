from pydantic import BaseModel, EmailStr
from uuid import UUID
from app.models.enums import UserRole

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.CANDIDATE

class UserRead(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    role: UserRole
