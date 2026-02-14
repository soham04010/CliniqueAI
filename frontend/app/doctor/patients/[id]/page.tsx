"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Activity, TrendingDown, RefreshCw, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from "@/lib/api";

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
      setSimulatedScore(current.prediction.riskScore);

      // Generate Rule-Based Insights (The "Explainability" Layer)
      generateInsights(current.inputs);

      // 2. Get Longitudinal History
      const { data: hist } = await api.get(`/patients/history/${encodeURIComponent(current.name)}`);
      
      const graphData = hist.map((h: any) => ({
        date: new Date(h.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        score: h.prediction.riskScore
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
      setSimulatedScore(data.risk_score);
    } catch (err) {
      alert("Simulation Failed");
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="text-slate-400 hover:text-white">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
        <div className="text-right">
          <h1 className="text-2xl font-bold">{patient.name}</h1>
          <p className="text-xs text-slate-500">ID: {patient._id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Clinical Data & History */}
        <div className="space-y-6">
          
          {/* Quick Stats */}
          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardHeader><CardTitle>Clinical Snapshot</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Glucose</p>
                  <p className="text-2xl font-bold text-blue-400">{patient.inputs.blood_glucose_level}</p>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">HbA1c</p>
                  <p className="text-2xl font-bold text-purple-400">{patient.inputs.HbA1c_level}</p>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">BMI</p>
                  <p className="text-2xl font-bold text-orange-400">{patient.inputs.bmi}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Clinical Insights (New Feature) */}
          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                AI Clinical Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {insights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle className="h-4 w-4 text-teal-500 mt-0.5 shrink-0" />
                    {insight}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Longitudinal Tracking Graph */}
          <Card className="bg-slate-900 border-slate-800 text-white h-[350px]">
             <CardHeader className="pb-2">
               <CardTitle className="flex items-center gap-2">
                 <Activity className="h-5 w-5 text-teal-500" />
                 Longitudinal Risk Tracking
               </CardTitle>
               <p className="text-slate-400 text-sm">Risk score progression over time.</p>
             </CardHeader>
             <CardContent className="h-[270px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                      itemStyle={{ color: '#2dd4bf' }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#2dd4bf" strokeWidth={3} dot={{r: 6, fill: "#2dd4bf"}} activeDot={{r: 8}} />
                  </LineChart>
                </ResponsiveContainer>
             </CardContent>
          </Card>
        </div>

        {/* Right Column: Counterfactual Simulator */}
        <Card className="bg-slate-900 border-slate-800 text-white h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-blue-500" /> 
              Counterfactual Simulator
            </CardTitle>
            <p className="text-slate-400 text-sm">
              "What if we change these factors?"
            </p>
          </CardHeader>
          <CardContent className="space-y-8">
            
            {/* Simulation Score Display */}
            <div className="text-center p-8 bg-slate-950 rounded-2xl border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-teal-500"></div>
              
              <div className="flex items-center justify-center gap-8 mb-2">
                <div className="opacity-50 blur-[1px]">
                  <p className="text-xs text-slate-500 uppercase">Original</p>
                  <p className="text-3xl font-bold text-slate-400 line-through decoration-red-500/50">
                    {patient.prediction.riskScore.toFixed(1)}%
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-teal-400 uppercase font-bold animate-pulse">Simulated</p>
                  <p className="text-5xl font-black text-white">
                    {simulatedScore?.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/30 border border-emerald-900/50 text-emerald-400 text-sm font-bold">
                <TrendingDown className="w-4 h-4" />
                Risk Reduction: -{(patient.prediction.riskScore - (simulatedScore || 0)).toFixed(1)}%
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-6 px-2">
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Target Blood Glucose</Label>
                  <span className="text-blue-400 font-mono font-bold bg-blue-400/10 px-2 py-1 rounded">{simFactors.glucose}</span>
                </div>
                <input 
                  type="range" min="70" max="300" step="1"
                  value={simFactors.glucose}
                  onChange={(e) => setSimFactors({...simFactors, glucose: Number(e.target.value)})}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Target HbA1c</Label>
                  <span className="text-purple-400 font-mono font-bold bg-purple-400/10 px-2 py-1 rounded">{simFactors.hba1c}</span>
                </div>
                <input 
                  type="range" min="4" max="15" step="0.1"
                  value={simFactors.hba1c}
                  onChange={(e) => setSimFactors({...simFactors, hba1c: Number(e.target.value)})}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Target BMI</Label>
                  <span className="text-orange-400 font-mono font-bold bg-orange-400/10 px-2 py-1 rounded">{simFactors.bmi}</span>
                </div>
                <input 
                  type="range" min="15" max="50" step="0.5"
                  value={simFactors.bmi}
                  onChange={(e) => setSimFactors({...simFactors, bmi: Number(e.target.value)})}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>

              <Button onClick={runSimulation} className="w-full bg-teal-600 hover:bg-teal-700 h-12 text-lg shadow-lg shadow-teal-500/20 mt-4">
                <RefreshCw className="mr-2 h-4 w-4" /> Run Simulation
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}