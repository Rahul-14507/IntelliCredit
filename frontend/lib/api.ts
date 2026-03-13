const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

// Stage 1
export const createEntity  = (data: any)           => req("/entities/", { method: "POST", body: JSON.stringify(data) });
export const listEntities  = ()                     => req("/entities/");
export const getEntity     = (id: string)           => req(`/entities/${id}`);
export const updateEntity  = (id: string, data: any)=> req(`/entities/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteEntity  = (id: string)           => req(`/entities/${id}`, { method: "DELETE" });

// Stage 2
export const uploadDocs    = (entityId: string, files: File[] | FileList) => {
  const form = new FormData();
  Array.from(files).forEach(f => form.append("files", f));
  return fetch(`${BASE}/documents/${entityId}/upload`, { method: "POST", body: form }).then(r => r.json());
};
export const extractAll    = (entityId: string)     => req(`/documents/${entityId}/extract-all`, { method: "POST" });
export const listDocs      = (entityId: string)     => req(`/documents/${entityId}/`);
export const docStatus     = (entityId: string, docId: string) => req(`/documents/${entityId}/${docId}/status`);

// Stage 3
export const classifyAll   = (entityId: string)     => req(`/schema/${entityId}/classify-all`, { method: "POST" });
export const confirmDoc    = (entityId: string, docId: string, data: any) =>
  req(`/schema/${entityId}/${docId}/confirm`, { method: "PATCH", body: JSON.stringify(data) });
export const updateSchema  = (entityId: string, docId: string, fields: any) =>
  req(`/schema/${entityId}/${docId}/schema`, { method: "PATCH", body: JSON.stringify({ schema_fields: fields }) });
export const resetSchema   = (entityId: string, docId: string) =>
  req(`/schema/${entityId}/${docId}/reset-schema`, { method: "POST" });
export const extractSchemas= (entityId: string)     => req(`/schema/${entityId}/extract-all`, { method: "POST" });
export const getAllExtracted= (entityId: string)     => req(`/schema/${entityId}/all-extracted`);
export const editExtracted = (entityId: string, docId: string, data: any) =>
  req(`/schema/${entityId}/${docId}/extracted`, { method: "PATCH", body: JSON.stringify({ extracted_data: data }) });

// Stage 4
export const runResearch   = (entityId: string)     => req(`/analysis/${entityId}/research`, { method: "POST" });
export const runAnalysis   = (entityId: string)     => req(`/analysis/${entityId}/analyze`, { method: "POST" });
export const getAnalysis   = (entityId: string)     => req(`/analysis/${entityId}/`);
export const getAnalysisStatus = (entityId: string) => req(`/analysis/${entityId}/status`);
export const recalculate   = (entityId: string)     => req(`/analysis/${entityId}/recalculate`, { method: "POST" });

// Export
export const exportDocx    = (entityId: string)     => `${BASE}/export/${entityId}/docx`;
