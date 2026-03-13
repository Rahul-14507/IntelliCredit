export type DocType = "ALM" | "Shareholding" | "Borrowing" | "AnnualReport" | "Portfolio";
export type Stage = "pending" | "onboarding" | "documents" | "schema" | "analysis" | "complete" | "completed";
export type Recommendation = "APPROVE" | "CONDITIONAL_APPROVE" | "REJECT";
export type Grade = "A" | "B" | "C" | "D";
export type Signal = "POSITIVE" | "NEUTRAL" | "NEGATIVE";

export interface Entity {
  id: string;
  company_name: string;
  cin: string | null;
  pan: string | null;
  sector: string | null;
  sub_sector: string | null;
  annual_turnover_cr: number | null;
  loan_type: string | null;
  loan_amount_cr: number;
  loan_tenure_months: number | null;
  loan_purpose: string | null;
  status: Stage;
  total_score?: number | null;
  requested_limit_crores?: number | null;
  recommended_action?: string | null;
  grade?: Grade | null;
  created_at: string;
}

export interface Document {
  id: string;
  entity_id: string;
  filename: string;
  file_size: number;
  extraction_status: "pending" | "extracting" | "done" | "error";
  predicted_doc_type: DocType | null;
  predicted_confidence: number | null;
  predicted_signals: string[] | null;
  confirmed_doc_type: DocType | null;
  classification_status: "pending" | "classified" | "confirmed" | "rejected";
  schema_fields: SchemaField[] | null;
  extracted_data: Record<string, any> | null;
  extraction_confidence: number | null;
  schema_status: "pending" | "extracting" | "done" | "error";
}

export interface SchemaField {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "table";
  include: boolean;
}

export interface ReasoningStep {
  step: number;
  factor: string;
  evidence: string;
  signal: Signal;
  impact: "HIGH" | "MEDIUM" | "LOW";
  weight: string;
}

export interface Analysis {
  entity_id: string;
  scores: { financial_health: number; asset_quality: number; governance: number; liquidity_alm: number; market_position: number; overall: number; };
  grade: Grade;
  recommendation: Recommendation;
  recommended_limit_cr: number;
  recommended_rate_pct: number;
  recommended_tenure_months: number;
  conditions: string[];
  reasoning_chain: ReasoningStep[];
  swot: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[]; };
  triangulation: Record<string, any>;
  key_risks: string[];
  mitigants: string[];
  news_results: ResearchResult[];
  legal_results: ResearchResult[];
  macro_results: ResearchResult[];
  sentiment: SentimentResult;
  executive_summary: string;
  analysis_status: "pending" | "running" | "done" | "error";
  research_status: "pending" | "running" | "done" | "error";
}

export interface ResearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published?: string;
  category: "news" | "legal" | "macro";
}

export interface SentimentResult {
  overall_sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  sentiment_score: number;
  positive_signals: string[];
  risk_signals: string[];
  red_flags: string[];
  legal_concerns: string[];
  sector_outlook: string;
  media_summary: string;
}

export interface DimensionScore {
  score: number;
  rationale: string;
}
export interface Director {
  name: string;
  designation: string;
}
