"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HeartPulse, LogOut, Activity, CheckCircle, AlertTriangle, User, Loader2, RefreshCcw } from "lucide-react";
import api from "@/lib/api";
import ChatBox from "@/components/ChatBox";

export default function PatientDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [records, setRecords] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckOpen, setIsCheckOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  
  // Get user info for Chat
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};
  
  const [form, setForm] = useState({
    gender: "Female", 
    age: "", 
    hypertension: "0", 
    heart_disease: "0",
    smoking_history: "never", 
    bmi: "", 
    HbA1c_level: "", 
    blood_glucose_level: "",
    doctor_id: "" 
  });

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) { router.push("/login"); return; }
    
    try {
      const parsedUser = JSON.parse(userStr);
      if (parsedUser.role !== "patient") { router.push("/login"); return; }
      setUserName(parsedUser.name);
      
      const loadData = async () => {
        await fetchMyRecords();
        await fetchDoctors();
        setLoading(false);
      };
      loadData();
    } catch (e) {
      router.push("/login");
    }
  }, []);

  // Update form with previous static values when records are fetched
  useEffect(() => {
    if (records.length > 0) {
      const last = records[0].inputs;
      setForm(prev => ({
        ...prev,
        gender: last.gender,
        age: last.age.toString(),
        smoking_history: last.smoking_history,
        hypertension: last.hypertension.toString(),
        heart_disease: last.heart_disease.toString(),
        doctor_id: records[0].doctor_id || ""
      }));
    }
  }, [records]);

  const fetchDoctors = async () => {
    try {
      const { data } = await api.get('/auth/doctors');
      setDoctors(data);
    } catch (e) {
      console.log("Error loading doctors");
    }
  };

  const fetchMyRecords = async () => {
    try {
      const { data } = await api.get('/patients');
      setRecords(data);
    } catch (e) { 
      console.log("Error fetching records"); 
    }
  };

  const handleSelfCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    
    const payload = {
      name: userName,
      doctor_id: form.doctor_id,
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
      await fetchMyRecords();
      setIsCheckOpen(false);
    } catch (err) { 
      alert("Check failed. Ensure the AI and Backend servers are active."); 
    } finally { 
      setChecking(false); 
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin h-8 w-8" /></div>;

  const hasHistory = records.length > 0;
  const latestRecord = records[0];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="flex justify-between items-center mb-8 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-teal-400 italic tracking-tight">CliniqueAI</h1>
          <p className="text-slate-400 text-sm font-medium">Patient: {userName}</p>
        </div>
        <Button variant="ghost" onClick={() => { localStorage.clear(); router.push('/login'); }} className="text-slate-400 hover:text-red-500">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* LATEST STATUS */}
          <Card className="bg-slate-900 border-slate-800 text-white shadow-2xl">
            <CardHeader><CardTitle className="text-xs uppercase tracking-widest text-slate-500 font-bold">Latest Risk Assessment</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center py-10">
              {latestRecord ? (
                <div className="text-center animate-in fade-in zoom-in duration-500 w-full">
                  {/* HIGH PRECISION SCORE */}
                  <div className={`text-7xl font-black mb-2 ${latestRecord.prediction.riskLevel === 'High' ? 'text-red-500' : 'text-emerald-400'}`}>
                    {latestRecord.prediction.riskScore.toFixed(4)}%
                  </div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-tighter mb-8">
                    {latestRecord.prediction.riskLevel} Clinical Risk
                  </p>
                  
                  <div className="grid grid-cols-3 gap-6 w-full max-w-lg mx-auto">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Glucose</p>
                      <p className="text-2xl font-bold text-blue-400">{latestRecord.inputs.blood_glucose_level}</p>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">HbA1c</p>
                      <p className="text-2xl font-bold text-purple-400">{latestRecord.inputs.HbA1c_level}</p>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">BMI</p>
                      <p className="text-2xl font-bold text-orange-400">{latestRecord.inputs.bmi}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-slate-500 italic">No health records yet. Start your assessment now.</div>
              )}
            </CardContent>
          </Card>

          {/* CHAT INTEGRATION */}
{latestRecord?.doctor_id ? (
  <ChatBox 
    senderId={user.id} 
    senderName={user.name} 
    receiverId={latestRecord.doctor_id} 
    receiverName="Your Doctor" 
  />
) : (
  <div className="p-10 text-center text-slate-600 text-sm italic">
    Select a doctor during your next vital check to enable real-time consultation.
  </div>
)}
        </div>

        {/* SIDEBAR ACTIONS */}
        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800 text-white shadow-xl">
            <CardHeader><CardTitle className="text-sm font-bold">Actions</CardTitle></CardHeader>
            <CardContent>
              <Dialog open={isCheckOpen} onOpenChange={setIsCheckOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 h-16 text-lg font-bold shadow-lg shadow-blue-500/20">
                    <HeartPulse className="mr-2 h-6 w-6" /> {hasHistory ? "Update Vitals" : "New AI Check"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl">{hasHistory ? "Monitor Your Progress" : "Initial AI Setup"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSelfCheck} className="grid grid-cols-2 gap-4 py-4">
                    
                    {/* DOCTOR SELECT */}
                    <div className="col-span-2 space-y-2">
                      <Label className="text-xs text-slate-400 font-bold uppercase">Assign to Doctor</Label>
                      <Select onValueChange={(v) => setForm({...form, doctor_id: v})} defaultValue={form.doctor_id}>
                        <SelectTrigger className="bg-slate-800 border-slate-700">
                          <SelectValue placeholder="Select Doctor for Consultation" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                          {doctors.map((doc: any) => (
                            <SelectItem key={doc._id} value={doc._id}>{doc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-slate-400">Current Age</Label>
                      <Input type="number" value={form.age} onChange={e => setForm({...form, age: e.target.value})} className="bg-slate-800 border-slate-700" required />
                    </div>

                    {/* ONLY SHOW STATIC DATA IF NO HISTORY (SMART FORM) */}
                    {!hasHistory && (
                      <>
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-400">Gender</Label>
                          <Select onValueChange={(v) => setForm({...form, gender: v})} defaultValue={form.gender}>
                            <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Male">Male</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-400">Smoking History</Label>
                          <Select onValueChange={v => setForm({...form, smoking_history: v})} defaultValue={form.smoking_history}>
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
                          <Label className="text-xs text-slate-400">Hypertension</Label>
                          <Select onValueChange={v => setForm({...form, hypertension: v})} defaultValue={form.hypertension}>
                            <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700 text-white"><SelectItem value="0">No</SelectItem><SelectItem value="1">Yes</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-400">Heart Disease</Label>
                          <Select onValueChange={v => setForm({...form, heart_disease: v})} defaultValue={form.heart_disease}>
                            <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700 text-white"><SelectItem value="0">No</SelectItem><SelectItem value="1">Yes</SelectItem></SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    <div className="space-y-1">
                      <Label className="text-xs text-teal-400 font-bold uppercase">Blood Glucose</Label>
                      <Input type="number" onChange={e => setForm({...form, blood_glucose_level: e.target.value})} className="bg-slate-800 border-teal-900/50" required />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-teal-400 font-bold uppercase">HbA1c (%)</Label>
                      <Input type="number" step="0.1" onChange={e => setForm({...form, HbA1c_level: e.target.value})} className="bg-slate-800 border-teal-900/50" required />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-teal-400 font-bold uppercase">BMI</Label>
                      <Input type="number" step="0.1" onChange={e => setForm({...form, bmi: e.target.value})} className="bg-slate-800 border-teal-900/50" required />
                    </div>

                    <div className="col-span-2 mt-4">
                      <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 h-12 font-bold" disabled={checking}>
                        {checking ? <Loader2 className="animate-spin mr-2" /> : "Run AI Prediction"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* ANALYSIS HISTORY */}
          <Card className="bg-slate-900 border-slate-800 text-white flex-1 overflow-hidden shadow-xl">
             <CardHeader className="p-4 border-b border-slate-800 flex flex-row justify-between items-center">
               <CardTitle className="text-[10px] text-slate-500 uppercase font-black tracking-widest">History</CardTitle>
               <RefreshCcw className="h-3 w-3 text-slate-500 cursor-pointer" onClick={fetchMyRecords} />
             </CardHeader>
             <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                {records.map((r, i) => (
                  <div key={i} className="flex justify-between items-center p-4 border-b border-slate-800 hover:bg-slate-800/20 transition-colors">
                    <div>
                       <p className="text-[10px] text-slate-500 font-mono">{new Date(r.createdAt).toLocaleDateString()}</p>
                       <p className="text-xs font-bold text-slate-300 italic">Self Check #{records.length - i}</p>
                    </div>
                    <div className="text-right">
                       <p className={`text-sm font-black ${r.prediction.riskLevel === 'High' ? 'text-red-400' : 'text-emerald-400'}`}>
                         {r.prediction.riskScore.toFixed(2)}%
                       </p>
                       <p className="text-[8px] uppercase tracking-tighter text-slate-500 font-bold">{r.prediction.riskLevel} Risk</p>
                    </div>
                  </div>
                ))}
                {records.length === 0 && <p className="p-10 text-center text-xs text-slate-600">No previous analyses.</p>}
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}