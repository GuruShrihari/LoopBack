import pytest
from uuid import uuid4
from datetime import datetime
from app.models.job import JobPosting
from app.services.ai_service import extract_text_from_file, analyze_resume_and_match_job


def test_extract_text_from_plain_text():
    sample_bytes = b"Software Engineer with Python, React, and FastAPI experience."
    extracted = extract_text_from_file(sample_bytes, "resume.txt")
    assert "Python, React, and FastAPI" in extracted


def test_ai_fallback_match_analysis():
    job = JobPosting(
        id=uuid4(),
        company_id=uuid4(),
        creator_id=uuid4(),
        title="Full Stack Engineer",
        description="Looking for Python, React, and FastAPI developer.",
        requirements="Python, FastAPI, Docker",
        tags=["python", "fastapi", "react"],
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    resume_bytes = b"Jane Doe - Senior Developer proficient in Python, FastAPI, React, and PostgreSQL."
    analysis = analyze_resume_and_match_job(job, resume_bytes, "jane_resume.pdf")

    assert "match_score" in analysis
    assert isinstance(analysis["match_score"], int)
    assert analysis["match_score"] >= 60
    assert len(analysis["strengths"]) > 0
    assert "referral_pitch" in analysis
    assert "referral" in analysis["referral_pitch"].lower()
