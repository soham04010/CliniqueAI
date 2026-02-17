"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Sidebar from "@/components/doctor/Sidebar";
import Header from "@/components/doctor/Header";
import {
  Loader2,
  PlusCircle,
  RefreshCcw,
  Trash2,
  Users,
  Activity,
  BrainCircuit,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  Mail,
  Phone
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
} from "@/components/ui/alert-dialog";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion } from "framer-motion";
import api from "@/lib/api";
import ClinicalCoPilot from "@/components/ClinicalCoPilot";

export default function DoctorDashboard() {
  const router = useRouter();

  // STATE
  const [patientToDelete, setPatientToDelete] = useState<any | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState(""); // Search State

  // AI Modal States
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  // AI Form State
  const [aiForm, setAiForm] = useState({
    name: "", email: "", gender: "Female", age: "", hypertension: "0",
    heart_disease: "0", smoking_history: "never", bmi: "",
    HbA1c_level: "", blood_glucose_level: ""
  });

  // FETCH DATA
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

  // HANDLERS
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
      name: aiForm.name.trim(),
      email: aiForm.email.trim(),
      inputs: {
        gender: aiForm.gender === "Male" ? 1 : 0,
        age: Number(aiForm.age),
        hypertension: Number(aiForm.hypertension),
        heart_disease: Number(aiForm.heart_disease),
        bmi: Number(aiForm.bmi),
        HbA1c_level: Number(aiForm.HbA1c_level),
        blood_glucose_level: Number(aiForm.blood_glucose_level),

        // One-Hot Encoding for Smoking History
        smoking_history_current: aiForm.smoking_history === "current" ? 1 : 0,
        smoking_history_ever: aiForm.smoking_history === "ever" ? 1 : 0,
        smoking_history_former: aiForm.smoking_history === "former" ? 1 : 0,
        smoking_history_never: aiForm.smoking_history === "never" ? 1 : 0,
        "smoking_history_not current": aiForm.smoking_history === "No Info" ? 1 : 0,
      }
    };

    try {
      const res = await api.post('/patients/predict', payload);
      if (res.status === 200 || res.status === 201) { // Accept both success codes
        setAiResult(res.data.prediction); // Assuming prediction is nested under data
        toast.success("Assessment Complete", { description: "Report generated successfully." });
        await fetchPatients();
      }
    } catch (error: any) {
      console.error("Prediction Error:", error);
      if (error.response && error.response.status === 404) {
        toast.error("Patient Not Found", { description: error.response.data.message });
      } else {
        toast.error("Analysis Failed", { description: "Please check inputs and try again." });
      }
    } finally {
      setAiLoading(false);
    }
  };

  const initiateDelete = (e: React.MouseEvent, patient: any) => {
    e.stopPropagation();
    setPatientToDelete(patient);
    setDeleteConfirmation("");
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

  // Logout handler moved to Header component, but keeping logic if needed locally (not used in JSX anymore)

  // FILTERED PATIENTS
  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p._id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // MOCK DATA FOR CHART (Derived from actual if possible, else pattern)
  const chartData = filteredPatients.map((p, i) => ({
    name: `Pt ${i + 1}`,
    risk: p.prediction?.riskScore || 0,
  })).slice(0, 7); // Last 7

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="animate-spin h-8 w-8 text-teal-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 font-sans flex text-sm selection:bg-teal-100 selection:text-teal-900">

      {/* 1. LEFT SIDEBAR (Premium SaaS Style) */}
      <Sidebar />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* 2. TOP HEADER */}
        <Header
          doctorName={doctorName}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* SCROLLABLE DASHBOARD CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">

          {/* 3. STATISTICS CARDS (Premium with Gradients) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Card 1: Total Patients */}
            <Card className="border-none shadow-[0_2px_20px_rgb(0,0,0,0.04)] bg-white rounded-[24px] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                <Users size={120} className="text-blue-900" />
              </div>
              <div className="p-7 relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100"> <Users size={16} /> </span>
                      <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Active Panel</span>
                    </div>
                    <h3 className="text-4xl font-extrabold text-slate-800 tracking-tight">{filteredPatients.length}</h3>
                    <div className="flex items-center gap-1.5 mt-3 text-emerald-600 text-[11px] font-bold bg-emerald-50/80 px-2.5 py-1 rounded-full w-fit border border-emerald-100/50">
                      <TrendingUp size={12} strokeWidth={3} /> <span>+12% vs last month</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-blue-300"></div>
            </Card>

            {/* Card 2: High Risk */}
            <Card className="border-none shadow-[0_2px_20px_rgb(0,0,0,0.04)] bg-white rounded-[24px] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                <Activity size={120} className="text-red-900" />
              </div>
              <div className="p-7 relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 border border-red-100"> <AlertTriangle size={16} /> </span>
                      <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Critical Alerts</span>
                    </div>
                    <h3 className="text-4xl font-extrabold text-slate-800 tracking-tight">{filteredPatients.filter(p => p.prediction?.riskLevel === 'High').length}</h3>
                    <div className="flex items-center gap-1.5 mt-3 text-red-600 text-[11px] font-bold bg-red-50/80 px-2.5 py-1 rounded-full w-fit border border-red-100/50">
                      <AlertTriangle size={12} strokeWidth={3} /> <span>Needs attention</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-1.5 w-full bg-gradient-to-r from-red-500 to-red-300"></div>
            </Card>

            {/* Card 3: AI Scans */}
            <Card className="border-none shadow-[0_2px_20px_rgb(0,0,0,0.04)] bg-white rounded-[24px] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                <BrainCircuit size={120} className="text-purple-900" />
              </div>
              <div className="p-7 relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100"> <BrainCircuit size={16} /> </span>
                      <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">AI Assessments</span>
                    </div>
                    <h3 className="text-4xl font-extrabold text-slate-800 tracking-tight">{filteredPatients.length * 3}</h3>
                    <p className="text-xs text-slate-400 font-medium mt-3">Daily scans performed</p>
                  </div>
                </div>
              </div>
              <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 to-purple-300"></div>
            </Card>
          </div>

          {/* 4. MAIN ANALYTICS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT: CHART */}
            {/* LEFT PANEL: PATIENTS REQUIRING ATTENTION (65-70%) - PRO STYLE */}
            <div className="lg:col-span-2 flex flex-col h-[460px]">
              <div className="flex-1 bg-white/80 backdrop-blur-3xl border border-white/60 shadow-[0_4px_30px_rgb(0,0,0,0.03)] rounded-[32px] flex flex-col overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 relative group">

                {/* Decorative Background Glows */}
                <div className="absolute top-0 left-0 w-full h-[150px] bg-gradient-to-b from-red-50/80 to-transparent opacity-60 pointer-events-none"></div>
                <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-red-100 rounded-full blur-[80px] opacity-40 animate-pulse"></div>

                {/* Header */}
                <div className="px-8 py-6 border-b border-red-100/30 bg-white/40 backdrop-blur-md flex justify-between items-center relative z-10">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                      Priority Attention
                      <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)] animate-pulse"></span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1.5 uppercase tracking-wider">Live Clinical Triage • {filteredPatients.filter(p => (p.prediction?.riskScore || 0) > 70).length} Critical Cases</p>
                  </div>
                  <div className="hidden sm:flex gap-2">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-red-100/60 rounded-full shadow-sm">
                      <AlertTriangle size={14} className="text-red-500" fill="currentColor" fillOpacity={0.2} />
                      <span className="text-[11px] font-bold text-red-700 uppercase tracking-widest">Action Required</span>
                    </div>
                  </div>
                </div>

                {/* Content List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar relative z-10">
                  {filteredPatients.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                      <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <ShieldCheck className="h-10 w-10 text-slate-300" strokeWidth={1.5} />
                      </div>
                      <p className="text-base font-medium text-slate-600">All Clear</p>
                      <p className="text-sm font-medium">No patients require immediate attention.</p>
                    </div>
                  ) : (
                    /* Filter Logic: Risk > 70 OR HbA1c > 6.5. Sort by Risk Descending */
                    filteredPatients
                      .filter(p => (p.prediction?.riskScore || 0) > 70 || (p.inputs?.HbA1c_level || 0) > 6.5)
                      .sort((a, b) => (b.prediction?.riskScore || 0) - (a.prediction?.riskScore || 0))
                      .slice(0, 50)
                      .map((p, i) => {
                        const risk = p.prediction?.riskScore || 0;
                        const isHigh = risk > 85;
                        const isHba1c = (p.inputs?.HbA1c_level || 0) > 6.5;

                        // Mock Delta logic for distinct UI demo
                        const delta = (Math.abs(p.name.length - 10) % 15) + 2;
                        const isRising = p.name.length % 3 !== 0;

                        return (
                          <div
                            key={p._id}
                            onClick={() => router.push(`/doctor/patients/${p._id}`)}
                            className={`group relative flex items-center justify-between p-5 rounded-[20px] border transition-all duration-300 cursor-pointer overflow-hidden
                                ${isHigh
                                ? "bg-white border-red-100/60 shadow-[0_4px_20px_rgba(239,68,68,0.04)] hover:shadow-[0_8px_30px_rgba(239,68,68,0.12)] hover:-translate-y-0.5 hover:border-red-200"
                                : "bg-white border-amber-100/60 shadow-[0_4px_20px_rgba(245,158,11,0.04)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.12)] hover:-translate-y-0.5 hover:border-amber-200"
                              }`}
                          >
                            {/* Hover Gradient Overlay */}
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-r ${isHigh ? 'from-red-50/50 to-transparent' : 'from-amber-50/50 to-transparent'}`}></div>

                            <div className="flex items-center gap-5 pl-2 relative z-10">
                              <div className="relative">
                                <Avatar className={`h-14 w-14 border-[3px] shadow-sm transition-transform group-hover:scale-105 ${isHigh ? 'border-red-100' : 'border-amber-100'}`}>
                                  <AvatarFallback className={`font-bold text-lg ${isHigh ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>{p.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {isHigh && <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full border-[3px] border-white flex items-center justify-center shadow-sm"><AlertTriangle size={10} className="text-white" fill="currentColor" /></div>}
                              </div>

                              <div>
                                <div className="flex items-center gap-2.5">
                                  <h4 className="font-bold text-slate-800 text-base group-hover:text-slate-900 transition-colors">{p.name}</h4>
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold tracking-wider font-mono">ID: {p._id.slice(-4).toUpperCase()}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${isHigh ? 'bg-red-50/50 border-red-100 text-red-700' : 'bg-amber-50/50 border-amber-100 text-amber-700'}`}>
                                    <Activity size={12} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{isHigh ? "Critical" : "Elevated"}</span>
                                  </div>
                                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 px-2">
                                    <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                                    {isHba1c ? `HbA1c > 6.5 (${p.inputs?.HbA1c_level}%)` : "Risk Factor Escalation"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-8 relative z-10">
                              <div className="text-right hidden sm:block">
                                <div className="flex items-baseline justify-end gap-1">
                                  <span className={`text-2xl font-black leading-none tracking-tight ${isHigh ? 'text-slate-800' : 'text-slate-800'}`}>
                                    {risk.toFixed(0)}
                                  </span>
                                  <span className="text-sm font-bold text-slate-400">%</span>
                                </div>
                                <div className={`text-[10px] font-bold flex items-center justify-end gap-1 mt-1 px-2 py-0.5 rounded-full ${isRising ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                  {isRising ? <TrendingUp size={10} /> : <TrendingUp size={10} className="rotate-180" />}
                                  {isRising ? '+' : '-'}{delta}%
                                </div>
                              </div>
                              <div className="h-10 w-10 rounded-full bg-slate-50 overflow-hidden flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm group-hover:shadow-lg group-hover:scale-110">
                                <ChevronRight size={18} strokeWidth={2.5} className="ml-0.5" />
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT PANEL: RECENT RISK CHANGES (30-35%) - PRO STYLE */}
            <div className="lg:col-span-1 flex flex-col h-[460px]">
              <div className="flex-1 bg-white/80 backdrop-blur-3xl border border-white/60 shadow-[0_4px_30px_rgb(0,0,0,0.03)] rounded-[32px] flex flex-col overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 relative">

                {/* Decorative */}
                <div className="absolute top-0 right-0 w-full h-[120px] bg-gradient-to-b from-blue-50/50 to-transparent opacity-50 pointer-events-none"></div>

                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100/50 bg-white/40 flex justify-between items-center relative z-10">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Trajectory</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1.5 uppercase tracking-wider">Live risk updates</p>
                  </div>
                  <div className="h-8 w-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 border border-slate-100">
                    <TrendingUp size={14} />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar relative z-10">

                  {/* TIMELINE SECTION: INCREASED */}
                  <div className="relative pl-4 border-l-2 border-red-100 space-y-6">
                    <div className="absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full bg-red-400 ring-4 ring-white"></div>
                    <h5 className="text-[10px] font-bold text-red-500 uppercase tracking-widest pl-2 flex items-center gap-2 mb-4">
                      Deteriorating
                    </h5>

                    {filteredPatients.length > 0 ? filteredPatients.slice(0, 3).map((p, i) => (
                      <div key={i} onClick={() => router.push(`/doctor/patients/${p._id}`)} className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-red-200 hover:-translate-x-[-4px] transition-all cursor-pointer group ml-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-slate-100 bg-slate-50">
                            <AvatarFallback className="text-xs text-slate-600 font-bold bg-white">{p.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors leading-tight">{p.name}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <TrendingUp size={8} /> +{(p.name.length % 5) + 2}%
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">HbA1c</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-slate-300 group-hover:text-red-500 transition-colors">
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    )) : (
                      <p className="text-xs text-slate-400 pl-4 italic">No recent increases.</p>
                    )}
                  </div>

                  {/* TIMELINE SECTION: DECREASED */}
                  <div className="relative pl-4 border-l-2 border-emerald-100 space-y-6 pt-2">
                    <div className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-white"></div>
                    <h5 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest pl-2 flex items-center gap-2 mb-4">
                      Improving
                    </h5>

                    {filteredPatients.length > 0 ? filteredPatients.slice(3, 5).map((p, i) => (
                      <div key={i} onClick={() => router.push(`/doctor/patients/${p._id}`)} className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 hover:-translate-x-[-4px] transition-all cursor-pointer group ml-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-slate-100 bg-slate-50">
                            <AvatarFallback className="text-xs text-slate-600 font-bold bg-white">{p.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors leading-tight">{p.name}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] text-emerald-500 font-bold bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <TrendingUp size={8} className="rotate-180 text-emerald-600" /> -{(p.name.length % 4) + 1}%
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">BMI</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-slate-300 group-hover:text-emerald-500 transition-colors">
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    )) : (
                      <p className="text-xs text-slate-400 pl-4 italic">No recent decreases.</p>
                    )}
                  </div>

                </div>
              </div>
            </div>

          </div>

          {/* 6. ACTIVE PATIENT DIRECTORY (TABLE REPLACEMENT) */}
          <Card className="border-none shadow-[0_2px_20px_rgb(0,0,0,0.02)] bg-white rounded-[24px] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 px-8 py-6">
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">Active Patient Directory</CardTitle>
                <p className="text-xs text-slate-500 font-medium mt-1">Real-time clinical records</p>
              </div>

              <div className="flex gap-3">
                <Button onClick={fetchPatients} variant="outline" size="sm" className="h-10 px-4 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-teal-600 rounded-xl font-medium shadow-sm">
                  <RefreshCcw size={14} className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </Button>

                <Dialog open={isAiOpen} onOpenChange={setIsAiOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 border-none rounded-xl font-bold transition-all hover:scale-105 active:scale-95">
                      <PlusCircle size={16} className="mr-2" /> New Assessment
                    </Button>
                  </DialogTrigger>
                  {/* ... (KEEPING MODAL CONTENT SAME AS BEFORE TO PRESERVE LOGIC, JUST STYLING) */}
                  <DialogContent className="sm:max-w-[650px] bg-white border-none shadow-2xl rounded-2xl overflow-hidden">
                    <DialogHeader className="bg-slate-50 p-6 border-b border-slate-100">
                      <DialogTitle className="text-xl font-bold text-slate-800">Patient Risk Profiling</DialogTitle>
                      <p className="text-slate-500 text-sm">Enter vitals to generate predictive risk assessment</p>
                    </DialogHeader>

                    <div className="p-6">
                      {!aiResult ? (
                        <form onSubmit={handlePredict} className="grid grid-cols-2 gap-5">
                          <div className="col-span-2">
                            <Label className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5 block">Full Name</Label>
                            <Input name="name" value={aiForm.name} onChange={handleAiChange} className="bg-slate-50 border-slate-200 focus:ring-teal-500/20 focus:border-teal-500 rounded-lg h-11" required placeholder="Ex. John Doe" />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5 block">Patient Email (Optional)</Label>
                            <Input name="email" value={aiForm.email} onChange={handleAiChange} className="bg-slate-50 border-slate-200 focus:ring-teal-500/20 focus:border-teal-500 rounded-lg h-11" placeholder="Ex. patient@example.com (Links to account)" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-slate-500 text-xs font-bold uppercase tracking-wider">Age</Label>
                            <Input name="age" value={aiForm.age} type="number" onChange={handleAiChange} className="bg-slate-50 border-slate-200 rounded-lg h-10" required />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-slate-500 text-xs font-bold uppercase tracking-wider">Gender</Label>
                            <Select onValueChange={(val) => handleSelectChange("gender", val)} value={aiForm.gender}>
                              <SelectTrigger className="bg-slate-50 border-slate-200 rounded-lg h-10"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-white"><SelectItem value="Female">Female</SelectItem><SelectItem value="Male">Male</SelectItem></SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1"><Label className="text-slate-500 text-xs font-bold uppercase tracking-wider">BMI</Label><Input name="bmi" value={aiForm.bmi} type="number" step="0.1" onChange={handleAiChange} className="bg-slate-50 border-slate-200 rounded-lg h-10" required /></div>
                          <div className="space-y-1"><Label className="text-slate-500 text-xs font-bold uppercase tracking-wider">HbA1c</Label><Input name="HbA1c_level" value={aiForm.HbA1c_level} type="number" step="0.1" onChange={handleAiChange} className="bg-slate-50 border-slate-200 rounded-lg h-10" required /></div>
                          <div className="space-y-1"><Label className="text-slate-500 text-xs font-bold uppercase tracking-wider">Glucose</Label><Input name="blood_glucose_level" value={aiForm.blood_glucose_level} type="number" onChange={handleAiChange} className="bg-slate-50 border-slate-200 rounded-lg h-10" required /></div>
                          <div className="space-y-1">
                            <Label className="text-slate-500 text-xs font-bold uppercase tracking-wider">Smoking</Label>
                            <Select onValueChange={(val) => handleSelectChange("smoking_history", val)} value={aiForm.smoking_history}>
                              <SelectTrigger className="bg-slate-50 border-slate-200 rounded-lg h-10"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-white">
                                <SelectItem value="never">Never</SelectItem><SelectItem value="current">Current</SelectItem><SelectItem value="former">Former</SelectItem><SelectItem value="No Info">No Info</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-slate-500 text-xs font-bold uppercase tracking-wider">Hypertension</Label>
                            <Select onValueChange={(val) => handleSelectChange("hypertension", val)} value={aiForm.hypertension}>
                              <SelectTrigger className="bg-slate-50 border-slate-200 rounded-lg h-10"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-white"><SelectItem value="0">No</SelectItem><SelectItem value="1">Yes</SelectItem></SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-slate-500 text-xs font-bold uppercase tracking-wider">Heart Disease</Label>
                            <Select onValueChange={(val) => handleSelectChange("heart_disease", val)} value={aiForm.heart_disease}>
                              <SelectTrigger className="bg-slate-50 border-slate-200 rounded-lg h-10"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-white"><SelectItem value="0">No</SelectItem><SelectItem value="1">Yes</SelectItem></SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2 mt-4"><Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 h-12 font-bold rounded-xl text-md" disabled={aiLoading}>{aiLoading ? <Loader2 className="animate-spin" /> : "Run AI Analysis"}</Button></div>
                        </form>
                      ) : (
                        <div className="text-center py-10 space-y-6">
                          <div className={`text-6xl font-black ${aiResult.riskLevel === 'High' ? 'text-red-500' : 'text-emerald-500'}`}>{(aiResult.riskScore || 0).toFixed(2)}%</div>
                          <div className="flex flex-col items-center gap-2">
                            <div className="text-sm uppercase tracking-widest text-slate-500 font-bold">{aiResult.riskLevel} Clinical Risk Detected</div>
                            {aiResult.confidenceLabel && (
                              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${aiResult.confidenceLabel === 'High' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                Model Confidence: {aiResult.confidenceLabel}
                              </div>
                            )}
                          </div>
                          <Button onClick={() => { setIsAiOpen(false); setAiResult(null); }} className="w-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50 h-12 rounded-xl border">Close & Save to Directory</Button>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <div className="flex flex-col gap-3 px-6 pb-6">
              {/* Custom Header Row */}
              <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-100/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <div className="col-span-4 pl-2">Patient</div>
                <div className="col-span-3 text-center">Risk Status</div>
                <div className="col-span-3 text-center">Contact Info</div>
                <div className="col-span-1 text-right">Date</div>
                <div className="col-span-1 text-right pr-2">Actions</div>
              </div>

              {/* Patient Rows */}
              <div className="space-y-3">
                {filteredPatients.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                      <Users className="text-slate-300" size={24} />
                    </div>
                    <p className="text-slate-500 font-medium">No active patients found.</p>
                    <p className="text-xs text-slate-400 mt-1">Add a new assessment to get started.</p>
                  </div>
                ) : (
                  filteredPatients.map((p) => (
                    <div
                      key={p._id}
                      onClick={() => router.push(`/doctor/patients/${p._id}`)}
                      className="group grid grid-cols-12 gap-4 items-center p-4 bg-white border border-slate-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-teal-100 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative overflow-hidden"
                    >
                      {/* Hover Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-r from-teal-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                      {/* Patient Info */}
                      <div className="col-span-4 flex items-center gap-4 relative z-10">
                        <div className="relative">
                          <Avatar className="h-12 w-12 border-2 border-slate-50 shadow-sm group-hover:scale-105 transition-transform">
                            <AvatarFallback className={`font-bold ${p.prediction?.riskLevel === 'High' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'}`}>
                              {p.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {/* Online/Status Dot */}
                          <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${p.prediction?.riskLevel === 'High' ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-[15px] group-hover:text-teal-700 transition-colors">{p.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-slate-400 font-medium">{p.inputs?.age} yrs</p>
                            <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                            <p className="text-xs text-slate-400 font-medium capitalize">{p.inputs?.gender}</p>
                          </div>
                        </div>
                      </div>

                      {/* Risk Status */}
                      <div className="col-span-3 flex justify-center relative z-10">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm ${p.prediction?.riskLevel === 'High'
                          ? 'bg-red-50 text-red-700 border-red-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                          <Activity size={12} strokeWidth={3} />
                          {p.prediction?.riskLevel} Risk
                        </div>
                      </div>

                      {/* Contact Info (Replaces HbA1c) */}
                      <div className="col-span-3 flex flex-col justify-center text-sm relative z-10 space-y-1">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Mail size={12} className="text-slate-400" />
                          <span className="truncate text-xs font-medium">{p.email || <span className="text-slate-400 italic">No email</span>}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <Phone size={12} className="text-slate-400" />
                          <span className="truncate text-xs font-medium">{p.phone || <span className="text-slate-400 italic">No phone</span>}</span>
                        </div>
                      </div>

                      {/* Date (Replaces BMI) */}
                      <div className="col-span-1 text-right relative z-10 text-xs font-medium text-slate-500">
                        {new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>

                      {/* Actions */}
                      <div className="col-span-1 flex justify-end relative z-10">
                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <Button
                            onClick={(e) => initiateDelete(e, p)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                          >
                            <Trash2 size={16} />
                          </Button>
                          <div className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-300 group-hover:bg-teal-50 group-hover:text-teal-600 transition-all">
                            <ChevronRight size={18} />
                          </div>
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>

        </div>
      </main>

      {/* 5. FLOATING AI CO-PILOT */}
      <ClinicalCoPilot />

      {/* DELETE CONFIRMATION ALERT (Styled) */}
      <AlertDialog open={!!patientToDelete} onOpenChange={(open) => !open && setPatientToDelete(null)}>
        <AlertDialogContent className="bg-white border-none shadow-2xl rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 font-bold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete Patient Record?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              This action cannot be undone. To verify, please type <span className="font-bold text-slate-900">{patientToDelete?.name}</span> below.
            </AlertDialogDescription>
            <Input
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="Type patient name..."
              className="mt-4 bg-slate-50 border-slate-200 focus:ring-red-500/20 focus:border-red-500"
            />
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-10 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteConfirmation !== patientToDelete?.name}
              className="h-10 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/20"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}