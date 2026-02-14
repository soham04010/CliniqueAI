"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Activity } from "lucide-react";
import api from "@/lib/api";

export default function AddVitalsForm({ onUpdate }: { onUpdate?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "Male",
    pregnancies: "0",
    glucose: "",
    bloodPressure: "",
    skinThickness: "20",
    insulin: "0",
    bmi: "",
    dpf: "0.5", // Diabetes Pedigree Function default
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const payload = {
      name: form.name,
      age: Number(form.age),
      gender: form.gender,
      vitals: {
        pregnancies: Number(form.pregnancies),
        glucose: Number(form.glucose),
        bloodPressure: Number(form.bloodPressure),
        skinThickness: Number(form.skinThickness),
        insulin: Number(form.insulin),
        bmi: Number(form.bmi),
        dpf: Number(form.dpf),
      }
    };

    try {
      // 1. Send to Node.js (which asks Python)
      const { data } = await api.post("/patients/predict", payload);
      setResult(data.prediction);
      
      // 2. Refresh Dashboard List
      if (onUpdate) onUpdate();
      
    } catch (err: any) {
      alert("Failed to get prediction: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Activity className="mr-2 h-4 w-4" /> New AI Assessment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Patient Risk Assessment</DialogTitle>
        </DialogHeader>

        {!result ? (
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Patient Name</Label>
                <Input name="name" onChange={handleChange} className="bg-slate-800 border-slate-700" required />
              </div>
              <div className="space-y-2">
                <Label>Age</Label>
                <Input name="age" type="number" onChange={handleChange} className="bg-slate-800 border-slate-700" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Glucose Level</Label>
                <Input name="glucose" type="number" onChange={handleChange} className="bg-slate-800 border-slate-700" required />
              </div>
              <div className="space-y-2">
                <Label>BMI</Label>
                <Input name="bmi" type="number" step="0.1" onChange={handleChange} className="bg-slate-800 border-slate-700" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Blood Pressure</Label>
                <Input name="bloodPressure" type="number" onChange={handleChange} className="bg-slate-800 border-slate-700" required />
              </div>
              <div className="space-y-2">
                <Label>Insulin (Optional)</Label>
                <Input name="insulin" type="number" onChange={handleChange} className="bg-slate-800 border-slate-700" />
              </div>
            </div>

            <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 mt-4" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : "Analyze Risk"}
            </Button>
          </form>
        ) : (
          <div className="py-6 text-center space-y-4">
            <div className={`text-4xl font-bold ${result.riskLevel === 'High' ? 'text-red-500' : 'text-green-500'}`}>
              {result.riskScore.toFixed(1)}%
            </div>
            <p className="text-xl font-medium">
              Risk Level: <span className={result.riskLevel === 'High' ? 'text-red-400' : 'text-green-400'}>{result.riskLevel}</span>
            </p>
            <Button onClick={() => { setIsOpen(false); setResult(null); }} variant="outline" className="w-full border-slate-700 hover:bg-slate-800">
              Close & Save
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}