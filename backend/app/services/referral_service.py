from sqlmodel import Session, select
from uuid import UUID
from datetime import datetime, timezone
from typing import List, Optional

from app.models.referral import ReferralOffer, ReferralRequest
from app.models.user import Profile
from app.models.job import JobPosting
from app.schemas.referral import ReferralOfferCreate, ReferralRequestCreate
from app.services.matching import calculate_tag_overlap


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


def create_referral_offer(
    session: Session, offer_in: ReferralOfferCreate, user_id: UUID
) -> ReferralOffer:
    offer = ReferralOffer(
        referrer_id=user_id,
        company_id=offer_in.company_id,
        tags=offer_in.tags,
        weekly_capacity=offer_in.weekly_capacity,
        current_week_count=0,
        is_active=True,
        created_at=get_utc_now(),
    )
    session.add(offer)
    session.commit()
    session.refresh(offer)
    return offer


def get_referral_offers(
    session: Session,
    company_id: Optional[UUID] = None,
    tag: Optional[str] = None,
) -> List[ReferralOffer]:
    query = select(ReferralOffer).where(ReferralOffer.is_active == True)
    if company_id:
        query = query.where(ReferralOffer.company_id == company_id)
    offers = session.exec(query.order_by(ReferralOffer.created_at.desc())).all()

    if tag:
        offers = [o for o in offers if tag in o.tags]

    return offers


def create_referral_request(
    session: Session,
    offer_id: UUID,
    request_in: ReferralRequestCreate,
    requester_id: UUID,
) -> ReferralRequest:
    offer = session.get(ReferralOffer, offer_id)
    if not offer:
        raise ValueError("Offer not found")

    if offer.current_week_count >= offer.weekly_capacity:
        raise ValueError("This referrer is at capacity this week")

    match_score = 0.0

    if request_in.posting_id:
        posting = session.get(JobPosting, request_in.posting_id)
        if posting:
            match_score = calculate_tag_overlap(offer.tags, posting.tags or [])
    else:
        profile = session.exec(
            select(Profile).where(Profile.user_id == requester_id)
        ).first()
        if profile and profile.skills:
            match_score = calculate_tag_overlap(offer.tags, profile.skills)

    offer.current_week_count += 1
    session.add(offer)

    req = ReferralRequest(
        offer_id=offer_id,
        requester_id=requester_id,
        posting_id=request_in.posting_id,
        match_score=match_score,
        message=request_in.message,
        status="pending",
        created_at=get_utc_now(),
    )
    session.add(req)
    session.commit()
    session.refresh(req)

    return req


def get_incoming_requests(session: Session, user_id: UUID) -> List[ReferralRequest]:
    return session.exec(
        select(ReferralRequest)
        .join(ReferralOffer, ReferralRequest.offer_id == ReferralOffer.id)
        .where(ReferralOffer.referrer_id == user_id)
        .order_by(ReferralRequest.created_at.desc())
    ).all()


def get_my_requests(session: Session, user_id: UUID) -> List[ReferralRequest]:
    return session.exec(
        select(ReferralRequest)
        .where(ReferralRequest.requester_id == user_id)
        .order_by(ReferralRequest.created_at.desc())
    ).all()


def update_request_status(
    session: Session, request_id: UUID, status: str, user_id: UUID
) -> ReferralRequest:
    req = session.get(ReferralRequest, request_id)
    if not req:
        raise ValueError("Request not found")

    offer = session.get(ReferralOffer, req.offer_id)
    if not offer or offer.referrer_id != user_id:
        raise PermissionError(
            "Only the referrer who owns the offer can update this request"
        )

    if req.status != "pending":
        raise ValueError("Only pending requests can be resolved")

    req.status = status
    req.resolved_at = get_utc_now()

    session.add(req)
    session.commit()
    session.refresh(req)
    return req
