import asyncio
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.idempotency import IdempotencyMiddleware

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="LoopBack API")

app.add_middleware(IdempotencyMiddleware, ttl_seconds=86400)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def ghosting_sweep_task():
    from scripts.run_ghosting_sweep import run_ghosting_sweep
    while True:
        try:
            await asyncio.sleep(43200)
            run_ghosting_sweep()
        except Exception as e:
            print(f"Ghosting sweep error: {e}")


@app.on_event("startup")
async def startup_event():
    from app.core.db import engine
    from sqlmodel import SQLModel, text
    from app.core.telemetry import setup_telemetry_listeners
    from app.core.seeder import seed_initial_data

    setup_telemetry_listeners()
    SQLModel.metadata.create_all(engine)

    try:
        with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
            for val in [
                "OFFER_ACCEPTED", "APPLIED", "VIEWED", "SCREENING", "INTERVIEWING",
                "OFFERED", "REJECTED", "GHOSTED", "WITHDRAWN",
                "applied", "viewed", "screening", "interviewing",
                "offered", "offer_accepted", "rejected", "ghosted", "withdrawn",
            ]:
                try:
                    conn.execute(text(f"ALTER TYPE applicationstatus ADD VALUE IF NOT EXISTS '{val}';"))
                except Exception:
                    pass

            migrations = [
                'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS employer_id UUID;',
                'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS employment_doc_url VARCHAR;',
                "ALTER TABLE company ADD COLUMN IF NOT EXISTS verification_doc_url VARCHAR;",
                "ALTER TABLE company ADD COLUMN IF NOT EXISTS employee_proof_doc_url VARCHAR;",
                "ALTER TABLE company ADD COLUMN IF NOT EXISTS created_by_user_id UUID;",
                "ALTER TABLE referraloffer ADD COLUMN IF NOT EXISTS weekly_capacity INTEGER DEFAULT 3;",
                "ALTER TABLE referraloffer ADD COLUMN IF NOT EXISTS current_week_count INTEGER DEFAULT 0;",
                "ALTER TABLE referraloffer ADD COLUMN IF NOT EXISTS accepted_count INTEGER DEFAULT 0;",
                "ALTER TABLE referraloffer ADD COLUMN IF NOT EXISTS posting_id UUID;",
                "ALTER TABLE referralrequest ADD COLUMN IF NOT EXISTS posting_id UUID;",
                "ALTER TABLE referralrequest ADD COLUMN IF NOT EXISTS resume_url VARCHAR;",
                "ALTER TABLE jobposting ADD COLUMN IF NOT EXISTS response_timeframe_days INTEGER DEFAULT 30;",
                "ALTER TABLE jobposting ADD COLUMN IF NOT EXISTS referral_limit INTEGER DEFAULT 5;",
            ]
            for migration in migrations:
                conn.execute(text(migration))
    except Exception as err:
        print(f"Migration notice: {err}")

    try:
        seed_initial_data()
    except Exception as err:
        print(f"Seeding notice: {err}")

    asyncio.create_task(ghosting_sweep_task())


from app.routers import auth, company, job, application, intel, referrals, upload, ai

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(company.router, prefix="/companies", tags=["companies"])
app.include_router(job.router, prefix="/jobs", tags=["jobs"])
app.include_router(application.router, prefix="/applications", tags=["applications"])
app.include_router(intel.router, prefix="/intel", tags=["intel"])
app.include_router(referrals.router, tags=["referrals"])
app.include_router(upload.router, prefix="/upload", tags=["upload"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])


@app.get("/health")
def health_check():
    return {"status": "ok"}
