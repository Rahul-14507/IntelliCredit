from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from backend.database import create_tables
from backend.routers import applications, ingest, analyze, export

@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    yield

app = FastAPI(title="IntelliCredit API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])

app.include_router(applications.router, prefix="/applications", tags=["applications"])
app.include_router(ingest.router, prefix="/ingest", tags=["ingest"])
app.include_router(analyze.router, prefix="/analyze", tags=["analyze"])
app.include_router(export.router, prefix="/export", tags=["export"])

@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0"}
