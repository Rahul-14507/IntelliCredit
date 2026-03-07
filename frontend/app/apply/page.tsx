"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  Building,
  UploadCloud,
  FileText,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { createApplication, uploadDocuments, runAnalysis } from "@/lib/api";
import SpeechTextArea from "@/components/SpeechTextArea";

export default function ApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [appId, setAppId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 State
  const [company, setCompany] = useState({
    name: "",
    cin: "",
    industry: "Manufacturing",
    limit: 1.0,
  });

  // Step 2 State
  const [files, setFiles] = useState<File[]>([]);
  const [docStatuses, setDocStatuses] = useState<any[]>([]);
  const [extractedLen, setExtractedLen] = useState(0);

  // Step 3 State
  const [insights, setInsights] = useState({ officer: "", text: "" });

  // Step 4 State
  const [analysisDone, setAnalysisDone] = useState(false);

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await createApplication({
        company_name: company.name,
        cin: company.cin,
        industry: company.industry,
        requested_limit_crores: company.limit,
      });
      setAppId(res.id);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
  });

  const handleStep2 = async () => {
    if (files.length === 0) return;
    setLoading(true);
    setError("");
    try {
      const res = await uploadDocuments(appId, files);
      setDocStatuses(res.extraction_statuses);
      setExtractedLen(res.total_text_length);

      const successCount = res.extraction_statuses.filter(
        (s: any) => s.status === "done",
      ).length;
      if (successCount === 0) {
        throw new Error(
          "Failed to extract text from any uploaded documents. Please try clearer files.",
        );
      }
      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStep3And4 = async () => {
    setStep(4);
    try {
      await runAnalysis(appId, {
        officer_name: insights.officer,
        primary_insights_text: insights.text,
      });
      setAnalysisDone(true);
    } catch (err: any) {
      setError(err.message);
      setStep(3); // Go back if fails
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-3xl">
      <div className="mb-8 flex justify-between items-center text-sm font-medium">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex flex-col items-center">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center mb-2 
              ${step === s ? "bg-blue-600 text-white" : step > s ? "bg-green-500 text-white" : "bg-slate-200 text-slate-500"}`}
            >
              {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
            </div>
            <span className={step >= s ? "text-slate-900" : "text-slate-400"}>
              {s === 1
                ? "Company"
                : s === 2
                  ? "Documents"
                  : s === 3
                    ? "Insights"
                    : "Analysis"}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-xl shadow-sm p-6 md:p-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleStep1} className="space-y-4">
            <h2 className="text-xl font-bold flex items-center border-b pb-4 mb-4">
              <Building className="mr-2 h-5 w-5" /> Company Details
            </h2>

            <div>
              <label className="block text-sm font-medium mb-1">
                Company Name
              </label>
              <input
                required
                type="text"
                className="w-full border p-2 rounded"
                value={company.name}
                onChange={(e) =>
                  setCompany({ ...company, name: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">CIN</label>
              <input
                required
                type="text"
                className="w-full border p-2 rounded"
                value={company.cin}
                onChange={(e) =>
                  setCompany({ ...company, cin: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Industry</label>
              <select
                className="w-full border p-2 rounded"
                value={company.industry}
                onChange={(e) =>
                  setCompany({ ...company, industry: e.target.value })
                }
              >
                <option>Manufacturing</option>
                <option>IT Services</option>
                <option>Wholesale Trade</option>
                <option>Automobile</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Requested Limit (₹ Crores)
              </label>
              <input
                required
                type="number"
                step="0.01"
                className="w-full border p-2 rounded"
                value={company.limit}
                onChange={(e) =>
                  setCompany({ ...company, limit: parseFloat(e.target.value) })
                }
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 flex justify-center"
            >
              {loading ? (
                <RefreshCw className="animate-spin h-5 w-5" />
              ) : (
                "Save & Continue"
              )}
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center border-b pb-4 mb-4">
              <UploadCloud className="mr-2 h-5 w-5" /> Upload Financials & KYC
            </h2>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${isDragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:bg-slate-50"}`}
            >
              <input {...getInputProps()} />
              <UploadCloud className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <p className="text-sm text-slate-600">
                Drag & drop files here, or click to select files
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Supports PDF, JPG, PNG, XLSX, CSV
              </p>
            </div>

            {files.length > 0 && (
              <div className="mt-4 border rounded-md p-4">
                <h4 className="text-sm font-bold border-b pb-2 mb-2">
                  Selected Files
                </h4>
                <ul className="space-y-2">
                  {files.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 p-2 rounded"
                    >
                      <span className="flex items-center truncate">
                        <FileText className="h-4 w-4 mr-2" />
                        {f.name}
                      </span>
                      <span>{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              disabled={loading || files.length === 0}
              onClick={handleStep2}
              className="w-full mt-6 bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 flex justify-center items-center disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin h-5 w-5 mr-2" /> Extracting
                  with Azure DI...
                </>
              ) : (
                "Upload & Extract"
              )}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center border-b pb-4 mb-4 text-green-700">
              <CheckCircle2 className="mr-2 h-5 w-5" /> Extracted{" "}
              {extractedLen.toLocaleString()} chars successfully
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Step 3: Credit Officer Field Observations (Optional)
            </p>

            <div>
              <label className="block text-sm font-medium mb-1">
                Officer Name
              </label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                placeholder="e.g. Rahul Pujari"
                value={insights.officer}
                onChange={(e) =>
                  setInsights({ ...insights, officer: e.target.value })
                }
              />
            </div>

            <SpeechTextArea
              label="Observations"
              sublabel="Speak your site visit observations"
              placeholder="Enter qualitative observations from site visits, management meetings..."
              value={insights.text}
              onChange={(val) => setInsights({ ...insights, text: val })}
            />

            <div className="flex space-x-4 pt-4 border-t">
              <button
                onClick={handleStep3And4}
                className="flex-1 bg-slate-200 text-slate-700 p-3 rounded font-bold hover:bg-slate-300"
              >
                Skip insights
              </button>
              <button
                onClick={handleStep3And4}
                className="flex-1 bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 flex justify-center items-center"
              >
                Run Analysis <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-10">
            {!analysisDone ? (
              <div className="flex flex-col items-center">
                <RefreshCw className="h-16 w-16 text-blue-600 animate-spin mb-6" />
                <h3 className="text-xl font-bold mb-2">
                  Azure OpenAI is analyzing the profile...
                </h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">
                  Evaluating Five Cs, calculating ratios, and structuring
                  counterfactual recommendations.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Analysis Complete</h3>
                <button
                  onClick={() => router.push(`/report/${appId}`)}
                  className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 flex items-center shadow-lg hover:shadow-xl transition-all"
                >
                  View Full Report <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
