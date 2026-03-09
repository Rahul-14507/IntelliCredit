# IntelliCredit v2

Next-Generation Credit Appraisal Engine v2, completely rebuilt to use an optimized single data pipeline with Azure Document Intelligence and Azure OpenAI GPT-4o.

## Key Features of V2

1. **Intelligent Ingestion:** Users upload unstructured financial documents (PDFs, images, Excel). Azure Document Intelligence extracts tables, text, and layout information.
2. **"Voice-to-Insight" Field Notes:** Credit Officers can use the built-in browser microphone (Web Speech API) to dictate immediate field observations and risk constraints before analysis.
3. **Deep AI Underwriting:** Azure OpenAI (GPT-4o) processes the complete document context + officer notes. It returns a fully structured JSON response containing:
   - **Score & Grade:** 0-100 total score securely rounded.
   - **5 C's Analysis:** Character, Capacity, Capital, Collateral, and Conditions.
   - **Document Consistency Audit:** Cross-verifies PAN, GST turnover vs P&L revenue, and Director names across multiple documents. Highlights critical mismatches.
   - **Lending Recommendation:** Final go/no-go, suggested limits, and interest rates.
4. **Dynamic Recalculation:** Officers can iteratively add new insights and command the AI to re-evaluate the profile, instantly syncing the updated scores to the dashboard.

## System Architecture

The V2 architecture operates on a modern, decoupled pipeline:

- **Frontend:** Next.js 14, React Hook Form, TailwindCSS, `lucide-react` icons. Completely SSR/CSR optimized.
- **Backend:** Python FastAPI, asynchronous endpoints, SQLAlchemy 2.0.
- **Database:** PostgreSQL for structured data persistence (`applications`, `documents`, `analyses`).
- **AI Integrations:**
  - `@azure/ai-document-intelligence` for robust OCR.
  - `openai` python SDK pointing to Azure GPT-4o deployments.

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
