"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { getEntity, getAnalysis, getAnalysisStatus, runResearch, runAnalysis, exportDocx } from "@/lib/api";
import { Entity, Analysis } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Download, AlertTriangle, CheckCircle2, XCircle, ExternalLink, Info } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

export default function ReportPage() {
  const { id } = useParams();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [status, setStatus] = useState({ research_status: "pending", analysis_status: "pending" });
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const s: any = await getAnalysisStatus(id as string);
      setStatus(s);
      if (s.analysis_status === "done") {
        const a: any = await getAnalysis(id as string);
        setAnalysis(a);
      }
    } catch (e) { console.error(e); }
  }, [id]);

  useEffect(() => {
    const init = async () => {
      try {
        const ent: any = await getEntity(id as string);
        setEntity(ent);
        const s: any = await getAnalysisStatus(id as string);
        setStatus(s);

        if (s.research_status === "not_started" || s.research_status === "pending") {
          await runResearch(id as string);
          setTimeout(() => runAnalysis(id as string), 2000);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    init();
  }, [id]);

  useEffect(() => {
    if (status.analysis_status !== "done" && status.analysis_status !== "error") {
      const interval = setInterval(fetchStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [status.analysis_status, fetchStatus]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  const getRadarData = () => {
    if (!analysis?.scores) return [];
    return [
      { subject: 'Financial', A: analysis.scores.financial_health, fullMark: 100 },
      { subject: 'Assets', A: analysis.scores.asset_quality, fullMark: 100 },
      { subject: 'Gov', A: analysis.scores.governance, fullMark: 100 },
      { subject: 'Liquidity', A: analysis.scores.liquidity_alm, fullMark: 100 },
      { subject: 'Market', A: analysis.scores.market_position, fullMark: 100 },
    ];
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-8">
      {/* Status Banner */}
      {status.analysis_status !== "done" && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6 text-center">
            <Loader2 className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-blue-900">Credit Committee is Reviewing...</h2>
            <p className="text-blue-700 text-sm mb-4">
               {status.research_status === "running" ? "Gathering secondary research from Tavily..." : "Running GPT-4o Credit Reasoning Engine..."}
            </p>
            <Progress value={status.research_status === "done" ? 60 : 20} className="max-w-md mx-auto" />
          </CardContent>
        </Card>
      )}

      {analysis && (
        <>
          {/* Decision Header */}
          <div className={`p-6 rounded-xl border-l-8 flex justify-between items-center shadow-lg ${
            analysis.recommendation === "APPROVE" ? "bg-green-50 border-green-500 text-green-900" :
            analysis.recommendation === "CONDITIONAL_APPROVE" ? "bg-amber-50 border-amber-500 text-amber-900" :
            "bg-red-50 border-red-500 text-red-900"
          }`}>
            <div>
                <Badge variant="outline" className="mb-2 uppercase tracking-widest">{analysis.grade} GRADE</Badge>
                <h1 className="text-4xl font-extrabold flex items-center gap-3">
                    {analysis.recommendation === "APPROVE" && <CheckCircle2 className="h-10 w-10 text-green-600" />}
                    {analysis.recommendation === "CONDITIONAL_APPROVE" && <Info className="h-10 w-10 text-amber-600" />}
                    {analysis.recommendation === "REJECT" && <XCircle className="h-10 w-10 text-red-600" />}
                    {analysis.recommendation?.replace("_", " ")}
                </h1>
                <p className="mt-2 text-lg opacity-80">Recommended Limit: <span className="font-bold">₹{analysis.recommended_limit_cr} Cr</span> at {analysis.recommended_rate_pct}%</p>
            </div>
            <Button size="lg" className="h-16 px-8 gap-2 bg-slate-900" onClick={() => window.open(exportDocx(id as string))}>
                <Download className="h-5 w-5" /> Download Docx Report
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Score & Rationale */}
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader><CardTitle>Executive Summary</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-lg leading-relaxed text-slate-700">{analysis.executive_summary}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Reasoning Intelligence</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        {analysis.reasoning_chain?.map((step, idx) => (
                            <div key={idx} className="flex gap-4 border-l-2 border-slate-200 pl-6 relative">
                                <div className="absolute -left-3 top-0 h-6 w-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px]">{step.step}</div>
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <h4 className="font-bold">{step.factor}</h4>
                                        <Badge variant={step.signal === "POSITIVE" ? "default" : step.signal === "NEGATIVE" ? "destructive" : "secondary"}>
                                            {step.signal}
                                        </Badge>
                                    </div>
                                    <p className="text-sm mt-1 text-slate-600">{step.evidence}</p>
                                    <div className="flex gap-4 mt-2 text-[10px] uppercase font-bold text-slate-400">
                                         <span>Impact: {step.impact}</span>
                                        <span>Weight: {step.weight}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-green-50/30">
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Strengths</CardTitle></CardHeader>
                        <CardContent>
                            <ul className="text-xs space-y-1 list-disc pl-4">
                                {analysis.swot?.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                            </ul>
                        </CardContent>
                    </Card>
                     <Card className="bg-red-50/30">
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Weaknesses</CardTitle></CardHeader>
                        <CardContent>
                            <ul className="text-xs space-y-1 list-disc pl-4">
                                {analysis.swot?.weaknesses.map((s: string, i: number) => <li key={i}>{s}</li>)}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Right: Scores & Research */}
            <div className="space-y-8">
                <Card>
                    <CardHeader><CardTitle>Scoring Matrix</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getRadarData()}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" fontSize={12} />
                                    <Radar name="IntelliCredit" dataKey="A" stroke="#0f172a" fill="#0f172a" fillOpacity={0.5} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="text-center mt-4">
                            <p className="text-3xl font-black text-slate-900">{analysis.scores?.overall}/100</p>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Overall Risk Score</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-900/10">
                    <CardHeader className="bg-slate-900 text-white rounded-t-lg py-4">
                        <CardTitle className="text-md flex items-center gap-2">
                           <Info className="h-4 w-4" /> Secondary Research
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 px-2">
                        <div className="space-y-4">
                            <div className="px-2">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Sentiment Meter</p>
                                <div className="flex items-center gap-2">
                                    <Badge className={`${analysis.sentiment?.overall_sentiment === 'POSITIVE' ? 'bg-green-500' : analysis.sentiment?.overall_sentiment === 'NEGATIVE' ? 'bg-red-500' : 'bg-slate-500'}`}>
                                        {analysis.sentiment?.overall_sentiment}
                                    </Badge>
                                    <Progress value={(analysis.sentiment?.sentiment_score || 0) * 100 + 50} className="h-1 flex-1" />
                                </div>
                            </div>

                            {analysis.sentiment?.red_flags.length > 0 && (
                                <div className="bg-red-50 border border-red-100 p-3 rounded-md mx-2">
                                    <h5 className="text-[10px] font-bold text-red-700 uppercase flex items-center gap-1 mb-1">
                                        <AlertTriangle className="h-3 w-3" /> Critical Red Flags
                                    </h5>
                                    <ul className="text-xs text-red-900 space-y-1">
                                        {analysis.sentiment?.red_flags.map((f, i) => <li key={i}>• {f}</li>)}
                                    </ul>
                                </div>
                            )}

                            <div className="space-y-2 px-2">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Top News Matches (Tavily)</p>
                                {analysis.news_results?.slice(0, 3).map((news, i) => (
                                    <a key={i} href={news.url} target="_blank" className="block p-2 hover:bg-slate-50 rounded group transition-colors">
                                        <p className="text-xs font-bold line-clamp-1 group-hover:text-blue-600">{news.title}</p>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-[9px] text-muted-foreground">{new URL(news.url).hostname}</span>
                                            <ExternalLink className="h-2 w-2 opacity-0 group-hover:opacity-100" />
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {analysis.triangulation?.inconsistencies.length > 0 && (
                    <Card className="border-amber-200 bg-amber-50/50">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-amber-900">Pipeline Conflicts</CardTitle></CardHeader>
                        <CardContent>
                            <ul className="text-xs space-y-2">
                                {analysis.triangulation?.inconsistencies.map((inc: string, i: number) => (
                                    <li key={i} className="flex gap-2">
                                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                                        <span className="text-amber-900">{inc}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
