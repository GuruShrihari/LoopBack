from sqlmodel import Session, select
from datetime import datetime
from fastapi import HTTPException
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash, verify_password

def create_user(session: Session, user_in: UserCreate) -> User:
    user = session.exec(select(User).where(User.email == user_in.email)).first()
    if user:
        raise HTTPException(status_code=400, detail="The user with this email already exists in the system.")
    
    db_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

def authenticate_user(session: Session, email: str, password: str) -> User | None:
    user = session.exec(select(User).where(User.email == email)).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
