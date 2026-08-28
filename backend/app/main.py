from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, company, job, application, intel
from app.routers import auth, company, job, application, intel, referrals

app = FastAPI(title="Recruitment API - Lean Edition")

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(company.router, prefix="/companies", tags=["companies"])
app.include_router(job.router, prefix="/jobs", tags=["jobs"])
app.include_router(application.router, prefix="/applications", tags=["applications"])
app.include_router(intel.router, prefix="/intel", tags=["intel"])
app.include_router(referrals.router, tags=["referrals"])


@app.get("/health")
def health_check():
    return {"status": "ok"}
