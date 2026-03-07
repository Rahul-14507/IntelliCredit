"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { DimensionScore } from "@/lib/api";

export default function DimensionBar({
  label,
  desc,
  data,
}: {
  label: string;
  desc: string;
  data: DimensionScore;
}) {
  const [open, setOpen] = useState(false);

  // Fallback to 0 if data is undefined
  const score = data?.score || 0;

  const getColor = (s: number) => {
    if (s >= 80) return "bg-green-500";
    if (s >= 60) return "bg-yellow-500";
    return "bg-orange-500";
  };

  return (
    <div className="border rounded-md overflow-hidden bg-white mb-2 shadow-sm">
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50"
        onClick={() => setOpen(!open)}
      >
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{label}</h4>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${getColor(score)} transition-all duration-500`}
              style={{ width: `${score}%` }}
            />
          </div>
          <span className="font-bold text-sm min-w-[30px] text-right">
            {score}
          </span>
          {open ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </div>

      {open && data && (
        <div className="p-4 bg-slate-50 border-t text-sm">
          <p className="text-slate-700 italic border-l-2 border-primary pl-3">
            {data.rationale}
          </p>
        </div>
      )}
    </div>
  );
}
