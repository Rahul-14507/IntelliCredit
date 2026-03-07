"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export default function ScoreRadar({ dimensions }: { dimensions: any }) {
  if (!dimensions) return null;

  const data = [
    {
      subject: "Financials",
      A: dimensions.financial_health?.score || 0,
      fullMark: 100,
    },
    {
      subject: "GST Consistency",
      A: dimensions.gst_consistency?.score || 0,
      fullMark: 100,
    },
    {
      subject: "Litigation",
      A: dimensions.litigation_regulatory?.score || 0,
      fullMark: 100,
    },
    {
      subject: "Linguistic",
      A: dimensions.linguistic_stress?.score || 0,
      fullMark: 100,
    },
    {
      subject: "Promoter Risk",
      A: dimensions.promoter_risk?.score || 0,
      fullMark: 100,
    },
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" className="text-xs" />
          <PolarRadiusAxis angle={30} domain={[0, 100]} />
          <Radar
            name="Score"
            dataKey="A"
            stroke="#000000"
            fill="#000000"
            fillOpacity={0.6}
          />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
