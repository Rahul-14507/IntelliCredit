import asyncio
from backend.database import AsyncSessionLocal, engine
from backend.models import Base, Application, Document, Analysis, PrimaryInsight
from backend.services.ai_analyzer import demo_json

async def seed_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as db:
        app = Application(
            company_name="Pujari Industries Private Limited",
            cin="U12345MH2010PTC987654",
            industry="Manufacturing",
            requested_limit=1.0,
            status="completed"
        )
        db.add(app)
        await db.commit()
        await db.refresh(app)
        
        doc = Document(
            application_id=app.id,
            original_filename="Pujari_Industries_Annual_Report_FY23.pdf",
            file_path="./uploads/demo/Pujari_Industries_Annual_Report_FY23.pdf",
            extracted_text="Demo mock text injected by seeder.",
            extraction_status="done"
        )
        db.add(doc)
        
        insight = PrimaryInsight(
            application_id=app.id,
            officer_name="Demo Officer",
            notes_text="Site visit conducted. Operations look robust."
        )
        db.add(insight)
        
        ans = Analysis(
            application_id=app.id,
            raw_result=demo_json,
            total_score=demo_json["scoring"]["total_score"],
            grade=demo_json["scoring"]["grade"],
            recommended_action=demo_json["scoring"]["recommended_action"],
            suggested_limit_crores=demo_json["lending_recommendation"]["suggested_limit_crores"],
            interest_rate=demo_json["lending_recommendation"]["interest_rate_pct"]
        )
        db.add(ans)
        
        await db.commit()
        print(f"Database seeded successfully with Demo Application ID: {app.id}")

if __name__ == "__main__":
    asyncio.run(seed_db())
