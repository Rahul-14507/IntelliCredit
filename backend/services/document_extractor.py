import os
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
from config import settings

class DocumentExtractor:
    def __init__(self):
        self.client = DocumentAnalysisClient(
            endpoint=settings.azure_di_endpoint,
            credential=AzureKeyCredential(settings.azure_di_key)
        )

    async def extract(self, file_path: str) -> dict:
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._extract_sync, file_path)

    def _extract_sync(self, file_path: str) -> dict:
        with open(file_path, "rb") as f:
            poller = self.client.begin_analyze_document("prebuilt-layout", f)
        result = poller.result()

        full_text = "\n".join(
            line.content
            for page in result.pages
            for line in page.lines
        )

        tables = []
        for table in result.tables:
            # Build a 2D array for each table
            rows = table.row_count
            cols = table.column_count
            grid = [[""] * cols for _ in range(rows)]
            for cell in table.cells:
                grid[cell.row_index][cell.column_index] = cell.content
            tables.append(grid)

        return {
            "full_text": full_text,
            "tables": tables,
            "page_count": len(result.pages),
            "char_count": len(full_text),
        }

extractor = DocumentExtractor()
