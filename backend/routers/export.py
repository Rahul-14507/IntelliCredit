from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.database import get_db
from backend.models import Application, Analysis
from backend.services.cam_generator import create_cam

router = APIRouter()

@router.get("/{application_id}/cam")
async def export_cam(application_id: str, db: AsyncSession = Depends(get_db)):
    app_res = await db.execute(select(Application).where(Application.id == application_id))
    app = app_res.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    ans_res = await db.execute(select(Analysis).where(Analysis.application_id == application_id))
    ans = ans_res.scalars().first()
    if not ans:
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    cam_stream = create_cam(ans.raw_result, app)
    
    return StreamingResponse(
        cam_stream,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename=CAM_{app.company_name.replace(' ', '_')}.docx"}
    )
