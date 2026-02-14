"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Activity,
  TrendingDown,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileDown
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import api from "@/lib/api";
import ChatBox from "@/components/ChatBox";
import ClinicalCoPilot from "@/components/ClinicalCoPilot";
import { generatePatientReport } from "@/lib/generatePDF";

export default function PatientDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [patient, setPatient] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulator State
  const [simulatedScore, setSimulatedScore] = useState<number | null>(null);
  const [simFactors, setSimFactors] = useState({ bmi: 0, glucose: 0, hba1c: 0 });

  // Clinical Insights State
  const [insights, setInsights] = useState<string[]>([]);

  // Get current Doctor info for Chat
  const doctor = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};

  useEffect(() => {
    if (id) fetchPatientData();
  }, [id]);

  const fetchPatientData = async () => {
    try {
      // 1. Get current assessment details
      const { data: current } = await api.get(`/patients/${id}`);
      setPatient(current);

      // Initialize Simulator
      setSimFactors({
        bmi: current.inputs.bmi,
        glucose: current.inputs.blood_glucose_level,
        hba1c: current.inputs.HbA1c_level
      });
      // Set precision score from DB
      setSimulatedScore(current.prediction?.riskScore || 0);

      // Generate Rule-Based Insights
      generateInsights(current.inputs);

      // 2. Get Longitudinal History
      const { data: hist } = await api.get(`/patients/history/${encodeURIComponent(current.name)}`);

      const graphData = hist.map((h: any) => ({
        date: new Date(h.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        score: h.prediction?.riskScore || 0
      }));
      setHistory(graphData);

    } catch (err) {
      console.error(err);
      alert("Error loading patient data");
      router.push("/doctor/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (inputs: any) => {
    const newInsights = [];
    if (inputs.bmi >= 30) newInsights.push("Obesity detected (BMI > 30). Major risk driver.");
    else if (inputs.bmi >= 25) newInsights.push("Patient is Overweight (BMI > 25).");

    if (inputs.HbA1c_level >= 6.5) newInsights.push("HbA1c indicates Diabetes range (> 6.5%).");
    else if (inputs.HbA1c_level >= 5.7) newInsights.push("HbA1c indicates Pre-Diabetes (5.7-6.4%).");

    if (inputs.blood_glucose_level > 200) newInsights.push("Random Glucose is critically high (> 200 mg/dL).");

    if (inputs.smoking_history !== 'never' && inputs.smoking_history !== 'No Info') {
      newInsights.push(`Smoking history (${inputs.smoking_history}) contributes to cardiovascular risk.`);
    }

    if (inputs.hypertension === 1) newInsights.push("Hypertension is a concurrent comorbidity.");

    if (newInsights.length === 0) newInsights.push("All vitals are currently within normal ranges.");

    setInsights(newInsights);
  };

  const runSimulation = async () => {
    if (!patient) return;

    const payload = {
      inputs: {
        ...patient.inputs,
        bmi: simFactors.bmi,
        blood_glucose_level: simFactors.glucose,
        HbA1c_level: simFactors.hba1c
      }
    };

    try {
      const { data } = await api.post('/patients/simulate', payload);
      // Update with High Precision score from AI
      setSimulatedScore(data.risk_score);
    } catch (err) {
      alert("Simulation Failed. Check AI Service.");
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin h-8 w-8 text-blue-500" /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => router.back()} className="text-slate-400 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          {/* DOWNLOAD PDF BUTTON */}
          <Button
            onClick={() => generatePatientReport(patient)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-lg shadow-emerald-500/10"
          >
            <FileDown size={18} /> Download Report
          </Button>
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">{patient.name}</h1>
          <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Clinical ID: {patient._id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left & Middle Column: Clinical Data, Insights & Chart */}
        <div className="lg:col-span-2 space-y-6">

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-slate-900 border-slate-800 text-white hover:border-blue-500/30 transition-colors">
              <CardContent className="pt-6 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-tighter">Glucose</p>
                <p className="text-2xl font-bold text-blue-400">{patient.inputs.blood_glucose_level}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800 text-white hover:border-purple-500/30 transition-colors">
              <CardContent className="pt-6 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-tighter">HbA1c (%)</p>
                <p className="text-2xl font-bold text-purple-400">{patient.inputs.HbA1c_level}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800 text-white hover:border-orange-500/30 transition-colors">
              <CardContent className="pt-6 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-tighter">BMI Index</p>
                <p className="text-2xl font-bold text-orange-400">{patient.inputs.bmi}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Clinical Insights Card */}
            <Card className="bg-slate-900 border-slate-800 text-white shadow-xl h-full">
              <CardHeader className="pb-2 border-b border-slate-800/50 mb-4">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-teal-400">
                  <AlertCircle className="h-4 w-4" />
                  Clinical Observations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                      <CheckCircle className="h-3 w-3 text-teal-500 mt-0.5 shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Longitudinal Tracking Graph Card */}
            <Card className="bg-slate-900 border-slate-800 text-white shadow-xl h-[280px]">
              <CardHeader className="pb-1"><CardTitle className="text-[10px] text-slate-500 uppercase font-black">History Trend</CardTitle></CardHeader>
              <CardContent className="h-[200px] p-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} />
                    <YAxis stroke="#475569" domain={[0, 100]} fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="score" stroke="#2dd4bf" strokeWidth={3} dot={{ r: 4, fill: '#2dd4bf', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* REAL-TIME SECURE CHAT */}
          {patient?.patient_id ? (
            <div className="animate-in slide-in-from-bottom-4 duration-700">
              <ChatBox
                senderId={doctor.id || doctor._id}
                senderName={doctor.name}
                receiverId={patient.patient_id}
                receiverName={patient.name}
              />
            </div>
          ) : (
            <div className="p-10 bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-800 text-center flex flex-col items-center gap-2">
              <div className="bg-slate-800 p-3 rounded-full"><Loader2 className="h-6 w-6 text-slate-500" /></div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Chat Offline</p>
              <p className="text-[10px] text-slate-600 max-w-[200px]">Messaging is unavailable as the patient has not registered a personal portal account.</p>
            </div>
          )}
        </div>

        {/* Right Column: Counterfactual Simulator Tool */}
        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800 text-white h-full shadow-2xl overflow-hidden relative border-t-0">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-teal-400 to-blue-600"></div>
            <CardHeader className="pt-8">
              <CardTitle className="flex items-center gap-2 font-black italic tracking-tighter">
                <TrendingDown className="h-6 w-6 text-blue-500" />
                RISK SIMULATOR
              </CardTitle>
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em]">Preventive Intervention Tool</p>
            </CardHeader>
            <CardContent className="space-y-8">

              <div className="text-center p-8 bg-slate-950 rounded-3xl border border-slate-800/50 shadow-inner">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-2 tracking-widest">Target Risk Projection</p>
                <div className="text-6xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(45,212,191,0.3)]">
                  {simulatedScore?.toFixed(4)}%
                </div>
                <div className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase">
                  Reduction Potential: -{(patient.prediction.riskScore - (simulatedScore || 0)).toFixed(2)}%
                </div>
              </div>

              <div className="space-y-8 px-2 pb-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Target Glucose</Label>
                    <span className="text-blue-400 font-mono font-bold bg-blue-500/10 px-3 py-1 rounded-full text-xs border border-blue-500/20">{simFactors.glucose}</span>
                  </div>
                  <input type="range" min="70" max="300" step="1" value={simFactors.glucose} onChange={(e) => setSimFactors({ ...simFactors, glucose: Number(e.target.value) })} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Target HbA1c</Label>
                    <span className="text-purple-400 font-mono font-bold bg-purple-500/10 px-3 py-1 rounded-full text-xs border border-purple-500/20">{simFactors.hba1c}</span>
                  </div>
                  <input type="range" min="4" max="15" step="0.1" value={simFactors.hba1c} onChange={(e) => setSimFactors({ ...simFactors, hba1c: Number(e.target.value) })} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Target BMI</Label>
                    <span className="text-orange-400 font-mono font-bold bg-orange-500/10 px-3 py-1 rounded-full text-xs border border-orange-500/20">{simFactors.bmi}</span>
                  </div>
                  <input type="range" min="15" max="50" step="0.5" value={simFactors.bmi} onChange={(e) => setSimFactors({ ...simFactors, bmi: Number(e.target.value) })} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                </div>

                <Button
                  onClick={runSimulation}
                  className="w-full bg-blue-600 hover:bg-blue-500 h-14 text-sm font-black tracking-widest shadow-xl shadow-blue-500/20 mt-4 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all"
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> COMPUTE PROJECTION
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
      <ClinicalCoPilot patientContext={patient} />
    </div>
  );
}