from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from backend.database import get_db
from backend.models import Application, Analysis

router = APIRouter()

class CreateAppRequest(BaseModel):
    company_name: str
    cin: str
    industry: str
    requested_limit_crores: float

@router.post("")
async def create_application(req: CreateAppRequest, db: AsyncSession = Depends(get_db)):
    app = Application(
        company_name=req.company_name,
        cin=req.cin,
        industry=req.industry,
        requested_limit=req.requested_limit_crores
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)
    return {"id": app.id, "status": app.status}

@router.get("")
async def list_applications(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Application).where(Application.status != "deleted").order_by(Application.created_at.desc()))
    apps = res.scalars().all()
    
    out = []
    for a in apps:
        ans_res = await db.execute(select(Analysis).where(Analysis.application_id == a.id))
        ans = ans_res.scalars().first()
        out.append({
            "id": a.id,
            "company_name": a.company_name,
            "cin": a.cin,
            "requested_limit_crores": a.requested_limit,
            "status": a.status,
            "total_score": ans.total_score if ans else None,
            "grade": ans.grade if ans else None,
            "recommended_action": ans.recommended_action if ans else None,
            "created_at": a.created_at
        })
    return out

@router.get("/{id}")
async def get_application(id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Application).where(Application.id == id, Application.status != "deleted"))
    app = res.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Not found")
        
    ans_res = await db.execute(select(Analysis).where(Analysis.application_id == id))
    ans = ans_res.scalars().first()
    
    return {
        "id": app.id,
        "company_name": app.company_name,
        "cin": app.cin,
        "industry": app.industry,
        "requested_limit_crores": app.requested_limit,
        "status": app.status,
        "created_at": app.created_at,
        "analysis": ans.raw_result if ans else None
    }

@router.delete("/{id}")
async def delete_application(id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Application).where(Application.id == id))
    app = res.scalars().first()
    if app:
        app.status = "deleted"
        await db.commit()
    return {"success": True}
