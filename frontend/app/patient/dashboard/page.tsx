"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HeartPulse, LogOut, Activity, CheckCircle, AlertTriangle, FileText, Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function PatientDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Self Check Form State
  const [isCheckOpen, setIsCheckOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  
  // Matches your Diabetes Dataset Schema
  const [form, setForm] = useState({
    gender: "Female", age: "", hypertension: "0", heart_disease: "0",
    smoking_history: "never", bmi: "", HbA1c_level: "", blood_glucose_level: ""
  });

  useEffect(() => {
    // 1. Auth Check
    const userStr = localStorage.getItem("user");
    if (!userStr) { router.push("/login"); return; }
    
    try {
      const user = JSON.parse(userStr);
      if (user.role !== "patient") { router.push("/login"); return; }
      setUserName(user.name);
      fetchMyRecords();
    } catch (e) {
      router.push("/login");
    }
  }, []);

  const fetchMyRecords = async () => {
    try {
      // This calls the SAME backend route, but the controller filters by patient_id
      const { data } = await api.get('/patients');
      setRecords(data);
    } catch (e) { 
      console.log("Error fetching records"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleSelfCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    
    // Construct Payload matching Backend Schema
    const payload = {
      name: userName, // Self-check name
      inputs: {
        gender: form.gender,
        age: Number(form.age),
        hypertension: Number(form.hypertension),
        heart_disease: Number(form.heart_disease),
        smoking_history: form.smoking_history,
        bmi: Number(form.bmi),
        HbA1c_level: Number(form.HbA1c_level),
        blood_glucose_level: Number(form.blood_glucose_level)
      }
    };

    try {
      await api.post('/patients/predict', payload);
      fetchMyRecords(); // Refresh UI
      setIsCheckOpen(false);
    } catch (err) { 
      alert("Check failed. Please try again."); 
    } finally { 
      setChecking(false); 
    }
  };

  // Helper for "Patient-Friendly" advice
  const getAdvice = (riskLevel: string) => {
    if (riskLevel === 'High') return "We noticed some values are out of range. It is highly recommended to schedule a visit with your doctor for a detailed review.";
    return "Great news! Your vitals are within a healthy range. Keep up the good work with your diet and exercise.";
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

  const latestRecord = records[0]; // Most recent record

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-teal-400">Hello, {userName}</h1>
          <p className="text-slate-400 text-sm">Your Personal Health Dashboard</p>
        </div>
        <Button variant="ghost" onClick={() => { localStorage.clear(); router.push('/login'); }} className="text-slate-400 hover:text-white">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LEFT: Current Status (The "Traffic Light") */}
        <Card className="bg-slate-900 border-slate-800 text-white md:col-span-2 lg:col-span-1 h-full">
          <CardHeader><CardTitle>Current Health Status</CardTitle></CardHeader>
          <CardContent className="text-center py-8">
            {latestRecord ? (
              <div className="animate-in zoom-in duration-500">
                <div className="mb-6 flex justify-center">
                  <div className={`rounded-full p-6 ${latestRecord.prediction.riskLevel === 'High' ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                    {latestRecord.prediction.riskLevel === 'High' 
                      ? <AlertTriangle className="h-16 w-16 text-red-500 animate-pulse" />
                      : <CheckCircle className="h-16 w-16 text-green-500" />
                    }
                  </div>
                </div>
                
                <h2 className={`text-4xl font-bold mb-3 ${latestRecord.prediction.riskLevel === 'High' ? 'text-red-400' : 'text-green-400'}`}>
                  {latestRecord.prediction.riskLevel} Risk
                </h2>
                
                <p className="text-slate-300 mb-8 leading-relaxed px-4">
                  {getAdvice(latestRecord.prediction.riskLevel)}
                </p>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="block text-slate-500 text-xs uppercase mb-1">Glucose</span>
                    <span className="font-bold text-lg text-blue-400">{latestRecord.inputs.blood_glucose_level}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="block text-slate-500 text-xs uppercase mb-1">HbA1c</span>
                    <span className="font-bold text-lg text-purple-400">{latestRecord.inputs.HbA1c_level}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="block text-slate-500 text-xs uppercase mb-1">BMI</span>
                    <span className="font-bold text-lg text-orange-400">{latestRecord.inputs.bmi}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12">
                <p className="text-slate-500 mb-6">No health records found yet.</p>
                <Button onClick={() => setIsCheckOpen(true)} className="bg-teal-600 hover:bg-teal-700">
                  Run First Check
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* RIGHT: Actions & History */}
        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardHeader><CardTitle>Recommended Actions</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
                <Activity className="h-6 w-6 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-white">Daily Activity</h4>
                  <p className="text-xs text-slate-400 mt-1">Aim for 30 mins of moderate walking today to help regulate glucose.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
                <FileText className="h-6 w-6 text-purple-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-white">Latest Report</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Checked on {latestRecord ? new Date(latestRecord.createdAt).toLocaleDateString() : "N/A"}.
                  </p>
                </div>
              </div>
              
              <Dialog open={isCheckOpen} onOpenChange={setIsCheckOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 shadow-lg shadow-blue-500/20">
                    <HeartPulse className="mr-2 h-4 w-4" /> Run Self Check
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>New Self Health Check</DialogTitle></DialogHeader>
                    <form onSubmit={handleSelfCheck} className="grid grid-cols-2 gap-4 py-4">
                      
                      <div className="space-y-1">
                        <Label>Age</Label>
                        <Input type="number" onChange={e => setForm({...form, age: e.target.value})} className="bg-slate-800 border-slate-700" required />
                      </div>
                      <div className="space-y-1">
                        <Label>Gender</Label>
                        <Select onValueChange={(v) => setForm({...form, gender: v})} defaultValue="Female">
                           <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                           <SelectContent className="bg-slate-800 border-slate-700 text-white">
                             <SelectItem value="Female">Female</SelectItem><SelectItem value="Male">Male</SelectItem>
                           </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label>Glucose (mg/dL)</Label>
                        <Input type="number" onChange={e => setForm({...form, blood_glucose_level: e.target.value})} className="bg-slate-800 border-slate-700" required placeholder="Ex: 140" />
                      </div>

                      <div className="space-y-1">
                        <Label>HbA1c</Label>
                        <Input type="number" step="0.1" onChange={e => setForm({...form, HbA1c_level: e.target.value})} className="bg-slate-800 border-slate-700" required placeholder="Ex: 6.5" />
                      </div>

                      <div className="space-y-1">
                        <Label>BMI</Label>
                        <Input type="number" step="0.1" onChange={e => setForm({...form, bmi: e.target.value})} className="bg-slate-800 border-slate-700" required placeholder="Ex: 27.5" />
                      </div>

                       <div className="space-y-1">
                        <Label>Smoking</Label>
                        <Select onValueChange={v => setForm({...form, smoking_history: v})} defaultValue="never">
                          <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700 text-white">
                            <SelectItem value="never">Never</SelectItem><SelectItem value="current">Current</SelectItem><SelectItem value="former">Former</SelectItem><SelectItem value="No Info">No Info</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-2 mt-2">
                        <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 h-11" disabled={checking}>
                          {checking ? <Loader2 className="animate-spin" /> : "Analyze Health"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
          
          {/* History List (Simple) */}
          <Card className="bg-slate-900 border-slate-800 text-white flex-1">
            <CardHeader><CardTitle>Past Checkups</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {records.slice(0, 3).map((r, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-sm text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${r.prediction.riskLevel === 'High' ? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'}`}>
                      {r.prediction.riskLevel}
                    </span>
                  </div>
                ))}
                {records.length === 0 && <p className="text-slate-500 text-sm">No history yet.</p>}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}