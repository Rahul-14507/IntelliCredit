"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Download,
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  FileText,
  Activity,
  Target,
  Info,
  RotateCcw,
  Plus,
  Minus,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

import {
  ApplicationDetail,
  getApplicationDetail,
  recalculateScore,
  getCAMUrl,
  UploadedDocument,
  getDocuments,
  getDocumentUrl,
} from "@/lib/api";
import ScoreRadar from "@/components/ScoreRadar";
import PromoterGraph from "@/components/PromoterGraph";
import DimensionBar from "@/components/DimensionBar";
import CounterfactualCard from "@/components/CounterfactualCard";
import LendingTermsCard from "@/components/LendingTermsCard";

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState("");
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);

  // Simulator State
  const [simDE, setSimDE] = useState<number>(0);
  const [simCR, setSimCR] = useState<number>(0);
  const [simEBITDA, setSimEBITDA] = useState<number>(0);
  const [simGrowth, setSimGrowth] = useState<number>(0);
  const [simICR, setSimICR] = useState<number>(0);

  const load = async () => {
    try {
      setLoading(true);
      const appData = await getApplicationDetail(id);
      setData(appData);

      // Initialize simulator values from actual metrics
      const metrics =
        appData.analysis.dimension_scores.financial_health?.key_metrics;
      if (metrics) {
        setSimDE(metrics.debt_to_equity || 0);
        setSimCR(metrics.current_ratio || 0);
        setSimEBITDA(metrics.ebitda_margin || 0);
        setSimGrowth(metrics.revenue_growth || 0);
        setSimICR(metrics.interest_coverage || 0);
      }
      // Fetch documents separately so a failure won't break the report
      try {
        const docs = await getDocuments(id);
        setDocuments(docs);
      } catch {
        setDocuments([]);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      await recalculateScore(id);
      await load();
    } catch (e: any) {
      alert(`Recalculation failed: ${e.message}`);
    } finally {
      setRecalculating(false);
    }
  };

  if (loading || recalculating) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <h2 className="text-xl font-semibold">
          {recalculating
            ? "Azure OpenAI is re-evaluating the credit profile..."
            : "Compiling Synthetic Underwriting Model..."}
        </h2>
      </div>
    );
  }

  if (error || !data || !data.analysis) {
    return (
      <div className="container mx-auto p-8 max-w-4xl text-center">
        <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-xl">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Loading Report</h2>
          <p>{error || "Analysis data not found."}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 underline"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const ans = data.analysis;
  const dims = ans.dimension_scores;

  const chartData = [
    { name: "Financial Health", score: dims.financial_health?.score || 0 },
    { name: "GST Consistency", score: dims.gst_consistency?.score || 0 },
    { name: "Promoter Risk", score: dims.promoter_risk?.score || 0 },
    { name: "Litigation/Reg.", score: dims.litigation_regulatory?.score || 0 },
    { name: "Linguistic Stress", score: dims.linguistic_stress?.score || 0 },
  ];

  const summaryScore = ans.scoring?.total_score || 0;
  const summaryGrade = ans.scoring?.grade || "D";
  const recAction = ans.scoring?.recommended_action || "Reject";

  const getGradeColor = (g: string) => {
    if (g === "A") return "bg-green-100 text-green-800";
    if (g === "B") return "bg-green-50 text-green-700";
    if (g === "C") return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const getActionColor = (a: string) => {
    if (a === "Approve") return "bg-green-600 hover:bg-green-700 text-white";
    if (a === "Reject") return "bg-red-600 hover:bg-red-700 text-white";
    return "bg-orange-600 hover:bg-orange-700 text-white";
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-12 font-sans">
      {/* HEADER */}
      <div className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4 max-w-7xl flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
                {ans.company_name}
              </h1>
              <div className="flex items-center text-sm font-medium text-slate-500 mt-0.5 space-x-3">
                <span className="flex items-center">
                  <FileText className="h-3.5 w-3.5 mr-1" /> CIN {data.cin}
                </span>
                <span className="flex items-center">
                  <TrendingUp className="h-3.5 w-3.5 mr-1" /> {data.industry}
                </span>
                <span className="flex items-center">
                  <IndianRupee className="h-3.5 w-3.5 mr-1" /> Req Limit ₹
                  {data.requested_limit_crores} Cr
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="flex-1 md:flex-none border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 text-sm font-semibold rounded-md flex items-center justify-center transition-colors"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Recalculate Score
            </button>
            <a
              href={getCAMUrl(id)}
              download
              className="flex-1 md:flex-none bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-sm font-semibold rounded-md flex items-center justify-center transition-colors shadow-sm"
            >
              <Download className="mr-2 h-4 w-4" /> Export CAM
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* TOP KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl border shadow-sm relative overflow-hidden group">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Overall Grade
            </p>
            <div className="flex items-end">
              <span className="text-4xl font-black">{summaryGrade}</span>
            </div>
            <div
              className={`absolute -right-4 -bottom-4 h-24 w-24 rounded-full opacity-20 transition-transform group-hover:scale-110 ${getGradeColor(summaryGrade)}`}
            ></div>
          </div>

          <div className="bg-white p-5 rounded-xl border shadow-sm relative overflow-hidden group">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Total Score
            </p>
            <div className="flex items-baseline space-x-1">
              <span className="text-4xl font-black text-slate-800">
                {summaryScore}
              </span>
              <span className="text-sm font-bold text-slate-400">/ 100</span>
            </div>
            <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full opacity-10 bg-blue-500 transition-transform group-hover:scale-110"></div>
          </div>

          <div className="bg-white p-5 rounded-xl border shadow-sm relative overflow-hidden group">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Rec. Limit
            </p>
            <div className="flex items-baseline space-x-1">
              <span className="text-4xl font-black text-slate-800">
                ₹{ans.lending_recommendation?.suggested_limit_crores}
              </span>
              <span className="text-sm font-bold text-slate-400">Cr</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border shadow-sm relative overflow-hidden group">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Pricing
            </p>
            <div className="flex items-baseline space-x-1">
              <span className="text-4xl font-black text-slate-800">
                {ans.lending_recommendation?.interest_rate_pct}%
              </span>
              <span className="text-sm font-bold text-slate-400">Yield</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Summary & Scorecard */}
          <div className="md:col-span-8 space-y-6">
            {/* EXECUTIVE SUMMARY */}
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center">
                <ShieldAlert className="h-4 w-4 mr-2" /> Executive Summary
              </h3>
              <p className="text-slate-700 leading-relaxed text-sm">
                {ans.analysis_summary}
              </p>
            </div>

            {/* AI SCORE BREAKDOWN (Recharts & Radar) */}
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-6 flex items-center">
                <Activity className="h-4 w-4 mr-2" /> Credit Profile Dimensions
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                {/* Bar Chart */}
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 0, left: -25, bottom: 20 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                      />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "#f8fafc" }}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                        {chartData.map((e, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              e.score >= 80
                                ? "#22c55e"
                                : e.score >= 60
                                  ? "#eab308"
                                  : "#f97316"
                            }
                          />
                        ))}
                        <LabelList
                          dataKey="score"
                          position="top"
                          style={{
                            fill: "#475569",
                            fontSize: 11,
                            fontWeight: "bold",
                          }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Radar Chart */}
                <ScoreRadar dimensions={dims} />
              </div>

              <div className="space-y-1">
                <DimensionBar
                  label="Financial Health"
                  desc="Assessment of profitability, leverage, and liquidity based on extracted tables"
                  data={dims.financial_health}
                />
                <DimensionBar
                  label="GST Consistency"
                  desc="Variance analysis between modeled revenue and reported figures"
                  data={dims.gst_consistency}
                />
                <DimensionBar
                  label="Promoter Risk"
                  desc="Director background analysis from provided documents"
                  data={dims.promoter_risk}
                />
                <DimensionBar
                  label="Litigation & Regulatory"
                  desc="Scanning documents for mentions of adverse events"
                  data={dims.litigation_regulatory}
                />
                <DimensionBar
                  label="Linguistic Stress"
                  desc="Textual analysis of tone, hedging, and uncertainty in management commentary"
                  data={dims.linguistic_stress}
                />
              </div>
            </div>

            {/* WHAT-IF SCENARIO SIMULATOR */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Target className="h-24 w-24 text-blue-900" />
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h3 className="text-lg font-black text-blue-900 flex items-center">
                    🎯 Scenario Simulator — Test Credit Conditions
                  </h3>
                  <p className="text-xs text-blue-700 font-medium">
                    Adjust financial levers to see real-time impact on scoring
                    and pricing.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const m =
                      ans.dimension_scores.financial_health?.key_metrics;
                    if (m) {
                      setSimDE(m.debt_to_equity || 0);
                      setSimCR(m.current_ratio || 0);
                      setSimEBITDA(m.ebitda_margin || 0);
                      setSimGrowth(m.revenue_growth || 0);
                      setSimICR(m.interest_coverage || 0);
                    }
                  }}
                  className="flex items-center text-xs font-bold text-blue-600 bg-white px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors shadow-sm"
                >
                  <RotateCcw className="h-3 w-3 mr-1.5" /> Reset to Actual
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sliders */}
                <div className="lg:col-span-7 space-y-5">
                  {[
                    {
                      label: "Debt/Equity",
                      val: simDE,
                      set: setSimDE,
                      min: 0.1,
                      max: 5.0,
                      step: 0.1,
                      suffix: "",
                      actual:
                        ans.dimension_scores.financial_health?.key_metrics
                          ?.debt_to_equity,
                    },
                    {
                      label: "Current Ratio",
                      val: simCR,
                      set: setSimCR,
                      min: 0.5,
                      max: 3.0,
                      step: 0.05,
                      suffix: "",
                      actual:
                        ans.dimension_scores.financial_health?.key_metrics
                          ?.current_ratio,
                    },
                    {
                      label: "EBITDA Margin",
                      val: simEBITDA,
                      set: setSimEBITDA,
                      min: 1,
                      max: 50,
                      step: 0.5,
                      suffix: "%",
                      actual:
                        ans.dimension_scores.financial_health?.key_metrics
                          ?.ebitda_margin,
                    },
                    {
                      label: "Revenue Growth",
                      val: simGrowth,
                      set: setSimGrowth,
                      min: -20,
                      max: 50,
                      step: 1,
                      suffix: "%",
                      actual:
                        ans.dimension_scores.financial_health?.key_metrics
                          ?.revenue_growth,
                    },
                    {
                      label: "Interest Coverage",
                      val: simICR,
                      set: setSimICR,
                      min: 0.5,
                      max: 15,
                      step: 0.1,
                      suffix: "x",
                      actual:
                        ans.dimension_scores.financial_health?.key_metrics
                          ?.interest_coverage,
                    },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                          {s.label}
                        </label>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase">
                            Actual: {s.actual}
                            {s.suffix}
                          </span>
                          <span className="text-sm font-black text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 shadow-sm">
                            {s.val}
                            {s.suffix}
                          </span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={s.min}
                        max={s.max}
                        step={s.step}
                        value={s.val}
                        onChange={(e) => s.set(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  ))}
                  <p className="flex items-center text-[10px] text-blue-500 font-medium italic mt-4">
                    <Info className="h-3 w-3 mr-1" /> Simulator uses extracted
                    financial values. Other dimensions held constant.
                  </p>
                </div>

                {/* Results Card */}
                <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-blue-100 shadow-xl flex flex-col justify-between">
                  {(() => {
                    // Internal Logic for Simulation
                    const sDE = (v: number) => {
                      if (v < 0.75) return 95;
                      if (v < 1.5) return 80;
                      if (v < 2.5) return 60;
                      if (v < 3.5) return 40;
                      return 20;
                    };
                    const sCR = (v: number) => {
                      if (v > 1.75) return 90;
                      if (v >= 1.5) return 75;
                      if (v >= 1.25) return 55;
                      if (v >= 1.0) return 35;
                      return 15;
                    };
                    const sEBITDA = (v: number) => {
                      if (v > 30) return 95;
                      if (v >= 20) return 80;
                      if (v >= 12) return 65;
                      if (v >= 5) return 40;
                      return 20;
                    };
                    const sGrowth = (v: number) => {
                      if (v > 20) return 95;
                      if (v >= 10) return 80;
                      if (v >= 5) return 65;
                      if (v >= 0) return 50;
                      return 20;
                    };
                    const sICR = (v: number) => {
                      if (v > 8) return 95;
                      if (v >= 5) return 80;
                      if (v >= 3) return 65;
                      if (v >= 1.5) return 45;
                      return 20;
                    };

                    const simFH =
                      sDE(simDE) * 0.25 +
                      sCR(simCR) * 0.2 +
                      sEBITDA(simEBITDA) * 0.25 +
                      sGrowth(simGrowth) * 0.15 +
                      sICR(simICR) * 0.15;

                    const weights = { gst: 0.2, pr: 0.2, lr: 0.15, ls: 0.15 };
                    const currentOverall =
                      simFH * 0.3 +
                      (dims.gst_consistency?.score || 0) * weights.gst +
                      (dims.promoter_risk?.score || 0) * weights.pr +
                      (dims.litigation_regulatory?.score || 0) * weights.lr +
                      (dims.linguistic_stress?.score || 0) * weights.ls +
                      (ans.scoring?.primary_insight_adjustment || 0);

                    const finalScore = Math.round(currentOverall);
                    const grade =
                      finalScore >= 80
                        ? "A"
                        : finalScore >= 65
                          ? "B"
                          : finalScore >= 50
                            ? "C"
                            : "D";
                    const rate = Math.min(
                      18,
                      9.5 + (100 - finalScore) * 0.08,
                    ).toFixed(2);
                    const delta = finalScore - (ans.scoring?.total_score || 0);

                    return (
                      <>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">
                            <span>Simulated Outcome</span>
                            <div
                              className={`flex items-center px-2 py-0.5 rounded text-[10px] ${delta >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                            >
                              {delta >= 0 ? (
                                <Plus className="h-2 w-2 mr-1" />
                              ) : (
                                <Minus className="h-2 w-2 mr-1" />
                              )}
                              {Math.abs(delta)} pts from actual
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase">
                                Simulated FH Score
                              </p>
                              <p className="text-xl font-black text-blue-600">
                                {Math.round(simFH)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase">
                                Overall Score
                              </p>
                              <div className="flex items-baseline space-x-2">
                                <span className="text-4xl font-black text-slate-900">
                                  {finalScore}
                                </span>
                                <span className="text-sm font-bold text-slate-300">
                                  / 100
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t mt-4">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                              Grade
                            </p>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-black ${getGradeColor(grade)}`}
                            >
                              {grade}
                            </span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                              Int. Rate
                            </p>
                            <span className="text-sm font-black text-slate-800">
                              {rate}%
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* STRENGTHS & RISKS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wide mb-4">
                  Strengths to Maintain
                </h3>
                <ul className="space-y-3">
                  {(ans.strengths || []).map((s, i) => (
                    <li
                      key={i}
                      className="flex items-start text-sm text-slate-700"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mr-2 mt-0.5 shrink-0" />{" "}
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <h3 className="text-sm font-bold text-rose-700 uppercase tracking-wide mb-4">
                  Key Risks Identified
                </h3>
                <ul className="space-y-3">
                  {(ans.risks || []).map((r, i) => (
                    <li
                      key={i}
                      className="flex items-start text-sm text-slate-700"
                    >
                      <AlertTriangle className="h-4 w-4 text-rose-500 mr-2 mt-0.5 shrink-0" />{" "}
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* MCA PROMOTER NETWORK */}
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center">
                <ShieldAlert className="h-4 w-4 mr-2" /> Director Network
                Extracted
              </h3>
              <PromoterGraph
                directors={ans.directors || []}
                companyName={ans.company_name}
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Decision, Terms & Target Fixes */}
          <div className="md:col-span-4 space-y-6">
            {/* UNDERWRITING DECISION */}
            <div className="bg-white border rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">
                System Recommendation
              </h3>

              <div
                className={`w-full py-4 text-center rounded-md font-black text-xl mb-4 tracking-tight shadow-sm ${getGradeColor(summaryGrade)}`}
              >
                {recAction.toUpperCase()}
              </div>

              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Based on the Five Cs framework, financial score weighting, and
                analysis of {ans.directors?.length || 0} extracted directors.
              </p>

              <button
                className={`w-full py-3 rounded-md font-bold text-sm shadow-md transition-all ${getActionColor(recAction)}`}
              >
                Confirm Decision
              </button>
              <button className="w-full mt-3 py-2 rounded-md font-semibold text-sm text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors">
                Apply Manual Override
              </button>
            </div>

            {/* LENDING TERMS */}
            <LendingTermsCard data={data} />

            {/* TARGETED FIXES */}
            <div className="bg-white border rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" /> Value-Add Opportunities
              </h3>
              <p className="text-xs text-slate-500 mb-4 pb-4 border-b">
                Actionable counterfactuals generated by Azure OpenAI to optimize
                the borrower's credit profile.
              </p>

              <div className="space-y-3">
                {(ans.counterfactuals || []).map((cf, i) => (
                  <CounterfactualCard key={i} cf={cf} />
                ))}
              </div>
            </div>

            {/* DATA QUALITY EXCLUSIONS */}
            {ans.data_quality_notes && ans.data_quality_notes.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wide mb-3 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" /> Epistemic Notes
                </h3>
                <ul className="space-y-2">
                  {ans.data_quality_notes.map((n, i) => (
                    <li key={i} className="text-xs text-amber-800 leading-snug">
                      • {n}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* UPLOADED DOCUMENTS */}
            <div className="bg-white border rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center">
                <FileText className="h-4 w-4 mr-2" /> Uploaded Documents
              </h3>
              {documents.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  No documents uploaded.
                </p>
              ) : (
                <ul className="space-y-2">
                  {documents.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex items-center min-w-0">
                        <FileText className="h-4 w-4 shrink-0 text-slate-400 mr-2" />
                        <a
                          href={getDocumentUrl(id, doc.filename)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate font-medium"
                          title={doc.filename}
                        >
                          {doc.filename}
                        </a>
                      </div>
                      <span
                        className={`ml-2 shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          doc.extraction_status === "done"
                            ? "bg-green-100 text-green-700"
                            : doc.extraction_status === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {doc.extraction_status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icon Imports fix
import { IndianRupee, Loader2 } from "lucide-react";
