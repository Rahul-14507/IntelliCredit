"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEntity, listDocs, classifyAll, confirmDoc, updateSchema, resetSchema, extractSchemas, getAllExtracted, editExtracted } from "@/lib/api";
import { Entity, Document, SchemaField } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Check, X, Edit2, RotateCcw, Save, Play } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function SchemaPage() {
  const { id } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("classification");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [entity, setEntity] = useState<Entity | null>(null);

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
        console.error("Initialization failed:", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, fetchDocs]);

  const handleClassifyAll = async () => {
    setProcessing(true);
    try {
      await classifyAll(id as string);
      await fetchDocs();
    } catch (error) {
      alert("Classification failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirm = async (docId: string, confirmedType: string) => {
    try {
      await confirmDoc(id as string, docId, { confirmed_type: confirmedType, action: "approve" });
      await fetchDocs();
    } catch (error) {
      alert("Failed to confirm");
    }
  };

  const handleRunExtraction = async () => {
    setProcessing(true);
    try {
      await extractSchemas(id as string);
      setActiveTab("extraction");
      await fetchDocs();
    } catch (error) {
      alert("Extraction failed");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-vh-screen"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{entity?.company_name}</h1>
          <p className="text-muted-foreground">Stage 3: Intelligent Schema Mapping</p>
        </div>
        <Button onClick={() => router.push(`/report/${id}`)} disabled={!documents.some(d => d.schema_status === "done")}>
          Generate Final Report →
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="classification">1. Classification Review</TabsTrigger>
          <TabsTrigger value="schema">2. Schema Editor</TabsTrigger>
          <TabsTrigger value="extraction">3. Extraction Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="classification" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Document Classification</h2>
            <Button onClick={handleClassifyAll} disabled={processing} variant="outline">
              {processing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              Re-run AI Classification
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map(doc => (
              <Card key={doc.id} className={doc.classification_status === "confirmed" ? "border-green-500 shadow-md" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-md">{doc.filename}</CardTitle>
                    <Badge variant={doc.classification_status === "confirmed" ? "default" : "outline"}>
                      {doc.classification_status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">AI Prediction:</span>
                    <Badge variant="secondary" className="text-lg">{doc.predicted_doc_type}</Badge>
                    <span className="text-sm text-muted-foreground">({(doc.predicted_confidence! * 100).toFixed(0)}%)</span>
                  </div>
                  <p className="text-sm text-muted-foreground italic">&quot;{(doc as any).predicted_reasoning}&quot;</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {doc.predicted_signals?.map((s, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] bg-blue-50"># {s}</Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  {doc.classification_status !== "confirmed" ? (
                    <>
                      <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleConfirm(doc.id, doc.predicted_doc_type!)}>
                        <Check className="mr-2 h-4 w-4" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit2 className="mr-2 h-4 w-4" /> Override
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="ghost" className="w-full text-green-600 hover:bg-green-50" disabled>
                      <Check className="mr-2 h-4 w-4" /> Confirmed
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={() => setActiveTab("schema")} disabled={!documents.some(d => d.classification_status === "confirmed")}>
              Next: Configure Schemas
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="schema" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Dynamic Schema Configuration</h2>
            <Button onClick={handleRunExtraction} disabled={processing || !documents.some(d => d.classification_status === "confirmed")}>
              {processing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
              Save & Run Global Extraction
            </Button>
          </div>
          
          <div className="space-y-4">
            {documents.filter(d => d.classification_status === "confirmed").map(doc => (
              <Card key={doc.id}>
                <CardHeader className="bg-muted/30 py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">{doc.confirmed_doc_type}</CardTitle>
                      <CardDescription>{doc.filename}</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => resetSchema(id as string, doc.id).then(fetchDocs)}>
                      <RotateCcw className="mr-2 h-3 w-3" /> Reset to Default
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-12 gap-4 mb-2 text-xs font-bold text-muted-foreground px-2">
                    <div className="col-span-1">Include</div>
                    <div className="col-span-4">Field Label</div>
                    <div className="col-span-4">Internal Key</div>
                    <div className="col-span-3">Data Type</div>
                  </div>
                  <div className="space-y-1">
                    {doc.schema_fields?.map((field, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-4 items-center p-2 rounded-md hover:bg-muted/20 border border-transparent hover:border-muted">
                        <div className="col-span-1 flex justify-center">
                          <Switch checked={field.include} onCheckedChange={(val: any) => {
                            const updated = [...(doc.schema_fields || [])];
                            updated[idx].include = val;
                            updateSchema(id as string, doc.id, updated).then(fetchDocs);
                          }} />
                        </div>
                        <div className="col-span-4">
                          <Input value={field.label} readOnly className="h-8 text-sm" />
                        </div>
                        <div className="col-span-4">
                           <code className="text-xs bg-muted p-1 rounded font-mono">{field.key}</code>
                        </div>
                        <div className="col-span-3">
                           <Badge variant="outline" className="capitalize">{field.type}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="extraction" className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Structured Extraction Preview</h2>
                <div className="flex gap-2 text-sm">
                    <span className="flex items-center gap-1"><Badge className="bg-green-500 h-2 w-2 rounded-full p-0" /> High Confidence</span>
                    <span className="flex items-center gap-1"><Badge className="bg-amber-500 h-2 w-2 rounded-full p-0" /> Human Review Required</span>
                </div>
            </div>

            <div className="space-y-8">
                {documents.filter(d => d.schema_status === "done").map(doc => (
                    <div key={doc.id} className="space-y-4">
                        <div className="flex items-center gap-4">
                            <h3 className="text-lg font-bold">{doc.filename}</h3>
                            <Badge variant="outline">{doc.confirmed_doc_type}</Badge>
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                                Confidence: {(doc.extraction_confidence! * 100).toFixed(0)}%
                            </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
                            {/* Raw Text View */}
                            <div className="border rounded-lg flex flex-col overflow-hidden bg-muted/10">
                                <div className="bg-muted p-2 text-xs font-bold border-b">OCR / RAW TEXT VIEW</div>
                                <div className="p-4 overflow-y-auto text-xs font-mono whitespace-pre-wrap flex-1 bg-white">
                                    {(doc as any).raw_text}
                                </div>
                            </div>

                            {/* Extracted Values Editor */}
                            <div className="border rounded-lg flex flex-col overflow-hidden bg-white">
                                <div className="bg-muted p-2 text-xs font-bold border-b flex justify-between">
                                    <span>STRUCTURED DATA PREVIEW</span>
                                    <span className="text-muted-foreground mr-2">Editable</span>
                                </div>
                                <div className="p-4 overflow-y-auto flex-1">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-muted-foreground text-xs">
                                                <th className="text-left pb-2 font-medium">Field</th>
                                                <th className="text-left pb-2 font-medium">Extracted Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(doc.extracted_data || {}).filter(([k]) => !k.startsWith("_")).map(([key, value]) => (
                                                <tr key={key} className="border-b last:border-0">
                                                    <td className="py-2 pr-4 font-medium text-xs whitespace-nowrap">
                                                        {doc.schema_fields?.find(f => f.key === key)?.label || key}
                                                    </td>
                                                    <td className="py-2">
                                                        {typeof value === 'object' ? (
                                                            <div className="text-[10px] bg-muted p-1 rounded max-h-20 overflow-auto font-mono">
                                                                {JSON.stringify(value, null, 1)}
                                                            </div>
                                                        ) : (
                                                            <Input 
                                                                value={value || ""} 
                                                                className={`h-7 text-sm ${value === null ? "border-amber-400 bg-amber-50" : ""}`}
                                                                onChange={(e: any) => {
                                                                    const updated = { ...doc.extracted_data, [key]: e.target.value };
                                                                    editExtracted(id as string, doc.id, updated).then(fetchDocs);
                                                                }}
                                                            />
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-center pt-10 border-t">
                <Button size="lg" className="w-64 h-14 text-lg font-bold shadow-xl" onClick={() => router.push(`/report/${id}`)}>
                    Analyze & Generate Report
                </Button>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
