"use client";

import { CheckCircle2, ShieldCheck, IndianRupee, Clock } from "lucide-react";
import { AnalysisResult } from "@/lib/api";

export default function LendingTermsCard({ data }: { data: AnalysisResult }) {
  if (!data?.lending_recommendation) return null;

  const lr = data.lending_recommendation;

  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0">
        <div className="p-4 flex flex-col justify-center">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1 flex items-center">
            <IndianRupee className="h-3.5 w-3.5 mr-1" /> Limit
          </p>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500">
            ₹{lr.suggested_limit_crores} Cr
          </span>
        </div>

        <div className="p-4 flex flex-col justify-center">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1 flex items-center">
            <TrendingUp className="h-3.5 w-3.5 mr-1" /> Pricing
          </p>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500">
            {lr.interest_rate_pct}%
          </span>
        </div>

        <div className="p-4 flex flex-col justify-center">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1 flex items-center">
            <Clock className="h-3.5 w-3.5 mr-1" /> Tenure
          </p>
          <span className="text-xl font-bold text-slate-800">
            {lr.suggested_tenure_months} M
          </span>
        </div>

        <div className="p-4 flex flex-col justify-center">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1 flex items-center">
            <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Cover
          </p>
          <span className="text-xl font-bold text-slate-800">
            {lr.security_cover_ratio}x
          </span>
        </div>
      </div>

      {lr.conditions && lr.conditions.length > 0 && (
        <div className="p-4 bg-slate-50 border-t">
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">
            Conditions Precedent
          </p>
          <ul className="space-y-1">
            {lr.conditions.map((cond, i) => (
              <li key={i} className="text-sm flex items-start text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-green-600 mr-2 mt-0.5 shrink-0" />
                <span>{cond}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Ensure TrendingUp is available for the second column
import { TrendingUp } from "lucide-react";
