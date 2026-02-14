"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LogOut,
  Loader2,
  PlusCircle,
  MessageSquare,
  RefreshCcw,
  Trash2
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import api from "@/lib/api";
import ClinicalCoPilot from "@/components/ClinicalCoPilot"; // From Friend's code

export default function DoctorDashboard() {
  const router = useRouter();

  // DELETE STATE
  const [patientToDelete, setPatientToDelete] = useState<any | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  // DELETE PATIENT HANDLER
  const initiateDelete = (e: React.MouseEvent, patient: any) => {
    e.stopPropagation();
    setPatientToDelete(patient);
    setDeleteConfirmation(""); // Reset input
  };

  const confirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!patientToDelete) return;

    try {
      await api.delete(`/patients/${encodeURIComponent(patientToDelete.name)}`);
      setPatientToDelete(null);
      await fetchPatients();
    } catch (err) {
      alert("Failed to delete patient records.");
    }
  };
  const [doctorName, setDoctorName] = useState("");
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<any[]>([]);

  // AI Modal States
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  // AI Form State
  const [aiForm, setAiForm] = useState({
    name: "", gender: "Female", age: "", hypertension: "0",
    heart_disease: "0", smoking_history: "never", bmi: "",
    HbA1c_level: "", blood_glucose_level: ""
  });

  // STRENGTHENED FETCH (Your logic: Cache-busting and spread-state update)
  const fetchPatients = useCallback(async () => {
    try {
      const { data } = await api.get(`/patients?refresh=${Date.now()}`);
      setPatients([...data]);
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) { router.push("/login"); return; }

    try {
      const user = JSON.parse(userStr);
      if (user.role !== "doctor") { router.push("/login"); return; }
      setDoctorName(user.name);
      fetchPatients();
    } catch (e) {
      localStorage.clear();
      router.push("/login");
    }
  }, [fetchPatients, router]);

  const handleAiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAiForm({ ...aiForm, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setAiForm({ ...aiForm, [name]: value });
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiLoading(true);

    // .trim() prevents duplicate rows caused by accidental spaces (Your logic)
    const payload = {
      name: aiForm.name.trim(),
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

      // Update dashboard row immediately (Your logic)
      await fetchPatients();
    } catch (err: any) {
      alert("AI Prediction Failed. Check server connection.");
    } finally {
      setAiLoading(false);
    }
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
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 backdrop-blur-md sticky top-4 z-10 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
            {doctorName.startsWith('Dr.') ? doctorName : `Dr. ${doctorName}`}
          </h1>
          <p className="text-slate-400 text-sm">Case Management Portal</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={fetchPatients} variant="ghost" className="text-slate-400 hover:text-teal-400">
            <RefreshCcw size={18} className={aiLoading ? "animate-spin" : ""} />
          </Button>

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
              <DialogHeader><DialogTitle className="text-xl font-bold italic">Patient Risk Profiling</DialogTitle></DialogHeader>
              {!aiResult ? (
                <form onSubmit={handlePredict} className="grid grid-cols-2 gap-4 py-4">
                  <div className="col-span-2">
                    <Label className="text-slate-400 text-xs uppercase font-bold">Full Name</Label>
                    <Input name="name" value={aiForm.name} onChange={handleAiChange} className="bg-slate-800 border-slate-700 mt-1" required placeholder="Use exact name to update existing record" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs uppercase font-bold">Age</Label>
                    <Input name="age" value={aiForm.age} type="number" onChange={handleAiChange} className="bg-slate-800 border-slate-700" required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs uppercase font-bold">Gender</Label>
                    <Select onValueChange={(val) => handleSelectChange("gender", val)} value={aiForm.gender}>
                      <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="Female">Female</SelectItem><SelectItem value="Male">Male</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label className="text-slate-400 text-xs uppercase font-bold">BMI</Label><Input name="bmi" value={aiForm.bmi} type="number" step="0.1" onChange={handleAiChange} className="bg-slate-800 border-slate-700" required /></div>
                  <div className="space-y-1"><Label className="text-slate-400 text-xs uppercase font-bold">HbA1c Level</Label><Input name="HbA1c_level" value={aiForm.HbA1c_level} type="number" step="0.1" onChange={handleAiChange} className="bg-slate-800 border-slate-700" required /></div>
                  <div className="space-y-1"><Label className="text-slate-400 text-xs uppercase font-bold">Glucose</Label><Input name="blood_glucose_level" value={aiForm.blood_glucose_level} type="number" onChange={handleAiChange} className="bg-slate-800 border-slate-700" required /></div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs uppercase font-bold">Smoking History</Label>
                    <Select onValueChange={(val) => handleSelectChange("smoking_history", val)} value={aiForm.smoking_history}>
                      <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="never">Never</SelectItem>
                        <SelectItem value="current">Current</SelectItem>
                        <SelectItem value="former">Former</SelectItem>
                        <SelectItem value="No Info">No Info</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs uppercase font-bold">Hypertension</Label>
                    <Select onValueChange={(val) => handleSelectChange("hypertension", val)} value={aiForm.hypertension}>
                      <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white"><SelectItem value="0">No</SelectItem><SelectItem value="1">Yes</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs uppercase font-bold">Heart Disease</Label>
                    <Select onValueChange={(val) => handleSelectChange("heart_disease", val)} value={aiForm.heart_disease}>
                      <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white"><SelectItem value="0">No</SelectItem><SelectItem value="1">Yes</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 mt-4"><Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 h-12 font-bold" disabled={aiLoading}>{aiLoading ? <Loader2 className="animate-spin" /> : "EXECUTE ANALYSIS"}</Button></div>
                </form>
              ) : (
                <div className="text-center py-6 space-y-6 animate-in zoom-in duration-300">
                  <div className={`text-7xl font-black ${aiResult.riskLevel === 'High' ? 'text-red-500' : 'text-emerald-400'}`}>{(aiResult.riskScore || 0).toFixed(4)}%</div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">{aiResult.riskLevel} Clinical Risk Detected</div>
                    {aiResult.confidenceLabel && (
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${aiResult.confidenceLabel === 'High' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                          aiResult.confidenceLabel === 'Moderate' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                            'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                        Model Confidence: {aiResult.confidenceLabel}
                      </div>
                    )}
                  </div>
                  <Button onClick={() => { setIsAiOpen(false); setAiResult(null); }} className="w-full border-slate-700 text-white hover:bg-slate-800">Close & Save to History</Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
          <Button variant="ghost" onClick={handleLogout} className="text-slate-400 hover:text-red-400"><LogOut className="h-5 w-5" /></Button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-slate-900 border-slate-800 text-white shadow-lg border-t-2 border-t-blue-500"><CardContent className="pt-6"><p className="text-[10px] uppercase font-bold text-slate-500">Unique Clinical Records</p><p className="text-3xl font-black">{patients.length}</p></CardContent></Card>
        <Card className="bg-slate-900 border-slate-800 text-white shadow-lg border-t-2 border-t-red-500"><CardContent className="pt-6"><p className="text-[10px] uppercase font-bold text-red-500">Critical Alerts</p><p className="text-3xl font-black text-red-400">{patients.filter(p => p.prediction?.riskLevel === 'High').length}</p></CardContent></Card>
        <Card className="bg-slate-900 border-slate-800 text-white shadow-lg border-t-2 border-t-emerald-500"><CardContent className="pt-6"><p className="text-[10px] uppercase font-bold text-emerald-500">Managed Cases</p><p className="text-3xl font-black text-emerald-400">{patients.filter(p => p.prediction?.riskLevel === 'Low').length}</p></CardContent></Card>
      </div>

      {/* Active Patient Directory */}
      <Card className="bg-slate-900 border-slate-800 text-white shadow-2xl">
        <CardHeader className="border-b border-slate-800/50 flex justify-between items-center flex-row">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Active Patient Directory</CardTitle>
          <p className="text-[10px] text-slate-600 font-bold uppercase">Sync Status: Real-time</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col">
            {patients.length === 0 ? (
              <div className="text-center py-20 text-slate-600 italic">No managed clinical records found in this view.</div>
            ) : (
              patients.map((p: any) => (
                <div
                  key={p._id}
                  onClick={() => router.push(`/doctor/patients/${p._id}`)}
                  className="flex justify-between items-center p-6 border-b border-slate-800 hover:bg-slate-800/20 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400 font-black shadow-inner">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-white group-hover:text-blue-400 transition-colors">{p.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">LATEST: HbA1c {p.inputs?.HbA1c_level}% | BMI {p.inputs?.bmi} | Glucose {p.inputs?.blood_glucose_level}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-bold">RISK INDEX</p>
                      <p className="font-black text-xl font-mono">{(p.prediction?.riskScore || 0).toFixed(4)}%</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-tighter border ${p.prediction?.riskLevel === 'High'
                        ? 'bg-red-500/10 border-red-500/30 text-red-500'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        }`}>
                        {p.prediction?.riskLevel} Risk
                      </div>

                      {/* DELETE BUTTON (Your logic) */}
                      {/* DELETE BUTTON (Triggers controlled dialog) */}
                      <Button
                        onClick={(e) => initiateDelete(e, p)}
                        variant="ghost"
                        size="icon"
                        className="text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      {/* Controlled Delete Alert Dialog */}
      <AlertDialog open={!!patientToDelete} onOpenChange={(open) => !open && setPatientToDelete(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-red-500">Delete {patientToDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This action is <span className="text-red-400 font-bold">irreversible</span>.
              <br />Please type <span className="font-mono text-white bg-slate-800 px-1 rounded">{patientToDelete?.name}</span> to confirm.
            </AlertDialogDescription>
            <Input
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="Type patient name to confirm"
              className="bg-slate-950 border-slate-700 text-white mt-4 focus:ring-red-500/50"
            />
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={() => setPatientToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteConfirmation !== patientToDelete?.name}
              className="bg-red-600 text-white hover:bg-red-700 border-none font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clinical CoPilot (Friend's logic) */}
      <ClinicalCoPilot />
    </div>
  );
}