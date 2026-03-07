import json
import logging
from openai import AsyncAzureOpenAI
from backend.config import settings

logger = logging.getLogger(__name__)

demo_json = {
  "company_name": "Pujari Industries Private Limited",
  "analysis_summary": "Pujari Industries exhibits robust financial health with strong EBITDA margins and low leverage. GST compliance is highly consistent with minimal discrepancies. Promoter background shows a solid track record, though one director has a past association with a struck-off entity. Overall, the credit profile is very strong, meriting approval.",
  "extracted_financials": {
    "revenue_fy23_crores": 47.20,
    "revenue_fy22_crores": 37.16,
    "ebitda_fy23_crores": 16.57,
    "ebitda_margin_pct": 35.1,
    "net_profit_fy23_crores": 8.40,
    "total_debt_crores": 21.80,
    "net_worth_crores": 32.50,
    "debt_to_equity": 0.67,
    "current_ratio": 1.58,
    "interest_coverage": 10.15,
    "revenue_growth_pct": 27.0,
    "currency_unit": "Crores"
  },
  "directors": [
    {"name": "Rahul Pujari", "designation": "Chairman & MD"},
    {"name": "Anjali Sharma", "designation": "Director Finance"},
    {"name": "Mukesh Verma", "designation": "Non-Executive Director"},
    {"name": "Divya Rao", "designation": "Independent Director"}
  ],
  "dimension_scores": {
    "financial_health": {
      "score": 91,
      "rationale": "Exceptional interest coverage at 10.15x and strong EBITDA margins of 35.1%. Debt-to-equity is very comfortable at 0.67.",
      "key_metrics": {"debt_to_equity": 0.67, "current_ratio": 1.58, "ebitda_margin": 35.1, "interest_coverage": 10.15, "revenue_growth": 27.0},
      "sub_scores": {
        "debt_to_equity_score": 95,
        "current_ratio_score": 75,
        "ebitda_margin_score": 95,
        "revenue_growth_score": 95,
        "interest_coverage_score": 95
      }
    },
    "gst_consistency": {
      "score": 92,
      "rationale": "High consistency across filings with only a minor 3.2% discrepancy detected in recent months.",
      "variance_detected": 3.2,
      "severity": "LOW"
    },
    "promoter_risk": {
      "score": 75,
      "rationale": "Management has strong experience, but the score is moderated due to Mukesh Verma's reported association with a struck-off entity.",
      "directors_found": 4,
      "flags": ["Director associated with struck-off entity"]
    },
    "litigation_regulatory": {
      "score": 90,
      "rationale": "No significant litigation found in documents. 10-point epistemic penalty applied as required.",
      "findings": []
    },
    "linguistic_stress": {
      "score": 68,
      "rationale": "MDA language indicates confidence but acknowledges supply chain risks and increased material costs with hedging mentioned.",
      "stress_indicators": ["supply chain risks", "increased material costs"],
      "mda_found": True
    }
  },
  "five_cs": {
    "character": "Promoters demonstrate a strong track record of governance with long-standing industry presence. The presence of independent directors provides good oversight.",
    "capacity": "Strong EBITDA generation and solid interest coverage ratio indicate robust capacity to service debt obligations from internal accruals.",
    "capital": "The company has a solid equity base with a net worth of ₹32.50 Cr, providing an adequate financial cushion.",
    "collateral": "Collateral details are not extensively specified in the provided documents.",
    "conditions": "The manufacturing sector shows positive trends, though supply chain headwinds remain a macro risk."
  },
  "scoring": {
    "financial_health_weighted": 27.3,
    "gst_consistency_weighted": 18.4,
    "promoter_risk_weighted": 15.0,
    "litigation_weighted": 13.5,
    "linguistic_stress_weighted": 10.2,
    "primary_insight_adjustment": 0,
    "total_score": 84,
    "grade": "A",
    "recommended_action": "Approve"
  },
  "lending_recommendation": {
    "suggested_limit_crores": 1.0,
    "interest_rate_pct": 10.78,
    "suggested_tenure_months": 60,
    "security_cover_ratio": 1.25,
    "conditions": ["Quarterly submission of stock statements", "Annual review of insurance policies"]
  },
  "counterfactuals": [
    {
      "rank": 1,
      "dimension": "Linguistic Stress",
      "current_score": 68,
      "improved_score": 85,
      "current_overall": 84,
      "improved_overall": 87,
      "action": "Clarify mitigation strategies for supply chain risks in management commentary to reduce perceived uncertainty.",
      "ease": "Medium"
    },
    {
      "rank": 2,
      "dimension": "Promoter Risk",
      "current_score": 75,
      "improved_score": 90,
      "current_overall": 84,
      "improved_overall": 87,
      "action": "Provide clarification or seek removal regarding the director's association with the struck-off entity.",
      "ease": "Hard"
    },
    {
      "rank": 3,
      "dimension": "Financial Health",
      "current_score": 91,
      "improved_score": 95,
      "current_overall": 84,
      "improved_overall": 85,
      "action": "Improve current ratio from 1.58 to >1.75 through better working capital management.",
      "ease": "Medium"
    }
  ],
  "strengths": [
    "Excellent interest coverage ratio of 10.15x",
    "Strong EBITDA margin of 35.1%",
    "Low leverage with Debt-to-Equity at 0.67"
  ],
  "risks": [
    "Director Mukesh Verma associated with a struck-off entity",
    "Supply chain constraint risks noted in MDA",
    "Current ratio of 1.58 is adequate but leaves room for improvement"
  ],
  "document_consistency": {
    "overall_consistency_score": 95,
    "checks_performed": [
      {
        "check_name": "Revenue Consistency",
        "document_a": "FY23 P&L",
        "document_b": "GSTR-3B Summary",
        "value_a": "₹47.20 Cr",
        "value_b": "₹46.85 Cr",
        "variance_pct": 0.74,
        "status": "CONSISTENT",
        "flag": None
      },
      {
        "check_name": "Director Consistency",
        "document_a": "MCA COI",
        "document_b": "Board Resolution",
        "value_a": "Rahul Pujari, Anjali Sharma",
        "value_b": "Rahul Pujari, Anjali Sharma",
        "variance_pct": None,
        "status": "CONSISTENT",
        "flag": None
      },
      {
        "check_name": "Debt Consistency",
        "document_a": "Balance Sheet",
        "document_b": "Sanction Letter",
        "value_a": "₹21.80 Cr",
        "value_b": "₹21.80 Cr",
        "variance_pct": 0,
        "status": "CONSISTENT",
        "flag": None
      }
    ],
    "red_flags": [],
    "summary": "High degree of consistency observed between tax filings and audited financials."
  },
  "data_quality_notes": [
    "No live eCourts or MCA data pulled; analysis relies exclusively on uploaded documents."
  ]
}

SYSTEM_PROMPT = """You are an expert Indian corporate credit analyst with 20 years of experience at a leading PSU bank. 
You have deep knowledge of RBI guidelines, Indian accounting standards (Ind AS), GST framework, 
MCA compliance, and the Five Cs of credit analysis. You always ground your analysis strictly 
in the data provided — you never invent numbers. If a metric is not present in the documents, 
you state "Not available in provided documents" rather than guessing."""

def create_user_prompt(company_name, cin, industry, requested_limit_crores, master_text, primary_insights):
    return f"""Analyze the following corporate credit application and return a comprehensive credit assessment.

COMPANY: {company_name}
CIN: {cin}
INDUSTRY: {industry}
REQUESTED LOAN LIMIT: ₹{requested_limit_crores} Crore

EXTRACTED DOCUMENT TEXT:
{master_text}

CREDIT OFFICER PRIMARY INSIGHTS:
{primary_insights if primary_insights else "None provided"}

Perform a complete Five Cs credit analysis and return ONLY a valid JSON object with EXACTLY 
this structure. No preamble, no explanation, no markdown — just the JSON:

{{
  "company_name": "string",
  "analysis_summary": "3-4 sentence executive summary of the credit profile",
  
  "extracted_financials": {{
    "revenue_fy23_crores": number or null,
    "revenue_fy22_crores": number or null,
    "ebitda_fy23_crores": number or null,
    "ebitda_margin_pct": number or null,
    "net_profit_fy23_crores": number or null,
    "total_debt_crores": number or null,
    "net_worth_crores": number or null,
    "debt_to_equity": number or null,
    "current_ratio": number or null,
    "interest_coverage": number or null,
    "revenue_growth_pct": number or null,
    "currency_unit": "Crores or Lakhs — whichever is used in the document"
  }},

  "directors": [
    {{"name": "string", "designation": "string"}}
  ],

  "dimension_scores": {{
    "financial_health": {{
      "score": integer 0-100,
      "rationale": "2-3 sentences explaining this specific score based on actual numbers found",
      "key_metrics": {{"debt_to_equity": number, "current_ratio": number, "ebitda_margin": number, "interest_coverage": number, "revenue_growth": number}},
      "sub_scores": {{
        "debt_to_equity_score": integer,
        "current_ratio_score": integer,
        "ebitda_margin_score": integer,
        "revenue_growth_score": integer,
        "interest_coverage_score": integer
      }}
    }},
    "gst_consistency": {{
      "score": integer 0-100,
      "rationale": "2-3 sentences. If no GST data in documents, say so and assign 65 as neutral baseline.",
      "variance_detected": number or null,
      "severity": "NONE or LOW or MEDIUM or HIGH"
    }},
    "promoter_risk": {{
      "score": integer 0-100,
      "rationale": "2-3 sentences based on director background info found in documents",
      "directors_found": integer,
      "flags": []
    }},
    "litigation_regulatory": {{
      "score": integer 0-100,
      "rationale": "2-3 sentences. Note: web research not performed — score based on document content only. Apply 10-point epistemic penalty.",
      "findings": []
    }},
    "linguistic_stress": {{
      "score": integer 0-100,
      "rationale": "2-3 sentences. If no MDA/narrative text found, assign 65 as neutral baseline and say so.",
      "stress_indicators": [],
      "mda_found": boolean
    }}
  }},

  "five_cs": {{
    "character": "2-3 sentences about management quality, track record, governance",
    "capacity": "2-3 sentences about ability to repay from cash flows",
    "capital": "2-3 sentences about net worth, equity base, financial cushion",
    "collateral": "2-3 sentences — note if collateral details not in documents",
    "conditions": "2-3 sentences about industry conditions, macro environment"
  }},

  "scoring": {{
    "financial_health_weighted": number,
    "gst_consistency_weighted": number,
    "promoter_risk_weighted": number,
    "litigation_weighted": number,
    "linguistic_stress_weighted": number,
    "primary_insight_adjustment": number between -20 and 20,
    "total_score": integer 0-100,
    "grade": "A or B or C or D",
    "recommended_action": "Approve or Conditional Approve or Reject"
  }},

  "lending_recommendation": {{
    "suggested_limit_crores": number,
    "interest_rate_pct": number,
    "suggested_tenure_months": integer,
    "security_cover_ratio": number,
    "conditions": ["list of any conditions attached to the approval"]
  }},

  "counterfactuals": [
    {{
      "rank": 1,
      "dimension": "the dimension with worst score",
      "current_score": integer,
      "improved_score": integer,
      "current_overall": integer,
      "improved_overall": integer,
      "action": "Specific, actionable improvement referencing actual numbers from the documents",
      "ease": "Easy or Medium or Hard"
    }}
  ],

  "strengths": [
    "Specific strength with actual numbers from the documents — never generic"
  ],

  "risks": [
    "Specific risk with actual numbers from the documents — never generic"
  ],

  "data_quality_notes": [
    "Note any important data that was missing or unclear in the uploaded documents"
  ],
  "document_consistency": {
    "overall_consistency_score": integer 0-100,
    "checks_performed": [
      {
        "check_name": "string",
        "document_a": "string",
        "document_b": "string", 
        "value_a": "string",
        "value_b": "string",
        "variance_pct": number or null,
        "status": "CONSISTENT or MINOR_VARIANCE or MAJOR_VARIANCE or UNABLE_TO_CHECK",
        "flag": "string explanation if variance detected"
      }
    ],
    "red_flags": ["list of serious inconsistencies only"],
    "summary": "1-2 sentences"
  },
  "field_observations": [
    "List of any site visit or field observations provided by the officer"
  ]
}}

SCORING RULES YOU MUST FOLLOW:
- Financial Health weight: 30%. Score using: D/E (<0.75→95, 0.75-1.5→80, 1.5-2.5→60, 2.5-3.5→40, >3.5→20), Current Ratio (>1.75→90, 1.5-1.75→75, 1.25-1.5→55, 1.0-1.25→35, <1.0→15), EBITDA Margin (>30%→95, 20-30%→80, 12-20%→65, 5-12%→40, <5%→20), Revenue Growth (>20%→95, 10-20%→80, 5-10%→65, 0-5%→50, negative→20), Interest Coverage (>8x→95, 5-8x→80, 3-5x→65, 1.5-3x→45, <1.5x→20). Average these 5 sub-scores for financial_health score.
- GST Consistency weight: 20%. If no GST data present: score=65. If present: start 100, deduct per severity (LOW: -8, MEDIUM: -20, HIGH: -40).
- Promoter Risk weight: 20%. Base 85 when only document data available (no live MCA). Adjust up/down based on director count, background info found in documents. Range: 70-90.
- Litigation/Regulatory weight: 15%. Base 100, always deduct 10 for epistemic uncertainty (no live eCourts). Further deduct if any litigation mentioned in documents.
- Linguistic Stress weight: 15%. If no MDA found: score=65. If MDA present: analyze hedging language, negative financial words, uncertainty markers. Range: 40-85.
- Total score = (FH×0.30) + (GST×0.20) + (PR×0.20) + (LR×0.15) + (LS×0.15) + primary_insight_adjustment
- Grade: A=80-100, B=65-79, C=50-64, D=<50
- Recommended action: A/B=Approve, C=Conditional Approve, D=Reject
- Suggested limit: if Approve → min(requested, net_worth×2.5), if Conditional → min(requested×0.6, net_worth×1.5), if Reject → 0. All in Crores.
- Interest rate: 9.5 + (100 - total_score) × 0.08. Cap at 18.
- Security cover ratio: always 1.25 for Approve, 1.5 for Conditional
- Counterfactuals: generate exactly 3, targeting the 3 lowest-scoring dimensions. Each must reference actual numbers from the documents.
- Strengths: generate exactly 3, each with a specific number from the document.
- Risks: generate exactly 3, each specific.
- DOCUMENT CONSISTENCY CHECKS — perform all of these cross-document verifications:
  1. Revenue Consistency: Compare revenue declared in annual report/P&L vs revenue implied by total GST taxable turnover (multiply monthly average by 12). Flag if variance > 10%.
  2. Director Consistency: Check if director names mentioned in different documents match each other. Flag any name appearing in one document but not another.
  3. Debt Consistency: Compare total debt in balance sheet vs loan amounts mentioned in banking details or sanction letters. Flag if variance > 5%.
  4. Profit Consistency: Check if net profit in P&L is consistent with retained earnings movement in balance sheet. Flag if inconsistent.
  5. If any check cannot be performed because relevant documents were not uploaded, mark status as UNABLE_TO_CHECK.
- For overall_consistency_score: start 100, deduct 15 per MAJOR_VARIANCE, 5 per MINOR_VARIANCE.
"""

def extract_json(rs):
    try:
        if "```json" in rs:
            return json.loads(rs.split("```json")[1].split("```")[0].strip())
        elif "```" in rs:
            return json.loads(rs.split("```")[1].split("```")[0].strip())
        else:
            return json.loads(rs.strip())
    except json.JSONDecodeError:
        return None

async def analyze_credit(
    master_text: str,
    company_name: str,
    cin: str,
    industry: str,
    requested_limit_crores: float,
    primary_insights: str = ""
) -> dict:
    if settings.DEMO_MODE:
        logger.info("DEMO_MODE is TRUE. Returning mock data.")
        return demo_json

    if not settings.AZURE_OPENAI_API_KEY or not settings.AZURE_OPENAI_ENDPOINT:
        logger.error("Azure OpenAI API keys not found.")
        raise ValueError("Missing Azure OpenAI credentials")

    client = AsyncAzureOpenAI(
        api_key=settings.AZURE_OPENAI_API_KEY,
        api_version=settings.AZURE_OPENAI_API_VERSION,
        azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
    )
    
    prompt = create_user_prompt(company_name, cin, industry, requested_limit_crores, master_text, primary_insights)
    
    try:
        response = await client.chat.completions.create(
            model=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=4000
        )
        
        reply = response.choices[0].message.content
        parsed = extract_json(reply)
        
        if not parsed:
            logger.warning("Failed to parse JSON on first attempt. Retrying with explicit JSON format request...")
            retry_prompt = f"The following string is a markdown response that contains JSON. Extract ONLY the valid JSON object without any preamble or markdown formatting: \\n\\n {reply}"
            response2 = await client.chat.completions.create(
                model=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
                messages=[{"role": "user", "content": retry_prompt}],
                temperature=0.0
            )
            parsed = extract_json(response2.choices[0].message.content)
            
        if not parsed:
            raise ValueError(f"Could not parse valid JSON from AI response: {reply}")
            
        return parsed
    except Exception as e:
        logger.error(f"Error calling Azure OpenAI: {str(e)}")
        raise e
