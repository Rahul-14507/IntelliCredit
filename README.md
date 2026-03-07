# IntelliCredit v2

Next-Generation Credit Appraisal Engine v2, completely rebuilt to use an optimized single data pipeline with Azure Document Intelligence and Azure OpenAI GPT-4o.

## Architecture

The V2 architecture operates on one bulletproof flow:

1.  **Ingestion:** User uploads any document (PDF, Excel, images).
2.  **Extraction:** Azure Document Intelligence extracts raw text, paragraphs, and tables as markdown. All extracted content is concatenated into a single `master_text`.
3.  **Analysis:** A single, comprehensive call to Azure OpenAI (GPT-4o) performs the complete Five Cs credit analysis on the `master_text` and returns a highly-structured JSON object.
4.  **Presentation:** The frontend React dashboard renders the scores, rationale, promoter network, and recommendations directly from the JSON. Detailed Word CAM documents are generated automatically.

## Local Setup

### 1. Prerequisites

- Docker and Docker Compose
- Node.js (v18+) for local frontend development
- Python 3.10+ for local backend development
- Azure OpenAI and Azure Document Intelligence API keys

### 2. Environment Configuration

Copy the `.env.example` file to `.env` in the root directory:

```bash
cp .env.example .env
```

Populate the keys:

```
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your_key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_DOCUMENT_INTELLIGENCE_KEY=your_key
DEMO_MODE=false
```

_Note: Set `DEMO_MODE=true` to skip actual Azure API calls and use the injected Pujari Industries test data._

### 3. Run with Docker Compose

From the root directory, simply run:

```bash
docker-compose up --build
```

This will start:

- **PostgreSQL Database** on port 5432
- **FastAPI Backend** on port 8000 (http://localhost:8000/docs)
- **Next.js Frontend** on port 3000 (http://localhost:3000)

### 4. Seeding Demo Data (Optional)

To instantly populate a full "Pujari Industries" application for testing the dashboard:

```bash
# Enter the backend container
docker-compose exec backend bash

# Run the seeder
python seed.py
```

Refresh the frontend dashboard at `http://localhost:3000` to view the comprehensive credit report.
