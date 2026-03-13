"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEntity, uploadDocs, listDocs, docStatus, extractAll } from "@/lib/api";
import { Entity, Document } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, CheckCircle, Clock, AlertCircle } from "lucide-react";

const MANDATORY_DOCS = [
  { id: "ALM", label: "ALM Statement", description: "Asset-Liability Management report" },
  { id: "Shareholding", label: "Shareholding Pattern", description: "Latest quarterly holding data" },
  { id: "Borrowing", label: "Borrowing Profile", description: "Debt schedule and lender details" },
  { id: "AnnualReport", label: "Annual Report", description: "Audited financial statements" },
  { id: "Portfolio", label: "Portfolio Performance", description: "AUM, NPA and vintage data" }
];

export default function DocumentsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDocs = useCallback(async () => {
    try {
      const docs: any = await listDocs(id as string);
      setDocuments(docs);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    }
  }, [id]);

  useEffect(() => {
    const init = async () => {
      try {
        const ent: any = await getEntity(id as string);
        setEntity(ent);
        await fetchDocs();
      } catch (error) {
        console.error("Failed to initialization:", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, fetchDocs]);

  // Polling for extraction status
  useEffect(() => {
    const isProcessing = documents.some(d => d.extraction_status === "extracting" || d.extraction_status === "pending");
    if (isProcessing) {
      const interval = setInterval(fetchDocs, 3000);
      return () => clearInterval(interval);
    }
  }, [documents, fetchDocs]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    try {
      await uploadDocs(id as string, e.target.files);
      await fetchDocs();
    } catch (error) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleStartExtraction = async () => {
    setExtracting(true);
    try {
      await extractAll(id as string);
      await fetchDocs();
    } catch (error) {
      alert("Extraction failed to start");
    } finally {
      setExtracting(false);
    }
  };

  const allDone = documents.length > 0 && documents.every(d => d.extraction_status === "done");

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{entity?.company_name}</h1>
          <p className="text-muted-foreground">Stage 2: Document Ingestion</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => router.push("/")}>Exit to Dashboard</Button>
          {allDone && (
            <Button onClick={() => router.push(`/schema/${id}`)} className="bg-green-600 hover:bg-green-700">
              Proceed to Classification →
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Upload Documents</CardTitle>
            <CardDescription>Support for PDF, XLSX, JPG</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
              <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleUpload} disabled={uploading} />
              <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">{uploading ? "Uploading..." : "Click or drag to upload"}</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-muted-foreground">Required Checklist</h4>
              {MANDATORY_DOCS.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <span className="text-sm">{doc.label}</span>
                  {documents.some(d => d.filename.toLowerCase().includes(doc.id.toLowerCase())) ? 
                    <Badge variant="secondary" className="bg-green-100 text-green-700">Present</Badge> : 
                    <Badge variant="outline" className="text-muted-foreground">Missing</Badge>
                  }
                </div>
              ))}
            </div>
            
            <Button className="w-full" disabled={documents.length === 0 || extracting || documents.some(d => d.extraction_status === "extracting")} onClick={handleStartExtraction}>
              {extracting ? "Starting..." : "Extract All Data"}
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Ingestion Status</CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">No documents uploaded yet.</div>
            ) : (
              <div className="space-y-4">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {doc.extraction_status === "done" ? <CheckCircle className="h-5 w-5 text-green-500" /> : 
                       doc.extraction_status === "extracting" ? <Loader2 className="h-5 w-5 animate-spin text-blue-500" /> :
                       doc.extraction_status === "error" ? <AlertCircle className="h-5 w-5 text-red-500" /> :
                       <Clock className="h-5 w-5 text-muted-foreground" />}
                      <div>
                        <p className="font-medium text-sm">{doc.filename}</p>
                        <p className="text-xs text-muted-foreground">{(doc.file_size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <Badge variant={
                      doc.extraction_status === "done" ? "default" : 
                      doc.extraction_status === "extracting" ? "secondary" : 
                      doc.extraction_status === "error" ? "destructive" : "outline"
                    }>
                      {doc.extraction_status.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
