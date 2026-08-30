from datetime import timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import settings
from app.core.security import create_access_token
from app.api.deps import SessionDep, CurrentUser
from app.schemas.user import UserCreate, UserRead
from app.schemas.token import Token
from app.services import auth as auth_service

router = APIRouter()

@router.post("/login", response_model=Token)
def login_access_token(
    session: SessionDep, form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = auth_service.authenticate_user(
        session=session, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        token_type="bearer",
    )

@router.post("/register", response_model=UserRead)
def register_user(session: SessionDep, user_in: UserCreate) -> UserRead:
    """
    Create new user.
    """
    user = auth_service.create_user(session=session, user_in=user_in)
    return user

@router.get("/me", response_model=UserRead)
def read_current_user(current_user: CurrentUser) -> UserRead:
    """
    Get current user.
    """
    return current_user

from pydantic import BaseModel
from uuid import UUID

class EmployerUpdate(BaseModel):
    employer_id: UUID
    employment_doc_url: str | None = None

from app.models.company import Company

@router.patch("/me/employer", response_model=UserRead)
def set_employer(session: SessionDep, current_user: CurrentUser, emp_update: EmployerUpdate) -> UserRead:
    company = session.get(Company, emp_update.employer_id)
    if not company:
        raise HTTPException(status_code=404, detail="Selected company does not exist.")

    current_user.employer_id = emp_update.employer_id
    if emp_update.employment_doc_url:
        current_user.employment_doc_url = emp_update.employment_doc_url

    try:
        session.add(current_user)
        session.commit()
        session.refresh(current_user)
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=f"Could not update employer: {str(e)}")

    return current_user
