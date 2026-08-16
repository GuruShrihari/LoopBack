from fastapi import FastAPI

app = FastAPI(title="Recruitment API - Lean Edition")

@app.get("/health")
def health_check():
    return {"status": "ok"}
