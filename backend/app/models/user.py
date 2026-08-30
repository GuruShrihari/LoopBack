from sqlmodel import SQLModel, Field
from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import ARRAY
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional

from app.models.enums import UserRole

class User(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    full_name: str
    role: UserRole = Field(default=UserRole.CANDIDATE)
    employer_id: Optional[UUID] = Field(default=None, foreign_key="company.id", index=True)
    employment_doc_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class Profile(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", unique=True, index=True)
    headline: Optional[str] = None
    bio: Optional[str] = None
    skills: list[str] = Field(sa_column=Column(ARRAY(String)))
    resume_url: Optional[str] = None
    location: Optional[str] = None
    created_at: datetime
    updated_at: datetime
