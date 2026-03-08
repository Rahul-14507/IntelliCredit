"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  ArrowRight,
  BarChart3,
  TrendingUp,
  ShieldCheck,
  Activity,
  Trash2,
  Play,
} from "lucide-react";
import {
  ApplicationSummary,
  getApplications,
  deleteApplication,
} from "@/lib/api";

function GradeBadge({ grade }: { grade?: string }) {
  if (!grade)
    return (
      <span className="px-2 py-1 rounded-full text-xs font-bold border bg-slate-100 text-slate-500">
        Pending
      </span>
    );

  const colors: Record<string, string> = {
    A: "bg-green-100 text-green-800 border-green-200",
    B: "bg-yellow-100 text-yellow-800 border-yellow-200",
    C: "bg-orange-100 text-orange-800 border-orange-200",
    D: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-bold border ${colors[grade] || colors["D"]}`}
    >
      {grade}
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [apps, setApps] = useState<ApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApps = async () => {
    try {
      const data = await getApplications();
      setApps(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this application?")) return;
    try {
      await deleteApplication(id);
      fetchApps();
    } catch (err) {
      console.error(err);
      alert("Failed to delete application");
    }
  };

  useEffect(() => {
    fetchApps();
    const interval = setInterval(fetchApps, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalApps = apps.length;
  const completedApps = apps.filter((a) => a.status === "completed");
  const avgScore = completedApps.length
    ? Math.round(
        completedApps.reduce((acc, curr) => acc + (curr.total_score || 0), 0) /
          completedApps.length,
      )
    : 0;
  const approvalRate = completedApps.length
    ? Math.round(
        (completedApps.filter((a) =>
          ["Approve", "Conditional Approve"].includes(
            a.recommended_action || "",
          ),
        ).length /
          completedApps.length) *
          100,
      )
    : 0;

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 border-l-4 border-blue-600 pl-4 py-1">
            IntelliCredit<span className="text-blue-600 font-black"> AI</span>
          </h1>
          <p className="text-muted-foreground mt-1 ml-4 text-sm font-medium">
            Next-Generation Credit Appraisal Engine v2
          </p>
        </div>
        <button
          onClick={() => router.push("/apply")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-md flex items-center shadow-sm transition-all"
        >
          <Plus className="mr-2 h-4 w-4" /> New Application
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border rounded-lg p-5 shadow-sm">
          <div className="flex items-center text-slate-500 mb-2">
            <BarChart3 className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Total Pipeline</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalApps}</p>
        </div>
        <div className="bg-white border rounded-lg p-5 shadow-sm">
          <div className="flex items-center text-slate-500 mb-2">
            <Activity className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Avg Portfolio Score</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{avgScore}</p>
        </div>
        <div className="bg-white border rounded-lg p-5 shadow-sm">
          <div className="flex items-center text-slate-500 mb-2">
            <ShieldCheck className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Approval Rate</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{approvalRate}%</p>
        </div>
        <div className="bg-white border rounded-lg p-5 shadow-sm">
          <div className="flex items-center text-slate-500 mb-2">
            <TrendingUp className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Active Reviews</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {apps.filter((a) => a.status === "pending").length}
          </p>
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b uppercase pb-4">
              <tr>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">CIN</th>
                <th className="px-6 py-4">Req Limit</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Grade</th>
                <th className="px-6 py-4">Decision</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground animate-pulse"
                  >
                    Loading portfolio...
                  </td>
                </tr>
              ) : apps.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No applications found. Click 'New Application' to begin.
                  </td>
                </tr>
              ) : (
                apps.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {app.company_name}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {app.cin}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      ₹{app.requested_limit_crores} Cr
                    </td>
                    <td className="px-6 py-4 font-bold">
                      {app.total_score ? Math.round(app.total_score) : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <GradeBadge grade={app.grade} />
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {app.recommended_action || "Pending"}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-4">
                        {app.status === "completed" ? (
                          <button
                            onClick={() => router.push(`/report/${app.id}`)}
                            className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center"
                          >
                            View Report <ArrowRight className="ml-1 h-3 w-3" />
                          </button>
                        ) : (
                          <button
                            onClick={() => router.push(`/report/${app.id}`)}
                            className="text-amber-600 hover:text-amber-800 font-semibold inline-flex items-center text-xs"
                          >
                            <Play className="mr-1 h-3 w-3" /> Run Analysis
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(app.id, e)}
                          className="text-red-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
                          title="Delete Application"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
