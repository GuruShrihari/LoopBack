import io
import json
import os
import re
from typing import Dict, Any, List
from pypdf import PdfReader
from app.core.config import settings
from app.models.job import JobPosting


def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """Extract plain text from PDF or text files."""
    text_content = ""
    filename_lower = filename.lower()
    
    if filename_lower.endswith(".pdf"):
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            pages_text = [page.extract_text() or "" for page in reader.pages]
            text_content = "\n".join(pages_text).strip()
        except Exception as err:
            print(f"PDF extraction notice: {err}")

    if not text_content:
        try:
            text_content = file_bytes.decode("utf-8", errors="ignore").strip()
        except Exception:
            text_content = ""

    return text_content or "Resume text content could not be fully extracted."


def generate_fallback_analysis(job: JobPosting, resume_text: str) -> Dict[str, Any]:
    """Deterministic fallback analyzer when Gemini API key is omitted or unreachable."""
    resume_lower = resume_text.lower()
    job_text_lower = f"{job.title} {job.description} {job.requirements or ''}".lower()
    tags = [t.lower() for t in (job.tags or [])]
    
    matching_tags = [t for t in tags if t in resume_lower]
    missing_tags = [t for t in tags if t not in resume_lower]
    
    # Common tech keywords check
    common_keywords = ["python", "react", "typescript", "fastapi", "docker", "aws", "node", "sql", "api", "git", "ci/cd", "frontend", "backend"]
    matching_keywords = [kw for kw in common_keywords if kw in job_text_lower and kw in resume_lower]
    all_job_keywords = [kw for kw in common_keywords if kw in job_text_lower]
    
    base_score = 65
    if tags:
        tag_match_ratio = len(matching_tags) / len(tags)
        base_score += int(tag_match_ratio * 25)
    elif all_job_keywords:
        kw_ratio = len(matching_keywords) / len(all_job_keywords)
        base_score += int(kw_ratio * 25)
    else:
        base_score += 15

    match_score = min(98, max(45, base_score))
    
    strengths = [t.capitalize() for t in matching_tags] or [kw.capitalize() for kw in matching_keywords] or ["Relevant technical background", "Domain experience"]
    gaps = [t.capitalize() for t in missing_tags] or ["Advanced cloud deployment experience", "Specific toolchain specialization"]

    pitch = (
        f"Hi! I came across the {job.title} opening and am very excited about the role. "
        f"With experience in {', '.join(strengths[:3])}, I believe I can make an immediate impact on the team. "
        f"Would you be open to providing a referral for my application?"
    )

    return {
        "match_score": match_score,
        "match_summary": f"Your candidate profile shows a strong match ({match_score}%) for the {job.title} position.",
        "strengths": strengths[:4],
        "gaps": gaps[:3],
        "referral_pitch": pitch
    }


from app.core.circuit_breaker import CircuitBreaker

gemini_circuit_breaker = CircuitBreaker(failure_threshold=3, recovery_timeout=30.0)


def _call_gemini_api(api_key: str, job: JobPosting, resume_text: str) -> Dict[str, Any]:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    prompt = f"""
You are an expert technical recruiter and career coach.
Analyze the following candidate resume against the target job posting.

JOB TITLE: {job.title}
JOB DESCRIPTION:
{job.description}

JOB REQUIREMENTS:
{job.requirements or 'N/A'}

JOB TAGS: {', '.join(job.tags or [])}

CANDIDATE RESUME TEXT:
{resume_text[:4000]}

Return a JSON object matching this exact structure:
{{
  "match_score": <integer between 0 and 100>,
  "match_summary": "<1-2 sentence high-level overview of candidate fit>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "gaps": ["<gap/missing skill 1>", "<gap/missing skill 2>"],
  "referral_pitch": "<a compelling 2-3 sentence referral pitch written in first-person candidate voice requesting an insider referral>"
}}
"""
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json"
        )
    )
    
    if response and response.text:
        cleaned_json = response.text.strip().removeprefix("```json").removesuffix("```").strip()
        parsed = json.loads(cleaned_json)
        return {
            "match_score": int(parsed.get("match_score", 75)),
            "match_summary": str(parsed.get("match_summary", "Good overall match.")),
            "strengths": list(parsed.get("strengths", [])),
            "gaps": list(parsed.get("gaps", [])),
            "referral_pitch": str(parsed.get("referral_pitch", ""))
        }
    raise RuntimeError("Empty response from Gemini API")


def analyze_resume_and_match_job(job: JobPosting, file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """Analyze candidate resume against job posting using Gemini API or fallback."""
    resume_text = extract_text_from_file(file_bytes, filename)
    api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")

    if not api_key:
        return generate_fallback_analysis(job, resume_text)

    return gemini_circuit_breaker.call(
        func=lambda: _call_gemini_api(api_key, job, resume_text),
        fallback_func=lambda: generate_fallback_analysis(job, resume_text)
    )
