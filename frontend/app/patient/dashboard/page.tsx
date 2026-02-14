"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  HeartPulse, 
  LogOut, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  User, 
  Loader2, 
  RefreshCcw, 
  FileDown 
} from "lucide-react";
import api from "@/lib/api";
import ChatBox from "@/components/ChatBox";
import { generatePatientReport } from "@/lib/generatePDF";

export default function PatientDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [records, setRecords] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckOpen, setIsCheckOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  
  // Get user info from localStorage safely
  const [user, setUser] = useState<any>({});

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
      setUser(parsedUser);
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

  // PERSISTENCE: Auto-fill form with static values from previous history
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

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
      <Loader2 className="animate-spin h-8 w-8 text-teal-500" />
    </div>
  );

  const hasHistory = records.length > 0;
  const latestRecord = records[0];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Navbar Header */}
      <div className="flex justify-between items-center mb-8 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold text-teal-400 italic tracking-tight">CliniqueAI</h1>
          <p className="text-slate-400 text-sm font-medium">Patient Dashboard: {userName}</p>
        </div>
        <Button variant="ghost" onClick={() => { localStorage.clear(); router.push('/login'); }} className="text-slate-400 hover:text-red-500">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* LATEST STATUS CARD */}
          <Card className="bg-slate-900 border-slate-800 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-blue-500"></div>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xs uppercase tracking-widest text-slate-500 font-black">Latest Medical Assessment</CardTitle>
              {latestRecord && (
                <Button 
                  onClick={() => generatePatientReport(latestRecord)}
                  size="sm" 
                  variant="outline" 
                  className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 h-8 text-[10px] font-black uppercase"
                >
                  <FileDown className="mr-1 h-3 w-3" /> Get Report PDF
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex flex-col items-center py-10">
              {latestRecord ? (
                <div className="text-center animate-in fade-in zoom-in duration-500 w-full">
                  {/* HIGH PRECISION SCORE */}
                  <div className={`text-7xl font-black mb-2 tracking-tighter ${latestRecord.prediction.riskLevel === 'High' ? 'text-red-500' : 'text-emerald-400'}`}>
                    {latestRecord.prediction.riskScore.toFixed(4)}%
                  </div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] mb-8">
                    {latestRecord.prediction.riskLevel} Clinical Risk
                  </p>
                  
                  <div className="grid grid-cols-3 gap-6 w-full max-w-lg mx-auto">
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-inner">
                      <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Glucose</p>
                      <p className="text-2xl font-bold text-blue-400 font-mono">{latestRecord.inputs.blood_glucose_level}</p>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-inner">
                      <p className="text-[10px] text-slate-500 uppercase font-black mb-1">HbA1c</p>
                      <p className="text-2xl font-bold text-purple-400 font-mono">{latestRecord.inputs.HbA1c_level}</p>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-inner">
                      <p className="text-[10px] text-slate-500 uppercase font-black mb-1">BMI</p>
                      <p className="text-2xl font-bold text-orange-400 font-mono">{latestRecord.inputs.bmi}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-slate-500 italic text-center">
                   <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
                   <p>No health records established yet. Proceed to AI analysis.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CHAT INTEGRATION */}
          {latestRecord?.doctor_id ? (
            <div className="animate-in slide-in-from-bottom-4 duration-700">
              <ChatBox 
                senderId={user.id || user._id} 
                senderName={user.name} 
                receiverId={latestRecord.doctor_id} 
                receiverName="Assigned Physician" 
              />
            </div>
          ) : (
            <div className="p-10 bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-800 text-center flex flex-col items-center gap-2">
              <User className="h-8 w-8 text-slate-700" />
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Consultation Disabled</p>
              <p className="text-[10px] text-slate-600">Select a doctor during your next update to enable secure messaging.</p>
            </div>
          )}
        </div>

        {/* SIDEBAR ACTIONS */}
        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800 text-white shadow-xl border-t-4 border-t-blue-600">
            <CardHeader><CardTitle className="text-xs uppercase font-black tracking-widest text-slate-400">Clinical Actions</CardTitle></CardHeader>
            <CardContent>
              <Dialog open={isCheckOpen} onOpenChange={setIsCheckOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 h-16 text-lg font-black tracking-tighter shadow-lg shadow-blue-500/20">
                    <HeartPulse className="mr-2 h-6 w-6" /> {hasHistory ? "UPDATE VITALS" : "RUN AI ANALYSIS"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[550px] max-h-[90vh] overflow-y-auto shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black italic">{hasHistory ? "Routine Vital Check" : "AI Health Onboarding"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSelfCheck} className="grid grid-cols-2 gap-4 py-4">
                    
                    <div className="col-span-2 space-y-2">
                      <Label className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Consulting Physician</Label>
                      <Select onValueChange={(v) => setForm({...form, doctor_id: v})} defaultValue={form.doctor_id}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 h-12">
                          <SelectValue placeholder="Select Doctor to share results" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                          {doctors.map((doc: any) => (
                            <SelectItem key={doc._id} value={doc._id}>{doc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] text-slate-400 font-bold uppercase">Age</Label>
                      <Input type="number" value={form.age} onChange={e => setForm({...form, age: e.target.value})} className="bg-slate-800 border-slate-700" required />
                    </div>

                    {!hasHistory && (
                      <>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-slate-400 font-bold uppercase">Gender</Label>
                          <Select onValueChange={(v) => setForm({...form, gender: v})} defaultValue={form.gender}>
                            <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-slate-800 text-white">
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Male">Male</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-slate-400 font-bold uppercase">Smoking</Label>
                          <Select onValueChange={v => setForm({...form, smoking_history: v})} defaultValue={form.smoking_history}>
                            <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-slate-800 text-white">
                              <SelectItem value="never">Never</SelectItem>
                              <SelectItem value="current">Current</SelectItem>
                              <SelectItem value="former">Former</SelectItem>
                              <SelectItem value="No Info">No Info</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-slate-400 font-bold uppercase">Hypertension</Label>
                          <Select onValueChange={v => setForm({...form, hypertension: v})} defaultValue={form.hypertension}>
                            <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-slate-800 text-white"><SelectItem value="0">No</SelectItem><SelectItem value="1">Yes</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-slate-400 font-bold uppercase">Heart Disease</Label>
                          <Select onValueChange={v => setForm({...form, heart_disease: v})} defaultValue={form.heart_disease}>
                            <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-slate-800 text-white"><SelectItem value="0">No</SelectItem><SelectItem value="1">Yes</SelectItem></SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    <div className="space-y-1">
                      <Label className="text-[10px] text-teal-400 font-black uppercase">Glucose (mg/dL)</Label>
                      <Input type="number" onChange={e => setForm({...form, blood_glucose_level: e.target.value})} className="bg-slate-800 border-teal-900/50" required />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-teal-400 font-black uppercase">HbA1c (%)</Label>
                      <Input type="number" step="0.1" onChange={e => setForm({...form, HbA1c_level: e.target.value})} className="bg-slate-800 border-teal-900/50" required />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-teal-400 font-black uppercase">BMI Index</Label>
                      <Input type="number" step="0.1" onChange={e => setForm({...form, bmi: e.target.value})} className="bg-slate-800 border-teal-900/50" required />
                    </div>

                    <div className="col-span-2 mt-4">
                      <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-500 h-14 font-black tracking-widest border-b-4 border-teal-800 active:border-b-0 active:translate-y-1 transition-all" disabled={checking}>
                        {checking ? <Loader2 className="animate-spin mr-2" /> : "EXECUTE AI ANALYSIS"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* ANALYSIS HISTORY LIST */}
          <Card className="bg-slate-900 border-slate-800 text-white flex-1 overflow-hidden shadow-xl border-t-4 border-t-emerald-600">
             <CardHeader className="p-4 border-b border-slate-800 flex flex-row justify-between items-center">
               <CardTitle className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Longitudinal History</CardTitle>
               <RefreshCcw className="h-3 w-3 text-slate-500 cursor-pointer hover:rotate-180 transition-transform duration-500" onClick={fetchMyRecords} />
             </CardHeader>
             <CardContent className="p-0 max-h-[350px] overflow-y-auto">
                {records.map((r, i) => (
                  <div key={i} className="flex justify-between items-center p-4 border-b border-slate-800 hover:bg-slate-800/20 transition-all group">
                    <div>
                       <p className="text-[10px] text-slate-500 font-mono group-hover:text-teal-500">{new Date(r.createdAt).toLocaleDateString()}</p>
                       <p className="text-xs font-black text-slate-400 uppercase tracking-tighter italic">Trial #{records.length - i}</p>
                    </div>
                    <div className="text-right">
                       <p className={`text-sm font-black ${r.prediction.riskLevel === 'High' ? 'text-red-400' : 'text-emerald-400'}`}>
                         {r.prediction.riskScore.toFixed(2)}%
                       </p>
                       <p className="text-[8px] uppercase font-black text-slate-600 tracking-widest">{r.prediction.riskLevel} Risk</p>
                    </div>
                  </div>
                ))}
                {records.length === 0 && <p className="p-10 text-center text-[10px] text-slate-600 uppercase font-bold">Waiting for primary data...</p>}
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}