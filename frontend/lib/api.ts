export interface Director {
  name: string;
  designation: string;
}

export interface DimensionScore {
  score: number;
  rationale: string;
  key_metrics?: Record<string, number>;
  sub_scores?: Record<string, number>;
  variance_detected?: number | null;
  severity?: string;
  directors_found?: number;
  flags?: string[];
  findings?: any[];
  stress_indicators?: string[];
  mda_found?: boolean;
}

export interface AnalysisResult {
  company_name: string;
  analysis_summary: string;
  extracted_financials: Record<string, number | string | null>;
  directors: Director[];
  dimension_scores: {
    financial_health: DimensionScore;
    gst_consistency: DimensionScore;
    promoter_risk: DimensionScore;
    litigation_regulatory: DimensionScore;
    linguistic_stress: DimensionScore;
  };
  five_cs: {
    character: string;
    capacity: string;
    capital: string;
    collateral: string;
    conditions: string;
  };
  scoring: {
    financial_health_weighted: number;
    gst_consistency_weighted: number;
    promoter_risk_weighted: number;
    litigation_weighted: number;
    linguistic_stress_weighted: number;
    primary_insight_adjustment: number;
    total_score: number;
    grade: string;
    recommended_action: string;
  };
  lending_recommendation: {
    suggested_limit_crores: number;
    interest_rate_pct: number;
    suggested_tenure_months: number;
    security_cover_ratio: number;
    conditions: string[];
  };
  counterfactuals: {
    rank: number;
    dimension: string;
    current_score: number;
    improved_score: number;
    current_overall: number;
    improved_overall: number;
    action: string;
    ease: string;
  }[];
  strengths: string[];
  risks: string[];
  data_quality_notes: string[];
  field_observations?: string[];
}

export interface ApplicationSummary {
  id: string;
  company_name: string;
  cin: string;
  requested_limit_crores: number;
  status: string;
  total_score?: number;
  grade?: string;
  recommended_action?: string;
  created_at: string;
}

export interface ApplicationDetail {
  id: string;
  company_name: string;
  cin: string;
  industry: string;
  requested_limit_crores: number;
  status: string;
  created_at: string;
  analysis?: AnalysisResult;
}

export interface UploadResult {
  application_id: string;
  documents_processed: number;
  total_text_length: number;
  extraction_statuses: { filename: string; status: string; length: number }[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function createApplication(data: {
  company_name: string;
  cin: string;
  industry: string;
  requested_limit_crores: number;
}): Promise<{ id: string; status: string }> {
  const res = await fetch(`${API_URL}/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create application");
  return res.json();
}

export async function uploadDocuments(
  application_id: string,
  files: File[],
): Promise<UploadResult> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const res = await fetch(`${API_URL}/ingest/${application_id}/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload/extract documents");
  return res.json();
}

export async function runAnalysis(
  application_id: string,
  insights?: { officer_name?: string; primary_insights_text?: string },
): Promise<AnalysisResult> {
  const res = await fetch(`${API_URL}/analyze/${application_id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(insights || {}),
  });
  if (!res.ok) throw new Error("Analysis failed");
  return res.json();
}

export async function recalculateScore(
  id: string,
  newInsight?: string,
): Promise<AnalysisResult> {
  const res = await fetch(`${API_URL}/analyze/${id}/recalculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ primary_insights_text: newInsight }),
  });
  if (!res.ok) throw new Error("Recalculation failed");
  return res.json();
}

export async function getApplications(): Promise<ApplicationSummary[]> {
  const res = await fetch(`${API_URL}/applications`);
  if (!res.ok) throw new Error("Failed to fetch applications");
  return res.json();
}

export async function getApplicationDetail(
  id: string,
): Promise<ApplicationDetail> {
  const res = await fetch(`${API_URL}/applications/${id}`);
  if (!res.ok) throw new Error("Failed to fetch application detail");
  return res.json();
}

export interface UploadedDocument {
  id: string;
  filename: string;
  extraction_status: string;
  created_at: string;
}

export async function getDocuments(
  application_id: string,
): Promise<UploadedDocument[]> {
  const res = await fetch(
    `${API_URL}/applications/${application_id}/documents`,
  );
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
}

export function getDocumentUrl(
  application_id: string,
  filename: string,
): string {
  return `${API_URL}/applications/${application_id}/documents/${encodeURIComponent(filename)}`;
}

export async function deleteApplication(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/applications/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete application");
}

export function getCAMUrl(id: string): string {
  return `${API_URL}/export/${id}/cam`;
}
