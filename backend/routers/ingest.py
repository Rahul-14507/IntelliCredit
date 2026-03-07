from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import os
import shutil

from backend.database import get_db
from backend.models import Application, Document
from backend.config import settings
from backend.services.document_extractor import extract_text_from_file

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".xlsx", ".csv"}

@router.post("/{application_id}/upload")
async def upload_documents(application_id: str, files: list[UploadFile] = File(...), db: AsyncSession = Depends(get_db)):
    app_res = await db.execute(select(Application).where(Application.id == application_id))
    app = app_res.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    upload_dir = os.path.join(settings.UPLOAD_DIR, application_id)
    os.makedirs(upload_dir, exist_ok=True)
    
    processed = 0
    total_length = 0
    statuses = []
    
    for file in files:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            continue
            
        file_path = os.path.join(upload_dir, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        doc = Document(
            application_id=application_id,
            original_filename=file.filename,
            file_path=file_path,
            extraction_status="pending"
        )
        db.add(doc)
        await db.commit()
        await db.refresh(doc)
        
        # Extract synchronously
        text = await extract_text_from_file(file_path, file.filename)
        if text:
            doc.extracted_text = text
            doc.extraction_status = "done"
            total_length += len(text)
        else:
            doc.extraction_status = "failed"
            
        await db.commit()
        processed += 1
        statuses.append({"filename": file.filename, "status": doc.extraction_status, "length": len(text or "")})

    return {
        "application_id": application_id,
        "documents_processed": processed,
        "total_text_length": total_length,
        "extraction_statuses": statuses
    }

@router.get("/{application_id}/status")
async def extraction_status(application_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Document).where(Document.application_id == application_id))
    docs = res.scalars().all()
    return [{"filename": d.original_filename, "status": d.extraction_status, "length": len(d.extracted_text or "")} for d in docs]
