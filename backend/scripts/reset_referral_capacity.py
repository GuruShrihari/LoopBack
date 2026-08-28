"""
Intended to run weekly via cron.
Resets the weekly referral capacity for all active offers.
Also expires pending requests older than 7 days.
"""
import sys
import os
from datetime import datetime, timedelta, timezone

# Add backend dir to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select
from app.core.db import engine
from app.models.referral import ReferralOffer, ReferralRequest


def get_utc_now():
    return datetime.now(timezone.utc)


def main():
    with Session(engine) as session:
        # Expire stale requests (> 7 days old)
        seven_days_ago = get_utc_now() - timedelta(days=7)
        stale_requests = session.exec(
            select(ReferralRequest)
            .where(ReferralRequest.status == "pending")
            .where(ReferralRequest.created_at < seven_days_ago)
        ).all()

        expired_count = 0
        for req in stale_requests:
            req.status = "expired"
            req.resolved_at = get_utc_now()
            session.add(req)
            expired_count += 1

        # Reset capacity for active offers
        active_offers = session.exec(
            select(ReferralOffer).where(ReferralOffer.is_active == True)
        ).all()

        reset_count = 0
        for offer in active_offers:
            if offer.current_week_count != 0:
                offer.current_week_count = 0
                session.add(offer)
                reset_count += 1

        session.commit()

        print(f"Capacity reset script completed successfully.")
        print(f"Expired {expired_count} stale requests.")
        print(f"Reset {reset_count} offers.")


if __name__ == "__main__":
    main()

