"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Activity, LogOut, Loader2, PlusCircle, AlertTriangle, CheckCircle, MessageSquare } from "lucide-react";
import api from "@/lib/api";
import ClinicalCoPilot from "@/components/ClinicalCoPilot";

export default function DoctorDashboard() {
  const router = useRouter();
  const [doctorName, setDoctorName] = useState("");
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<any[]>([]);

  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const [aiForm, setAiForm] = useState({
    name: "", gender: "Female", age: "", hypertension: "0",
    heart_disease: "0", smoking_history: "never", bmi: "",
    HbA1c_level: "", blood_glucose_level: ""
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) { router.push("/login"); return; }

    try {
      const user = JSON.parse(userStr);
      if (user.role !== "doctor") { router.push("/login"); return; }
      setDoctorName(user.name);
      fetchPatients();
      setLoading(false);
    } catch (e) {
      localStorage.clear();
      router.push("/login");
    }
  }, []);

  const fetchPatients = async () => {
    try {
      const { data } = await api.get('/patients');
      setPatients(data);
    } catch (err) { console.log("No patients found yet."); }
  };

  const handleAiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAiForm({ ...aiForm, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setAiForm({ ...aiForm, [name]: value });
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiLoading(true);
    const payload = {
      name: aiForm.name,
      inputs: {
        gender: aiForm.gender, age: Number(aiForm.age),
        hypertension: Number(aiForm.hypertension), heart_disease: Number(aiForm.heart_disease),
        smoking_history: aiForm.smoking_history, bmi: Number(aiForm.bmi),
        HbA1c_level: Number(aiForm.HbA1c_level), blood_glucose_level: Number(aiForm.blood_glucose_level)
      }
    };
    try {
      const { data } = await api.post('/patients/predict', payload);
      setAiResult(data.prediction);
      fetchPatients();
    } catch (err: any) {
      alert("AI Prediction Failed");
    } finally { setAiLoading(false); }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
      <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="flex justify-between items-center mb-8 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 backdrop-blur-md sticky top-4 z-10 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
            {doctorName.startsWith('Dr.') ? doctorName : `Dr. ${doctorName}`}
          </h1>
          <p className="text-slate-400 text-sm">Clinical Decision Support System</p>
        </div>
        <div className="flex gap-4">
          {/* NEW INBOX BUTTON */}
          <Link href="/doctor/inbox">
            <Button variant="outline" className="border-slate-700 hover:bg-slate-800 text-white flex items-center gap-2">
              <MessageSquare size={18} className="text-teal-400" /> Inbox
            </Button>
          </Link>

          <Dialog open={isAiOpen} onOpenChange={setIsAiOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                <PlusCircle className="mr-2 h-4 w-4" /> New Assessment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] bg-slate-900 border-slate-800 text-white overflow-y-auto max-h-[90vh]">
              <DialogHeader><DialogTitle>Diabetes Risk Analysis</DialogTitle></DialogHeader>
              {!aiResult ? (
                <form onSubmit={handlePredict} className="grid grid-cols-2 gap-4 py-4">
                  <div className="col-span-2">
                    <Label className="text-slate-400 text-xs uppercase font-bold">Patient Name</Label>
                    <Input name="name" onChange={handleAiChange} className="bg-slate-800 border-slate-700 mt-1" required placeholder="Ex: John Doe" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs uppercase font-bold">Age</Label>
                    <Input name="age" type="number" onChange={handleAiChange} className="bg-slate-800 border-slate-700" required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs uppercase font-bold">Gender</Label>
                    <Select onValueChange={(val) => handleSelectChange("gender", val)} defaultValue="Female">
                      <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="Female">Female</SelectItem><SelectItem value="Male">Male</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label className="text-slate-400 text-xs uppercase font-bold">BMI</Label><Input name="bmi" type="number" step="0.1" onChange={handleAiChange} className="bg-slate-800 border-slate-700" required /></div>
                  <div className="space-y-1"><Label className="text-slate-400 text-xs uppercase font-bold">HbA1c Level</Label><Input name="HbA1c_level" type="number" step="0.1" onChange={handleAiChange} className="bg-slate-800 border-slate-700" required /></div>
                  <div className="space-y-1"><Label className="text-slate-400 text-xs uppercase font-bold">Blood Glucose</Label><Input name="blood_glucose_level" type="number" onChange={handleAiChange} className="bg-slate-800 border-slate-700" required /></div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs uppercase font-bold">Smoking History</Label>
                    <Select onValueChange={(val) => handleSelectChange("smoking_history", val)} defaultValue="never">
                      <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="never">Never</SelectItem><SelectItem value="current">Current</SelectItem><SelectItem value="former">Former</SelectItem><SelectItem value="No Info">No Info</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs uppercase font-bold">Hypertension</Label>
                    <Select onValueChange={(val) => handleSelectChange("hypertension", val)} defaultValue="0">
                      <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white"><SelectItem value="0">No</SelectItem><SelectItem value="1">Yes</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs uppercase font-bold">Heart Disease</Label>
                    <Select onValueChange={(val) => handleSelectChange("heart_disease", val)} defaultValue="0">
                      <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white"><SelectItem value="0">No</SelectItem><SelectItem value="1">Yes</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 mt-4"><Button type="submit" className="w-full bg-teal-600 h-12" disabled={aiLoading}>{aiLoading ? <Loader2 className="animate-spin" /> : "Run Risk Analysis"}</Button></div>
                </form>
              ) : (
                <div className="text-center py-6 space-y-6">
                  <div className={`text-7xl font-black ${aiResult.riskLevel === 'High' ? 'text-red-500' : 'text-emerald-400'}`}>{(aiResult.riskScore || 0).toFixed(1)}%</div>
                  <Button onClick={() => { setIsAiOpen(false); setAiResult(null); }} className="w-full border-slate-700 text-white hover:bg-slate-800">Close & Save</Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
          <Button variant="ghost" onClick={handleLogout} className="text-slate-400 hover:text-red-400"><LogOut className="h-5 w-5" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-slate-900 border-slate-800 text-white shadow-lg"><CardContent className="pt-6"><p className="text-sm text-slate-400">Total Scans</p><p className="text-3xl font-bold">{patients.length}</p></CardContent></Card>
        <Card className="bg-slate-900 border-slate-800 text-white shadow-lg"><CardContent className="pt-6"><p className="text-sm text-slate-400 text-red-400">High Risk Alerts</p><p className="text-3xl font-bold text-red-400">{patients.filter(p => p.prediction?.riskLevel === 'High').length}</p></CardContent></Card>
        <Card className="bg-slate-900 border-slate-800 text-white shadow-lg"><CardContent className="pt-6"><p className="text-sm text-slate-400 text-emerald-400">Healthy Cases</p><p className="text-3xl font-bold text-emerald-400">{patients.filter(p => p.prediction?.riskLevel === 'Low').length}</p></CardContent></Card>
      </div>

      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardHeader><CardTitle>Recent Patient Assessments</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {patients.map((p: any) => (
              <div key={p._id} onClick={() => router.push(`/doctor/patients/${p._id}`)} className="flex justify-between items-center p-4 border border-slate-800 rounded-lg hover:bg-slate-800/50 transition cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold">{p.name.charAt(0)}</div>
                  <div><p className="font-semibold text-white group-hover:text-blue-400 transition-colors">{p.name}</p><p className="text-xs text-slate-500">BMI: {p.inputs?.bmi} | Age: {p.inputs?.age}</p></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right"><p className="text-xs text-slate-500">Risk Probability</p><p className="font-mono font-bold text-lg">{(p.prediction?.riskScore || 0).toFixed(1)}%</p></div>
                  <div className={`px-4 py-1.5 rounded-full text-xs font-bold border ${p.prediction?.riskLevel === 'High' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{p.prediction?.riskLevel}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <ClinicalCoPilot />
    </div>
  );
}