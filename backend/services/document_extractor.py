import os
from fastapi import HTTPException
from azure.core.credentials import AzureKeyCredential
from azure.ai.formrecognizer.aio import DocumentAnalysisClient
from sqlalchemy.future import select
from backend.config import settings
from backend.models import Document

demo_text = """
=== RELEVANT EXTRACTS FOR PUJARI INDUSTRIES PRIVATE LIMITED ===
COMPANY: Pujari Industries Private Limited
CIN: U12345MH2010PTC987654

FINANCIAL SITUATION (FY2023):
- Revenue: ₹4.72 Crore (Revenue Growth: 27.0%)
- EBITDA: ₹1.657 Crore (EBITDA Margin: 35.1%)
- Net Profit: ₹0.84 Crore
- Total Debt: ₹2.18 Crore
- Net Worth: ₹3.25 Crore
- Debt-to-Equity Ratio: 0.67
- Current Ratio: 1.58
- Interest Coverage: 10.15x

DIRECTORS:
- Rahul Pujari (Chairman & MD)
- Anjali Sharma (Director Finance)
- Mukesh Verma (Non-Executive Director) - Note: also director in struck-off entity
- Divya Rao (Independent Director)

MANAGEMENT DISCUSSION & ANALYSIS:
The company anticipates strong growth but faces some supply chain risks and increased material costs. 
Management hedging strategies are in place.

GST AND BANKING:
- GST Reconciliation shows minimal discrepancy (3.2%)
- Bank statements indicate 2 cheque bounces last year, no NPA history.
"""

async def extract_text_from_file(file_path: str, filename: str) -> str:
    if settings.DEMO_MODE:
        return demo_text

    if not settings.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT or not settings.AZURE_DOCUMENT_INTELLIGENCE_KEY:
        print("Azure Document Intelligence credentials not configured.")
        return ""

    try:
        client = DocumentAnalysisClient(
            endpoint=settings.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT,
            credential=AzureKeyCredential(settings.AZURE_DOCUMENT_INTELLIGENCE_KEY)
        )
        
        with open(file_path, "rb") as f:
            document_bytes = f.read()

        poller = await client.begin_analyze_document(
            "prebuilt-layout", document=document_bytes
        )
        result = await poller.result()
        await client.close()

        full_text = []
        if result.pages:
            for page in result.pages:
                full_text.append(f"\\n\\n--- PAGE {page.page_number} ---\\n\\n")
                
                # Add paragraphs
                if result.paragraphs:
                    page_paragraphs = [p.content for p in result.paragraphs if p.bounding_regions and p.bounding_regions[0].page_number == page.page_number]
                    if page_paragraphs:
                        full_text.append("\\n\\n".join(page_paragraphs))
                        
                # Add tables
                if result.tables:
                    page_tables = [t for t in result.tables if t.bounding_regions and t.bounding_regions[0].page_number == page.page_number]
                    for table in page_tables:
                        full_text.append(f"\\n[TABLE with {table.row_count} rows, {table.column_count} columns]\\n")
                        grid = [["" for _ in range(table.column_count)] for _ in range(table.row_count)]
                        for cell in table.cells:
                            grid[cell.row_index][cell.column_index] = cell.content.replace('\\n', ' ')
                        for row in grid:
                            full_text.append("| " + " | ".join(row) + " |")
                        full_text.append("\\n")

        # Fallback if no pages structuring
        if not full_text and result.content:
            full_text.append(result.content)

        return "".join(full_text)
    except Exception as e:
        print(f"Azure DI extraction failed for {filename}: {str(e)}")
        return ""

async def extract_all_documents(application_id: str, db) -> str:
    res = await db.execute(select(Document).where(Document.application_id == application_id).where(Document.extraction_status != "failed"))
    docs = res.scalars().all()
    
    parts = []
    for doc in docs:
        parts.append(f"\\n\\n=== DOCUMENT: {doc.original_filename} ===\\n\\n")
        parts.append(doc.extracted_text or "")
        
    master_text = "".join(parts)
    
    if len(master_text.strip()) < 100:
        raise HTTPException(status_code=400, detail="Insufficient text extracted from documents. Please check your files.")
        
    return master_text
