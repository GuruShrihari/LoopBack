import sys
import os
from datetime import datetime, timedelta

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlmodel import Session, select
from app.core.db import engine
from app.models.application import Application
from app.models.job import JobPosting
from app.models.enums import ApplicationStatus


def run_ghosting_sweep():
    with Session(engine) as session:
        # Find applications that are still 'pending' basically (APPLIED, VIEWED, SCREENING, INTERVIEWING)
        # and where created_at + response_timeframe_days < now
        active_statuses = [
            ApplicationStatus.APPLIED,
            ApplicationStatus.VIEWED,
            ApplicationStatus.SCREENING,
            ApplicationStatus.INTERVIEWING
        ]
        
        apps = session.exec(
            select(Application)
            .join(JobPosting, Application.posting_id == JobPosting.id)
            .where(Application.status.in_(active_statuses))
        ).all()
        
        now = datetime.utcnow()
        ghosted_count = 0
        
        for app in apps:
            job = session.get(JobPosting, app.posting_id)
            if not job:
                continue
                
            timeframe_days = job.response_timeframe_days
            max_date = app.created_at + timedelta(days=timeframe_days)
            
            if now > max_date:
                app.status = ApplicationStatus.GHOSTED
                history = list(app.status_history)
                history.append({
                    "status": ApplicationStatus.GHOSTED.value,
                    "at": now.isoformat(),
                    "actor": "system",
                    "note": f"Timeframe of {timeframe_days} days exceeded."
                })
                app.status_history = history
                app.updated_at = now
                session.add(app)
                ghosted_count += 1
                
        session.commit()
        print(f"Sweep complete. Marked {ghosted_count} applications as ghosted.")


if __name__ == "__main__":
    run_ghosting_sweep()

