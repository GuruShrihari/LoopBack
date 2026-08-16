from sqlmodel import SQLModel, Field
from sqlalchemy import Index
from uuid import UUID, uuid4
from datetime import datetime

from app.models.enums import EntityType

class CommunityThread(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    entity_type: EntityType
    entity_id: UUID = Field(index=True)  # company_id or posting_id
    author_id: UUID = Field(foreign_key="user.id")
    title: str
    is_deleted: bool = Field(default=False)
    created_at: datetime
    updated_at: datetime

    __table_args__ = (
        Index("ix_community_thread_entity", "entity_type", "entity_id"),
    )

class CommunityPost(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    thread_id: UUID = Field(foreign_key="communitythread.id", index=True)
    author_id: UUID = Field(foreign_key="user.id")
    content: str
    is_deleted: bool = Field(default=False)
    created_at: datetime
