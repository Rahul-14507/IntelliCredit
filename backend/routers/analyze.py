from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import Optional

from backend.database import get_db
from backend.models import Application, PrimaryInsight, Analysis
from backend.services.document_extractor import extract_all_documents
from backend.services.ai_analyzer import analyze_credit

router = APIRouter()

class AnalyzeRequest(BaseModel):
    officer_name: Optional[str] = None
    primary_insights_text: Optional[str] = None

@router.post("/{application_id}")
async def run_analysis(application_id: str, req: AnalyzeRequest, db: AsyncSession = Depends(get_db)):
    app_res = await db.execute(select(Application).where(Application.id == application_id))
    app = app_res.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    if req.primary_insights_text:
        insight = PrimaryInsight(
            application_id=application_id,
            officer_name=req.officer_name,
            notes_text=req.primary_insights_text
        )
        db.add(insight)
        await db.commit()
        
    master_text = await extract_all_documents(application_id, db)
    
    raw_json = await analyze_credit(
        master_text=master_text,
        company_name=app.company_name,
        cin=app.cin,
        industry=app.industry,
        requested_limit_crores=app.requested_limit,
        primary_insights=req.primary_insights_text or ""
    )
    
    scoring = raw_json.get("scoring", {})
    lending = raw_json.get("lending_recommendation", {})
    
    ans = Analysis(
        application_id=application_id,
        raw_result=raw_json,
        total_score=scoring.get("total_score"),
        grade=scoring.get("grade"),
        recommended_action=scoring.get("recommended_action"),
        suggested_limit_crores=lending.get("suggested_limit_crores"),
        interest_rate=lending.get("interest_rate_pct")
    )
    db.add(ans)
    
    app.status = "completed"
    await db.commit()
    
    return raw_json

@router.get("/{application_id}/result")
async def get_analysis_result(application_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Analysis).where(Analysis.application_id == application_id))
    ans = res.scalars().first()
    if not ans:
        raise HTTPException(status_code=404, detail="Analysis not yet run for this application")
    return ans.raw_result

@router.post("/{application_id}/recalculate")
async def recalculate(application_id: str, req: Optional[AnalyzeRequest] = None, db: AsyncSession = Depends(get_db)):
    ans_res = await db.execute(select(Analysis).where(Analysis.application_id == application_id))
    ans = ans_res.scalars().first()
    if ans:
        await db.delete(ans)
        await db.commit()
        
    # rerun analysis with existing primary insights plus any new ones
    ins_res = await db.execute(select(PrimaryInsight).where(PrimaryInsight.application_id == application_id).order_by(PrimaryInsight.created_at.desc()))
    existing_insight = ins_res.scalars().first()
    
    final_req = AnalyzeRequest()
    if existing_insight:
        final_req.officer_name = existing_insight.officer_name
        final_req.primary_insights_text = existing_insight.notes_text
        
    if req and req.primary_insights_text:
        # Append new observation
        new_text = req.primary_insights_text
        if final_req.primary_insights_text:
            final_req.primary_insights_text += f"\n\n[Field Observation {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}]:\n{new_text}"
        else:
            final_req.primary_insights_text = new_text
            
        # Update/Create the record
        new_ins = PrimaryInsight(
            application_id=application_id,
            officer_name=req.officer_name or final_req.officer_name,
            notes_text=final_req.primary_insights_text
        )
        db.add(new_ins)
        await db.commit()
        
    return await run_analysis(application_id, final_req, db)
