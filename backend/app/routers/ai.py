from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from uuid import UUID
from app.api.deps import SessionDep, CurrentUser
from app.models.job import JobPosting
from app.services import ai_service

router = APIRouter()


from app.core.rate_limiter import SlidingWindowRateLimiter
from app.core.event_bus import event_bus

ai_rate_limiter = SlidingWindowRateLimiter(requests=10, window_seconds=60)


@router.post("/match", dependencies=[Depends(ai_rate_limiter)])
async def analyze_match(
    session: SessionDep,
    current_user: CurrentUser,
    posting_id: UUID = Form(...),
    file: UploadFile = File(...)
):
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="Resume file is required for AI matching analysis.")

    job = session.get(JobPosting, posting_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job posting not found.")

    try:
        file_bytes = await file.read()
        analysis = ai_service.analyze_resume_and_match_job(
            job=job,
            file_bytes=file_bytes,
            filename=file.filename
        )
        await event_bus.publish("ai_match_executed", {
            "user_id": str(current_user.id),
            "posting_id": str(posting_id),
            "match_score": analysis.get("match_score")
        })
        return analysis
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"AI analysis error: {str(err)}")
