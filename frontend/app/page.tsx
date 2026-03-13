"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { listEntities } from "@/lib/api";
import { Entity } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, ArrowRight, Building2, TrendingUp, ShieldCheck } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listEntities().then((data: any) => setEntities(data)).finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete": return "bg-green-100 text-green-700 border-green-200";
      case "onboarding": return "bg-blue-100 text-blue-700 border-blue-200";
      case "documents": return "bg-amber-100 text-amber-700 border-amber-200";
      case "analysis": return "bg-purple-100 text-purple-700 border-purple-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">IntelliCredit v3</h1>
          <p className="text-muted-foreground mt-1">Industrial Credit Assessment Pipeline</p>
        </div>
        <Button size="lg" className="gap-2" onClick={() => router.push("/onboard")}>
          <Plus className="h-5 w-5" /> New Application
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-50 border-none shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Active Pipeline</CardTitle></CardHeader>
            <CardContent><p className="text-4xl font-black">{entities.length}</p></CardContent>
        </Card>
        <Card className="bg-slate-900 text-white border-none shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase font-bold text-slate-400 tracking-widest">Avg Credit Score</CardTitle></CardHeader>
            <CardContent><p className="text-4xl font-black">84.2</p></CardContent>
        </Card>
        <Card className="bg-slate-50 border-none shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Total Exposure</CardTitle></CardHeader>
            <CardContent><p className="text-4xl font-black">₹482 Cr</p></CardContent>
        </Card>
        <Card className="bg-slate-50 border-none shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Approval Rate</CardTitle></CardHeader>
            <CardContent><p className="text-4xl font-black">68%</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex py-20 items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>
          ) : entities.length === 0 ? (
            <div className="text-center py-20">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No applications found. Create your first one to start the pipeline.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Loan Amount</TableHead>
                  <TableHead>Pipeline Stage</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entities.map((ent) => (
                  <TableRow key={ent.id} className="cursor-pointer hover:bg-muted/50" onClick={() => {
                    if (ent.status === "onboarding" || ent.status === "documents") router.push(`/documents/${ent.id}`);
                    else if (ent.status === "schema") router.push(`/schema/${ent.id}`);
                    else router.push(`/report/${ent.id}`);
                  }}>
                    <TableCell className="font-bold">{ent.company_name}</TableCell>
                    <TableCell>{ent.sector || "N/A"}</TableCell>
                    <TableCell className="font-mono">₹{ent.loan_amount_cr} Cr</TableCell>
                    <TableCell>
                        <Badge className={`${getStatusColor(ent.status)} capitalize border px-3`}>{ent.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(ent.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="gap-2">
                            {ent.status === "complete" ? "View Report" : "Continue"} <ArrowRight className="h-4 w-4" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
