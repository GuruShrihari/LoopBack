from sqlmodel import Session, select
from datetime import datetime, timezone
from app.core.db import engine
from app.core.security import get_password_hash
from app.models.user import User
from app.models.company import Company
from app.models.job import JobPosting
from app.models.referral import ReferralOffer
from app.models.enums import UserRole, PostingStatus


def seed_initial_data():
    """Seed initial demonstration data for evaluation if database is empty."""
    with Session(engine) as session:
        # Check if users already exist
        existing_user = session.exec(select(User)).first()
        if existing_user:
            return

        now = datetime.now(timezone.utc)

        # 1. Create Recruiter User
        recruiter = User(
            email="recruiter@loopback.com",
            hashed_password=get_password_hash("password123"),
            full_name="Alex Recruiter",
            role=UserRole.RECRUITER,
            created_at=now,
            updated_at=now
        )
        session.add(recruiter)
        session.commit()
        session.refresh(recruiter)

        # 2. Create Candidate User
        candidate = User(
            email="candidate@loopback.com",
            hashed_password=get_password_hash("password123"),
            full_name="Taylor Candidate",
            role=UserRole.CANDIDATE,
            created_at=now,
            updated_at=now
        )
        session.add(candidate)

        # 3. Create Company created by Recruiter
        company = Company(
            name="Meta Platforms",
            slug="meta-platforms",
            website="https://meta.com",
            is_verified=True,
            created_by_user_id=recruiter.id,
            created_at=now,
            updated_at=now
        )
        session.add(company)
        session.commit()
        session.refresh(company)

        # Assign Recruiter to Company
        recruiter.employer_id = company.id
        session.add(recruiter)

        # 4. Create Employed Referrer User at Meta
        referrer = User(
            email="referrer@loopback.com",
            hashed_password=get_password_hash("password123"),
            full_name="Jordan Referrer",
            role=UserRole.CANDIDATE,
            employer_id=company.id,
            created_at=now,
            updated_at=now
        )
        session.add(referrer)
        session.commit()
        session.refresh(referrer)

        # 5. Create Job Posting at Meta
        job = JobPosting(
            company_id=company.id,
            creator_id=recruiter.id,
            title="Staff Backend Engineer",
            description="Engineering high-throughput distributed systems in Python, FastAPI, and PostgreSQL.",
            requirements="5+ years Python experience, FastAPI, Distributed Systems, SQLModel.",
            location="San Francisco, CA",
            is_remote=True,
            tags=["python", "fastapi", "postgresql", "backend"],
            status=PostingStatus.ACTIVE,
            response_timeframe_days=14,
            referral_limit=5,
            created_at=now,
            updated_at=now
        )
        session.add(job)
        session.commit()
        session.refresh(job)

        # 6. Create Referral Offer by Referrer for Job
        offer = ReferralOffer(
            referrer_id=referrer.id,
            company_id=company.id,
            posting_id=job.id,
            tags=["python", "backend"],
            weekly_capacity=5,
            current_week_count=0,
            accepted_count=0,
            is_active=True,
            created_at=now
        )
        session.add(offer)
        session.commit()
        print("Database initial seeding complete.")
