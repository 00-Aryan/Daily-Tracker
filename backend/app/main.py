import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import supabase
from app.routers import tasks, reference, logs, jobs, study, auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Database connected")
    yield


app = FastAPI(title="ProductivOS", lifespan=lifespan)

# CORS configuration
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
app.include_router(reference.router, prefix="/reference", tags=["Reference Data"])
app.include_router(logs.router, prefix="/logs", tags=["Daily Logs"])
app.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
app.include_router(study.router, prefix="/study", tags=["Study"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "ProductivOS backend running"}