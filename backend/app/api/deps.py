from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlmodel import Session
from pydantic import ValidationError
from typing import Annotated

from app.core.config import settings
from app.core.db import get_session
from app.models.user import User
from app.schemas.token import TokenPayload

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)

SessionDep = Annotated[Session, Depends(get_session)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]

def get_current_user(session: SessionDep, token: TokenDep) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = session.get(User, token_data.sub)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

CurrentUser = Annotated[User, Depends(get_current_user)]
