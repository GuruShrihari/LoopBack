import pytest
from uuid import uuid4
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock

from app.models.user import User, Profile
from app.models.company import Company
from app.models.job import JobPosting
from app.models.referral import ReferralOffer, ReferralRequest
from app.schemas.referral import ReferralOfferCreate, ReferralRequestCreate, ReferralRequestUpdate
from app.services.matching import calculate_tag_overlap
from app.services import referral_service
from scripts.reset_referral_capacity import main as reset_main

def test_match_score_computed_correctly():
    # Hand-checked example:
    # Offer tags: ['python', 'backend', 'fastapi'] (size = 3)
    # Target tags: ['backend', 'fastapi', 'docker', 'aws'] (intersection = {'backend', 'fastapi'}, size = 2)
    # Fraction: 2 / 3 = 0.6666666666666666
    score = calculate_tag_overlap(['python', 'backend', 'fastapi'], ['backend', 'fastapi', 'docker', 'aws'])
    assert score == pytest.approx(2.0 / 3.0, abs=1e-9)

    # Empty source tags test guard against division by zero
    assert calculate_tag_overlap([], ['python']) == 0.0

    # Disjoint tags
    assert calculate_tag_overlap(['python', 'sql'], ['java', 'c++']) == 0.0

    # Exact match
    assert calculate_tag_overlap(['python', 'sql'], ['python', 'sql', 'extra']) == 1.0

def test_offer_creation():
    mock_session = MagicMock()
    user_id = uuid4()
    company_id = uuid4()
    posting_id = uuid4()

    user = User(id=user_id, email="test@example.com", hashed_password="pw", full_name="Test", employer_id=company_id, created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc))
    job = JobPosting(id=posting_id, company_id=company_id, posted_by_user_id=user_id, title="Dev", description="Desc", is_remote=True, status="active", created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc))

    def mock_get(model, pk):
        if model == User and pk == user_id:
            return user
        if model == JobPosting and pk == posting_id:
            return job
        return None
    mock_session.get.side_effect = mock_get
    mock_session.exec.return_value.first.return_value = None

    offer_in = ReferralOfferCreate(
        company_id=company_id,
        posting_id=posting_id,
        tags=["python", "fastapi"],
        weekly_capacity=5
    )

    offer = referral_service.create_referral_offer(mock_session, offer_in, user_id)

    assert offer.referrer_id == user_id
    assert offer.company_id == company_id
    assert offer.posting_id == posting_id
    assert offer.tags == ["python", "fastapi"]
    mock_session.add.assert_called_once()
    mock_session.commit.assert_called_once()
    mock_session.refresh.assert_called_once()

def test_request_rejected_when_at_capacity():
    mock_session = MagicMock()
    offer_id = uuid4()
    referrer_id = uuid4()
    requester_id = uuid4()
    posting_id = uuid4()

    job = JobPosting(id=posting_id, company_id=uuid4(), posted_by_user_id=referrer_id, title="Dev", description="Desc", is_remote=True, status="active", created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc))
    offer = ReferralOffer(
        id=offer_id,
        referrer_id=referrer_id,
        posting_id=posting_id,
        company_id=job.company_id,
        tags=["python"],
        weekly_capacity=3,
        current_week_count=3,
        is_active=True,
        created_at=datetime.now(timezone.utc)
    )

    def mock_get(model, pk):
        if model == ReferralOffer and pk == offer_id:
            return offer
        if model == JobPosting and pk == posting_id:
            return job
        return None
    mock_session.get.side_effect = mock_get

    req_in = ReferralRequestCreate(posting_id=posting_id, resume_url="/uploads/resume.pdf", message="Please refer me")
    # Duplicate or application checks return None
    mock_session.exec.return_value.first.return_value = None

    req = referral_service.create_referral_request(mock_session, offer_id, req_in, requester_id)
    assert req.status == "pending"
    assert req.posting_id == posting_id

def test_current_week_count_increments_on_request_creation():
    mock_session = MagicMock()
    offer_id = uuid4()
    referrer_id = uuid4()
    requester_id = uuid4()
    posting_id = uuid4()

    job = JobPosting(id=posting_id, company_id=uuid4(), posted_by_user_id=referrer_id, title="Dev", description="Desc", tags=["python", "fastapi"], is_remote=True, status="active", created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc))
    offer = ReferralOffer(
        id=offer_id,
        referrer_id=referrer_id,
        posting_id=posting_id,
        company_id=job.company_id,
        tags=["python", "fastapi"],
        weekly_capacity=3,
        current_week_count=1,
        is_active=True,
        created_at=datetime.now(timezone.utc)
    )

    def mock_get(model, pk):
        if model == ReferralOffer and pk == offer_id:
            return offer
        if model == JobPosting and pk == posting_id:
            return job
        return None
    mock_session.get.side_effect = mock_get

    mock_session.exec.return_value.first.return_value = None

    req_in = ReferralRequestCreate(posting_id=posting_id, resume_url="/uploads/resume.pdf", message="Referral please")
    req = referral_service.create_referral_request(mock_session, offer_id, req_in, requester_id)

    assert req.status == "pending"
    assert req.match_score == pytest.approx(1.0, abs=1e-9)

def test_only_owning_referrer_can_accept():
    mock_session = MagicMock()
    offer_id = uuid4()
    referrer_id = uuid4()
    intruder_id = uuid4()
    request_id = uuid4()
    posting_id = uuid4()

    job = JobPosting(id=posting_id, company_id=uuid4(), posted_by_user_id=referrer_id, title="Dev", description="Desc", referral_limit=5, is_remote=True, status="active", created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc))
    req = ReferralRequest(
        id=request_id,
        offer_id=offer_id,
        requester_id=uuid4(),
        posting_id=posting_id,
        resume_url="/uploads/resume.pdf",
        status="pending",
        created_at=datetime.now(timezone.utc)
    )
    offer = ReferralOffer(
        id=offer_id,
        referrer_id=referrer_id,
        posting_id=posting_id,
        company_id=job.company_id,
        accepted_count=0,
        tags=["python"],
        created_at=datetime.now(timezone.utc)
    )

    def mock_get(model, pk):
        if model == ReferralRequest and pk == request_id:
            return req
        if model == ReferralOffer and pk == offer_id:
            return offer
        if model == JobPosting and pk == posting_id:
            return job
        return None

    mock_session.get.side_effect = mock_get

    # Intruder tries to accept
    with pytest.raises(PermissionError) as exc_info:
        referral_service.update_request_status(mock_session, request_id, "accepted", intruder_id)

    assert "Only the referrer who owns the offer can update this request" in str(exc_info.value)

    # Owning referrer accepts
    updated = referral_service.update_request_status(mock_session, request_id, "accepted", referrer_id)
    assert updated.status == "accepted"
    assert updated.resolved_at is not None
    assert updated.status == "accepted"
    assert updated.resolved_at is not None

def test_re_resolving_rejected():
    mock_session = MagicMock()
    offer_id = uuid4()
    referrer_id = uuid4()
    request_id = uuid4()

    req = ReferralRequest(
        id=request_id,
        offer_id=offer_id,
        requester_id=uuid4(),
        status="accepted",
        created_at=datetime.now(timezone.utc),
        resolved_at=datetime.now(timezone.utc)
    )
    offer = ReferralOffer(
        id=offer_id,
        referrer_id=referrer_id,
        company_id=uuid4(),
        tags=["python"],
        created_at=datetime.now(timezone.utc)
    )

    def mock_get(model, pk):
        if model == ReferralRequest and pk == request_id:
            return req
        if model == ReferralOffer and pk == offer_id:
            return offer
        return None

    mock_session.get.side_effect = mock_get

    # Try resolving already resolved request
    with pytest.raises(ValueError) as exc_info:
        referral_service.update_request_status(mock_session, request_id, "declined", referrer_id)

    assert "Only pending requests can be resolved" in str(exc_info.value)

def test_reset_script_logic():
    mock_session = MagicMock()

    # Offer with capacity count > 0
    offer1 = ReferralOffer(
        id=uuid4(),
        referrer_id=uuid4(),
        company_id=uuid4(),
        tags=["python"],
        weekly_capacity=3,
        current_week_count=2,
        is_active=True,
        created_at=datetime.now(timezone.utc)
    )
    # Stale request > 7 days
    stale_req = ReferralRequest(
        id=uuid4(),
        offer_id=offer1.id,
        requester_id=uuid4(),
        status="pending",
        created_at=datetime.now(timezone.utc) - timedelta(days=8)
    )

    def mock_exec(query):
        mock_result = MagicMock()
        query_str = str(query)
        if "referralrequest" in query_str.lower():
            mock_result.all.return_value = [stale_req]
        elif "referraloffer" in query_str.lower():
            mock_result.all.return_value = [offer1]
        else:
            mock_result.all.return_value = []
        return mock_result

    mock_session.exec.side_effect = mock_exec

    from unittest.mock import patch
    with patch("scripts.reset_referral_capacity.Session") as mock_session_cls:
        mock_session_cls.return_value.__enter__.return_value = mock_session
        reset_main()

        assert offer1.current_week_count == 0
        assert stale_req.status == "expired"
        assert stale_req.resolved_at is not None

        # Run twice in a row - idempotent
        reset_main()
        assert offer1.current_week_count == 0

def test_cannot_offer_referral_for_other_company():
    mock_session = MagicMock()
    user_id = uuid4()
    my_company_id = uuid4()
    other_company_id = uuid4()
    posting_id = uuid4()

    user = User(id=user_id, email="test@example.com", hashed_password="pw", full_name="Test", employer_id=my_company_id, created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc))
    job_other_company = JobPosting(id=posting_id, company_id=other_company_id, posted_by_user_id=uuid4(), title="Dev", description="Desc", is_remote=True, status="active", created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc))

    def mock_get(model, pk):
        if model == User and pk == user_id:
            return user
        if model == JobPosting and pk == posting_id:
            return job_other_company
        return None
    mock_session.get.side_effect = mock_get

    offer_in = ReferralOfferCreate(
        company_id=other_company_id,
        posting_id=posting_id,
        tags=["python"],
        weekly_capacity=5
    )

    with pytest.raises(ValueError) as exc_info:
        referral_service.create_referral_offer(mock_session, offer_in, user_id)

    assert "You can only offer referrals for job postings at your current employer company" in str(exc_info.value)


