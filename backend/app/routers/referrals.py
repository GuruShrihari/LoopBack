from fastapi import APIRouter, HTTPException
from typing import List, Optional
from uuid import UUID

from app.api.deps import SessionDep, CurrentUser
from app.schemas.referral import (
    ReferralOfferCreate,
    ReferralOfferPublic,
    ReferralRequestCreate,
    ReferralRequestPublic,
    ReferralRequestUpdate
)
from app.services import referral_service

router = APIRouter()

@router.post("/referral-offers", response_model=ReferralOfferPublic)
def create_offer(
    session: SessionDep,
    current_user: CurrentUser,
    offer_in: ReferralOfferCreate
):
    return referral_service.create_referral_offer(
        session=session,
        offer_in=offer_in,
        user_id=current_user.id
    )

@router.get("/referral-offers", response_model=List[ReferralOfferPublic])
def read_offers(
    session: SessionDep,
    company_id: Optional[UUID] = None,
    tag: Optional[str] = None
):
    return referral_service.get_referral_offers(
        session=session,
        company_id=company_id,
        tag=tag
    )

@router.post("/referral-offers/{offer_id}/requests", response_model=ReferralRequestPublic)
def create_request(
    session: SessionDep,
    current_user: CurrentUser,
    offer_id: UUID,
    request_in: ReferralRequestCreate
):
    try:
        return referral_service.create_referral_request(
            session=session,
            offer_id=offer_id,
            request_in=request_in,
            requester_id=current_user.id
        )
    except ValueError as e:
        if str(e) == "This referrer is at capacity this week":
            raise HTTPException(status_code=409, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/referral-requests/incoming", response_model=List[ReferralRequestPublic])
def read_incoming_requests(
    session: SessionDep,
    current_user: CurrentUser
):
    return referral_service.get_incoming_requests(
        session=session,
        user_id=current_user.id
    )

@router.get("/referral-requests/me", response_model=List[ReferralRequestPublic])
def read_my_requests(
    session: SessionDep,
    current_user: CurrentUser
):
    return referral_service.get_my_requests(
        session=session,
        user_id=current_user.id
    )

@router.patch("/referral-requests/{request_id}", response_model=ReferralRequestPublic)
def update_request(
    session: SessionDep,
    current_user: CurrentUser,
    request_id: UUID,
    update_in: ReferralRequestUpdate
):
    try:
        return referral_service.update_request_status(
            session=session,
            request_id=request_id,
            status=update_in.status,
            user_id=current_user.id
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
