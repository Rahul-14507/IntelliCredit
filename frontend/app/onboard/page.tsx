"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEntity } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const steps = [
  { id: 1, title: "Company Identity", description: "Basic details about the entity" },
  { id: 2, title: "Business Profile", description: "Industry and size information" },
  { id: 3, title: "Loan Request", description: "Details of the credit facility" },
  { id: 4, title: "Final Review", description: "Verify all information before submission" }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    cin: "",
    pan: "",
    incorporation_year: "",
    registered_address: "",
    website: "",
    credit_rating: "Unrated",
    sector: "",
    sub_sector: "",
    annual_turnover_cr: "",
    employee_count: "",
    loan_type: "Term Loan",
    loan_amount_cr: "",
    loan_tenure_months: "",
    interest_rate_pct: "",
    loan_purpose: "",
    collateral: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const entity: any = await createEntity({
        ...formData,
        incorporation_year: formData.incorporation_year ? parseInt(formData.incorporation_year as string) : undefined,
        annual_turnover_cr: formData.annual_turnover_cr ? parseFloat(formData.annual_turnover_cr as string) : undefined,
        employee_count: formData.employee_count ? parseInt(formData.employee_count as string) : undefined,
        loan_amount_cr: parseFloat(formData.loan_amount_cr as string),
        loan_tenure_months: formData.loan_tenure_months ? parseInt(formData.loan_tenure_months as string) : undefined,
        interest_rate_pct: formData.interest_rate_pct ? parseFloat(formData.interest_rate_pct as string) : undefined,
      });
      router.push(`/documents/${entity.id}`);
    } catch (error) {
      console.error("Onboarding failed:", error);
      alert("Failed to create entity. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">New Credit Application</h1>
        <Progress value={(step / 4) * 100} className="h-2" />
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          {steps.map(s => (
            <span key={s.id} className={step === s.id ? "text-primary font-bold" : ""}>{s.title}</span>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{steps[step - 1].title}</CardTitle>
          <CardDescription>{steps[step - 1].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input id="company_name" name="company_name" value={formData.company_name} onChange={handleChange} placeholder="e.g. HDFC Bank Ltd" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cin">CIN</Label>
                <Input id="cin" name="cin" value={formData.cin} onChange={handleChange} placeholder="L17110MH1973PLC019786" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pan">PAN</Label>
                <Input id="pan" name="pan" value={formData.pan} onChange={handleChange} placeholder="AAACR5055K" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="incorporation_year">Incorporation Year</Label>
                <Input id="incorporation_year" name="incorporation_year" type="number" value={formData.incorporation_year} onChange={handleChange} placeholder="1994" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" name="website" value={formData.website} onChange={handleChange} placeholder="https://www.hdfcbank.com" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="registered_address">Registered Address</Label>
                <Textarea id="registered_address" name="registered_address" value={formData.registered_address} onChange={handleChange} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sector">Sector</Label>
                <Input id="sector" name="sector" value={formData.sector} onChange={handleChange} placeholder="e.g. Banking" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sub_sector">Sub-Sector</Label>
                <Input id="sub_sector" name="sub_sector" value={formData.sub_sector} onChange={handleChange} placeholder="e.g. Private Bank" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="annual_turnover_cr">Annual Turnover (₹ Cr)</Label>
                <Input id="annual_turnover_cr" name="annual_turnover_cr" type="number" value={formData.annual_turnover_cr} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee_count">Employee Count</Label>
                <Input id="employee_count" name="employee_count" type="number" value={formData.employee_count} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="credit_rating">Latest Credit Rating</Label>
                <select name="credit_rating" value={formData.credit_rating} onChange={handleChange} className="w-full border rounded p-2">
                    <option value="Unrated">Unrated</option>
                    <option value="AAA">AAA</option>
                    <option value="AA+">AA+</option>
                    <option value="AA">AA</option>
                    <option value="A">A</option>
                    <option value="BBB">BBB</option>
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loan_type">Loan Type</Label>
                <select name="loan_type" value={formData.loan_type} onChange={handleChange} className="w-full border rounded p-2">
                    <option value="Term Loan">Term Loan</option>
                    <option value="Working Capital">Working Capital</option>
                    <option value="Cash Credit">Cash Credit</option>
                    <option value="Overdraft">Overdraft</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="loan_amount_cr">Requested Amount (₹ Cr) *</Label>
                <Input id="loan_amount_cr" name="loan_amount_cr" type="number" value={formData.loan_amount_cr} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loan_tenure_months">Tenure (Months)</Label>
                <Input id="loan_tenure_months" name="loan_tenure_months" type="number" value={formData.loan_tenure_months} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interest_rate_pct">Expected Rate (%)</Label>
                <Input id="interest_rate_pct" name="interest_rate_pct" type="number" step="0.1" value={formData.interest_rate_pct} onChange={handleChange} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="loan_purpose">Purpose of Loan</Label>
                <Textarea id="loan_purpose" name="loan_purpose" value={formData.loan_purpose} onChange={handleChange} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="collateral">Collateral Details</Label>
                <Textarea id="collateral" name="collateral" value={formData.collateral} onChange={handleChange} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-bold mb-2">Review Summary</h3>
                <p><strong>Entity:</strong> {formData.company_name} ({formData.sector})</p>
                <p><strong>Loan:</strong> ₹{formData.loan_amount_cr} Cr {formData.loan_type}</p>
                <p><strong>Purpose:</strong> {formData.loan_purpose || "N/A"}</p>
              </div>
              <p className="text-sm text-muted-foreground">By submitting, you initiate the credit assessment pipeline. You will be asked to upload supporting documents in the next stage.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={step === 1 || loading}>Back</Button>
          {step < 4 ? (
            <Button onClick={handleNext} disabled={!formData.company_name && step === 1}>Next</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>{loading ? "Initializing..." : "Submit & Continue"}</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
