from sqlmodel import Session, select
from uuid import UUID
from datetime import datetime, timezone
from typing import List, Optional

from app.models.referral import ReferralOffer, ReferralRequest
from app.models.user import Profile, User
from app.models.job import JobPosting
from app.models.application import Application
from app.models.enums import ApplicationStatus
from app.schemas.referral import ReferralOfferCreate, ReferralRequestCreate
from app.services.matching import calculate_tag_overlap


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


def create_referral_offer(
    session: Session, offer_in: ReferralOfferCreate, user_id: UUID
) -> ReferralOffer:
    user = session.get(User, user_id)
    if not user or not user.employer_id:
        raise ValueError("You must select and verify your employer before offering referrals.")

    job = session.get(JobPosting, offer_in.posting_id)
    if not job:
        raise ValueError("Job posting not found.")
        
    if str(job.company_id) != str(user.employer_id):
        raise ValueError("You can only offer referrals for job postings at your current employer company.")

    existing_offer = session.exec(
        select(ReferralOffer)
        .where(ReferralOffer.referrer_id == user_id)
        .where(ReferralOffer.posting_id == offer_in.posting_id)
        .where(ReferralOffer.is_active == True)
    ).first()
    if existing_offer:
        raise ValueError("You already have an active referral offer for this job posting.")

    offer = ReferralOffer(
        referrer_id=user_id,
        posting_id=offer_in.posting_id,
        company_id=job.company_id,
        tags=offer_in.tags,
        accepted_count=0,
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
        
    job = session.get(JobPosting, request_in.posting_id)
    if not job:
        raise ValueError("Job posting not found")
        
    if offer.posting_id != job.id:
        raise ValueError("This referral offer is for a different job posting.")

    # Rule 5: Cannot ask the same referrer twice
    existing_req = session.exec(
        select(ReferralRequest)
        .where(ReferralRequest.offer_id == offer_id)
        .where(ReferralRequest.requester_id == requester_id)
    ).first()
    if existing_req:
        raise ValueError("You have already requested a referral from this person.")
        
    # Rule 8: If applied directly, cannot ask for referral
    existing_app = session.exec(
        select(Application)
        .where(Application.posting_id == job.id)
        .where(Application.user_id == requester_id)
    ).first()
    if existing_app:
        raise ValueError("You have already applied for this job. You can no longer ask for a referral.")

    match_score = calculate_tag_overlap(offer.tags, job.tags or [])

    req = ReferralRequest(
        offer_id=offer_id,
        requester_id=requester_id,
        posting_id=request_in.posting_id,
        resume_url=request_in.resume_url,
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
        
    job = session.get(JobPosting, offer.posting_id)
    if not job:
        raise ValueError("Job posting no longer exists")

    if status == "accepted":
        if offer.accepted_count >= job.referral_limit:
            raise ValueError("You have reached your referral limit for this job.")
            
        offer.accepted_count += 1
        
        # Rule 8: Create the job application automatically
        referrer = session.get(User, user_id)
        referrer_name = referrer.full_name if referrer else "Employee"
        
        new_app = Application(
            user_id=req.requester_id,
            posting_id=job.id,
            status=ApplicationStatus.APPLIED,
            resume_url=req.resume_url,
            referred_by_id=user_id,
            notes=f"Referred by {referrer_name}",
            status_history=[{
                "status": "APPLIED",
                "at": get_utc_now().isoformat(),
                "actor": "system",
                "note": "Referred"
            }],
            created_at=get_utc_now(),
            updated_at=get_utc_now()
        )
        session.add(new_app)
        
        # Rule 6: If limit reached, bulk reject others
        if offer.accepted_count >= job.referral_limit:
            pending_reqs = session.exec(
                select(ReferralRequest)
                .where(ReferralRequest.offer_id == offer.id)
                .where(ReferralRequest.status == "pending")
                .where(ReferralRequest.id != req.id)
            ).all()
            
            for p_req in pending_reqs:
                p_req.status = "declined"
                p_req.resolved_at = get_utc_now()
                session.add(p_req)

    req.status = status
    req.resolved_at = get_utc_now()

    session.add(req)
    session.add(offer)
    session.commit()
    session.refresh(req)
    return req
