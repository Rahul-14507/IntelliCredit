"use client";

import { TrendingUp, ArrowRight } from "lucide-react";

interface Counterfactual {
  rank: number;
  dimension: string;
  current_score: number;
  improved_score: number;
  current_overall: number;
  improved_overall: number;
  action: string;
  ease: string;
}

export default function CounterfactualCard({ cf }: { cf: Counterfactual }) {
  if (!cf) return null;

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm flex flex-col space-y-3 relative overflow-hidden group hover:border-blue-300 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-2">
          <span className="flex items-center justify-center bg-blue-100 text-blue-800 text-xs font-bold h-6 w-6 rounded-full">
            #{cf.rank}
          </span>
          <span className="font-semibold text-sm text-slate-700">
            {cf.dimension}
          </span>
        </div>
        <span
          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded
          ${
            cf.ease === "Hard"
              ? "bg-red-100 text-red-700"
              : cf.ease === "Easy"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {cf.ease} Fix
        </span>
      </div>

      <p className="text-sm text-slate-600 leading-snug">{cf.action}</p>

      <div className="flex items-center justify-between text-xs pt-2 border-t mt-auto">
        <div className="flex flex-col text-slate-500">
          <span>Overall Impact</span>
          <div className="flex items-center font-bold text-slate-800 space-x-1">
            <span>{cf.current_overall}</span>
            <ArrowRight className="h-3 w-3 text-green-600" />
            <span className="text-green-600">{cf.improved_overall}</span>
          </div>
        </div>
        <TrendingUp className="h-5 w-5 text-green-200 group-hover:text-green-500 transition-colors" />
      </div>
    </div>
  );
}
