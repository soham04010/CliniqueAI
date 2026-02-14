"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Activity, Calendar, LogOut, Loader2, PlusCircle, AlertTriangle, CheckCircle } from "lucide-react";
import api from "@/lib/api";

export default function DoctorDashboard() {
  const router = useRouter();
  const [doctorName, setDoctorName] = useState("");
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<any[]>([]);
  
  // AI Modal States
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  
  // AI Form State (Matches Diabetes Dataset)
  const [aiForm, setAiForm] = useState({
    name: "",
    gender: "Female",
    age: "",
    hypertension: "0",
    heart_disease: "0",
    smoking_history: "never",
    bmi: "",
    HbA1c_level: "",
    blood_glucose_level: ""
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    
    if (!token || !userStr) {
      router.push("/login");
      return;
    }
    
    try {
      const user = JSON.parse(userStr);
      if (user.role !== "doctor") {
        router.push("/login"); 
        return;
      }
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
    } catch (err) {
      console.log("No patients found yet.");
    }
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
    setAiResult(null);

    // Payload strictly matching Backend Schema
    const payload = {
      name: aiForm.name,
      inputs: {
        gender: aiForm.gender,
        age: Number(aiForm.age),
        hypertension: Number(aiForm.hypertension),
        heart_disease: Number(aiForm.heart_disease),
        smoking_history: aiForm.smoking_history,
        bmi: Number(aiForm.bmi),
        HbA1c_level: Number(aiForm.HbA1c_level),
        blood_glucose_level: Number(aiForm.blood_glucose_level)
      }
    };

    try {
      const { data } = await api.post('/patients/predict', payload);
      setAiResult(data.prediction);
      fetchPatients(); // Refresh list immediately
    } catch (err: any) {
      alert("AI Prediction Failed: " + (err.response?.data?.message || err.message));
    } finally {
      setAiLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 backdrop-blur-md sticky top-4 z-10 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
            {doctorName.startsWith('Dr.') ? doctorName : `Dr. ${doctorName}`}
          </h1>
          <p className="text-slate-400 text-sm">Clinical Decision Support System</p>
        </div>
        <div className="flex gap-4">
          
          {/* AI PREDICTION MODAL */}
          <Dialog open={isAiOpen} onOpenChange={setIsAiOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                <PlusCircle className="mr-2 h-4 w-4" /> New Assessment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] bg-slate-900 border-slate-800 text-white overflow-y-auto max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Diabetes Risk Analysis</DialogTitle>
              </DialogHeader>
              
              {!aiResult ? (
                <form onSubmit={handlePredict} className="grid grid-cols-2 gap-4 py-4">
                  
                  {/* Personal Info */}
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
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Male">Male</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Vitals (Matches Dataset) */}
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs uppercase font-bold">BMI</Label>
                    <Input name="bmi" type="number" step="0.1" onChange={handleAiChange} className="bg-slate-800 border-slate-700" required placeholder="Ex: 27.5" />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs uppercase font-bold">HbA1c Level</Label>
                    <Input name="HbA1c_level" type="number" step="0.1" onChange={handleAiChange} className="bg-slate-800 border-slate-700" required placeholder="Ex: 6.5" />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs uppercase font-bold">Blood Glucose</Label>
                    <Input name="blood_glucose_level" type="number" onChange={handleAiChange} className="bg-slate-800 border-slate-700" required placeholder="Ex: 140" />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs uppercase font-bold">Smoking History</Label>
                    <Select onValueChange={(val) => handleSelectChange("smoking_history", val)} defaultValue="never">
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
                    <Select onValueChange={(val) => handleSelectChange("hypertension", val)} defaultValue="0">
                      <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="0">No</SelectItem>
                        <SelectItem value="1">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs uppercase font-bold">Heart Disease</Label>
                    <Select onValueChange={(val) => handleSelectChange("heart_disease", val)} defaultValue="0">
                      <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="0">No</SelectItem>
                        <SelectItem value="1">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-2 mt-4">
                    <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 h-12 text-lg shadow-lg shadow-teal-500/20" disabled={aiLoading}>
                      {aiLoading ? <Loader2 className="animate-spin mr-2" /> : "Run Risk Analysis"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-6 space-y-6 animate-in fade-in zoom-in duration-300">
                  <div>
                    <h3 className="text-slate-400 uppercase text-xs font-bold tracking-widest mb-2">Predicted Risk Probability</h3>
                    <div className={`text-7xl font-black ${aiResult.riskLevel === 'High' ? 'text-red-500' : 'text-emerald-400'}`}>
                      {aiResult.riskScore.toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className={`p-6 rounded-xl border ${aiResult.riskLevel === 'High' ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {aiResult.riskLevel === 'High' ? <AlertTriangle className="text-red-500 h-6 w-6" /> : <CheckCircle className="text-emerald-500 h-6 w-6" />}
                      <span className={`text-2xl font-bold ${aiResult.riskLevel === 'High' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {aiResult.riskLevel} Risk Detected
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                      {aiResult.riskLevel === 'High' 
                        ? "Patient shows significant indicators for diabetes. Immediate lifestyle intervention and clinical review of HbA1c levels recommended." 
                        : "Patient vitals are currently within a manageable range. Continue routine monitoring and encourage healthy habits."}
                    </p>
                  </div>

                  <Button onClick={() => { setIsAiOpen(false); setAiResult(null); }} variant="outline" className="w-full border-slate-700 text-white hover:bg-slate-800 h-11">
                    Close & Save to Patient History
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Button variant="ghost" onClick={handleLogout} className="text-slate-400 hover:text-red-400 hover:bg-red-900/10">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-slate-900 border-slate-800 text-white hover:border-blue-500/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Scans</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{patients.length}</div></CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-800 text-white hover:border-red-500/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">High Risk Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-400">
              {patients.filter(p => p.prediction?.riskLevel === 'High').length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white hover:border-emerald-500/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Healthy Cases</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-400">
              {patients.filter(p => p.prediction?.riskLevel === 'Low').length}
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Recent Patients Table */}
      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardHeader>
          <CardTitle>Recent Patient Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {patients.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-xl">
                <p className="text-slate-500">No patient records found.</p>
                <p className="text-xs text-slate-600 mt-1">Click "New Risk Assessment" to start.</p>
              </div>
            ) : (
              patients.map((p: any) => (
                <div 
                  key={p._id} 
                  onClick={() => router.push(`/doctor/patients/${p._id}`)} // LINK TO DETAILS
                  className="flex justify-between items-center p-4 border border-slate-800 rounded-lg hover:bg-slate-800/50 transition cursor-pointer group"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-white group-hover:text-blue-400 transition-colors">{p.name}</p>
                        <p className="text-xs text-slate-500">
                          HbA1c: <span className="text-slate-300">{p.inputs?.HbA1c_level}</span> | 
                          BMI: <span className="text-slate-300">{p.inputs?.bmi}</span> | 
                          Age: <span className="text-slate-300">{p.inputs?.age}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Risk Probability</p>
                      <p className="font-mono font-bold text-lg">{p.prediction?.riskScore.toFixed(1)}%</p>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border ${
                      p.prediction?.riskLevel === 'High' 
                        ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}>
                      {p.prediction?.riskLevel === 'High' ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                      {p.prediction?.riskLevel}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}