import json
from services.azure_openai import call_gpt4o

ANALYSIS_PROMPT = """You are a senior credit committee member at a leading Indian commercial bank.
Perform a complete investment-grade credit assessment for a loan application.

═══════════════════════════════════════════
ENTITY PROFILE
═══════════════════════════════════════════
Company:        {company_name}
CIN:            {cin}
Sector:         {sector} / {sub_sector}
Est. Turnover:  ₹{turnover} Cr
Credit Rating:  {credit_rating}

LOAN REQUEST
Type:           {loan_type}
Amount:         ₹{loan_amount} Cr
Tenure:         {tenure} months
Purpose:        {loan_purpose}
Collateral:     {collateral}

═══════════════════════════════════════════
EXTRACTED DOCUMENT DATA
═══════════════════════════════════════════
{extracted_data}

═══════════════════════════════════════════
SECONDARY RESEARCH (Tavily)
═══════════════════════════════════════════
Sentiment:      {sentiment_overall} (score: {sentiment_score})
Positive:       {positive_signals}
Risk Signals:   {risk_signals}
Red Flags:      {red_flags}
Legal Concerns: {legal_concerns}
Sector Outlook: {sector_outlook}
═══════════════════════════════════════════

Provide your complete credit assessment. Respond ONLY in JSON:

{{
  "scores": {{
    "financial_health":   0-100,
    "asset_quality":      0-100,
    "governance":         0-100,
    "liquidity_alm":      0-100,
    "market_position":    0-100,
    "overall":            0-100
  }},
  "score_rationale": {{
    "financial_health":   "2 sentence rationale",
    "asset_quality":      "2 sentence rationale",
    "governance":         "2 sentence rationale",
    "liquidity_alm":      "2 sentence rationale",
    "market_position":    "2 sentence rationale"
  }},
  "grade":            "A|B|C|D",
  "recommendation":   "APPROVE|CONDITIONAL_APPROVE|REJECT",
  "recommended_limit_cr":      number,
  "recommended_rate_pct":      number,
  "recommended_tenure_months": number,
  "conditions": [
    "Condition 1 if any",
    "Condition 2 if any"
  ],

  "reasoning_chain": [
    {{
      "step":     1,
      "factor":   "Financial Health",
      "evidence": "Specific numbers and findings from the documents",
      "signal":   "POSITIVE|NEUTRAL|NEGATIVE",
      "impact":   "HIGH|MEDIUM|LOW",
      "weight":   "30%"
    }},
    {{
      "step":     2,
      "factor":   "Asset Quality & Portfolio",
      "evidence": "...",
      "signal":   "...",
      "impact":   "...",
      "weight":   "20%"
    }},
    {{
      "step":     3,
      "factor":   "Governance & Shareholding",
      "evidence": "...",
      "signal":   "...",
      "impact":   "...",
      "weight":   "20%"
    }},
    {{
      "step":     4,
      "factor":   "Liquidity & ALM",
      "evidence": "...",
      "signal":   "...",
      "impact":   "...",
      "weight":   "15%"
    }},
    {{
      "step":     5,
      "factor":   "Market Position & Sector",
      "evidence": "...",
      "signal":   "...",
      "impact":   "...",
      "weight":   "15%"
    }},
    {{
      "step":     6,
      "factor":   "External Research & Red Flags",
      "evidence": "Summarise Tavily findings that affected the score",
      "signal":   "...",
      "impact":   "...",
      "weight":   "overlay"
    }},
    {{
      "step":     7,
      "factor":   "Cross-Document Triangulation",
      "evidence": "Consistency or inconsistency found across ALM, Annual Report, Borrowing",
      "signal":   "...",
      "impact":   "...",
      "weight":   "overlay"
    }}
  ],

  "swot": {{
    "strengths":     ["S1", "S2", "S3", "S4"],
    "weaknesses":    ["W1", "W2", "W3"],
    "opportunities": ["O1", "O2", "O3"],
    "threats":       ["T1", "T2", "T3"]
  }},

  "triangulation": {{
    "revenue_consistency":      "Annual report revenue vs ALM asset size vs Portfolio AUM — consistent/variance",
    "debt_consistency":         "Borrowing profile total vs Balance sheet debt — consistent/variance",
    "npa_commentary_alignment": "Portfolio NPA data vs management commentary tone — aligned/misaligned",
    "shareholding_governance":  "Promoter pledging level vs governance risk assessment",
    "overall_consistency_score": 0-100,
    "inconsistencies":          ["any inconsistency found, or empty list"]
  }},

  "key_risks":  ["risk1", "risk2", "risk3", "risk4", "risk5"],
  "mitigants":  ["mitigant1", "mitigant2", "mitigant3"],

  "executive_summary": "4–5 sentence credit committee summary covering the entity profile, key financial strengths and weaknesses, primary risk factors, external research signals, and the final recommendation with justification."
}}"""


async def analyze_entity(entity, all_extracted: list, research: dict) -> dict:
    # Flatten extracted data across all documents
    extracted_summary = ""
    for doc in all_extracted:
        extracted_summary += f"\n[{doc['doc_type']} — {doc['filename']}]\n"
        if doc.get("extracted"):
            for k, v in doc["extracted"].items():
                if not k.startswith("_") and v is not None:
                    extracted_summary += f"  {k}: {v}\n"

    sentiment = research.get("sentiment", {})
    prompt = ANALYSIS_PROMPT.format(
        company_name     = entity.company_name,
        cin              = entity.cin or "N/A",
        sector           = entity.sector or "N/A",
        sub_sector       = entity.sub_sector or "N/A",
        turnover         = entity.annual_turnover_cr or "N/A",
        credit_rating    = entity.credit_rating or "Unrated",
        loan_type        = entity.loan_type or "Term Loan",
        loan_amount      = entity.loan_amount_cr,
        tenure           = entity.loan_tenure_months or "N/A",
        loan_purpose     = entity.loan_purpose or "N/A",
        collateral       = entity.collateral or "N/A",
        extracted_data   = extracted_summary[:5000],
        sentiment_overall = sentiment.get("overall_sentiment", "N/A"),
        sentiment_score  = sentiment.get("sentiment_score", 0),
        positive_signals = str(sentiment.get("positive_signals", [])),
        risk_signals     = str(sentiment.get("risk_signals", [])),
        red_flags        = str(sentiment.get("red_flags", [])),
        legal_concerns   = str(sentiment.get("legal_concerns", [])),
        sector_outlook   = sentiment.get("sector_outlook", "N/A"),
    )

    result = await call_gpt4o(prompt, max_tokens=3000)
    return json.loads(result)
