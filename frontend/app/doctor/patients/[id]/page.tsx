"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  TrendingDown,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import api from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatBox from "@/components/ChatBox";
import ClinicalCoPilot from "@/components/ClinicalCoPilot"; // From Friend's code
import { generatePatientReport } from "@/lib/generatePDF"; // From Friend's code
import { toast } from "sonner";

export default function PatientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [patient, setPatient] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulator State (Your logic)
  const [simulatedScore, setSimulatedScore] = useState<number | null>(null);
  const [simFactors, setSimFactors] = useState({ bmi: 0, glucose: 0, hba1c: 0 });
  const [isSimulated, setIsSimulated] = useState(false);

  const [insights, setInsights] = useState<string[]>([]);
  const [doctor, setDoctor] = useState<any>({});

  // Initialize Doctor from LocalStorage
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) setDoctor(JSON.parse(userStr));
  }, []);

  const generateInsights = (inputs: any) => {
    const newInsights = [];
    if (!inputs) return;
    if (inputs.bmi >= 30) newInsights.push("Obesity detected (BMI > 30). Major risk driver.");
    else if (inputs.bmi >= 25) newInsights.push("Patient is Overweight (BMI > 25).");
    if (inputs.HbA1c_level >= 6.5) newInsights.push("HbA1c indicates Diabetes range (> 6.5%).");
    else if (inputs.HbA1c_level >= 5.7) newInsights.push("HbA1c indicates Pre-Diabetes (5.7-6.4%).");
    if (inputs.blood_glucose_level > 200) newInsights.push("Random Glucose is critically high (> 200 mg/dL).");
    if (inputs.hypertension === 1) newInsights.push("Hypertension is a concurrent comorbidity.");
    if (newInsights.length === 0) newInsights.push("All vitals are currently within normal ranges.");
    setInsights(newInsights);
  };

  const fetchPatientData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const { data: current } = await api.get(`/patients/${id}?t=${Date.now()}`);
      setPatient(current);

      if (current.inputs) {
        setSimFactors({
          bmi: current.inputs.bmi || 0,
          glucose: current.inputs.blood_glucose_level || 0,
          hba1c: current.inputs.HbA1c_level || 0
        });
        generateInsights(current.inputs);
      }

      setSimulatedScore(current.prediction?.riskScore || 0);

      // Fetch History
      const { data: hist } = await api.get(`/patients/history/${encodeURIComponent(current.name)}?t=${Date.now()}`);

      const graphData = hist.map((h: any) => ({
        date: new Date(h.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        score: h.prediction?.riskScore || 0,
        bmi: h.inputs?.bmi || 0,
        glucose: h.inputs?.blood_glucose_level || 0,
        hba1c: h.inputs?.HbA1c_level || 0,
        type: 'actual'
      }));
      setHistory(graphData);

    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("Error loading patient", { description: "Could not fetch patient details." });
      router.push("/doctor/dashboard");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) fetchPatientData();
  }, [id, fetchPatientData]);

  const getTrend = (metric: string) => {
    const actuals = history.filter(h => h.type === 'actual');
    if (actuals.length < 2) return { diff: 0, dir: 'flat', isGood: true };

    const current = actuals[actuals.length - 1];
    const previous = actuals[actuals.length - 2];

    if (!current || !previous) return { diff: 0, dir: 'flat', isGood: true };

    const valCurr = Number(current[metric] || 0);
    const valPrev = Number(previous[metric] || 0);
    const diff = valCurr - valPrev;

    // Lower is better logic (Risk, A1C, BMI, Glucose all follow this usually)
    const isGood = diff <= 0;

    return {
      diff: Math.abs(diff).toFixed(metric === 'score' ? 2 : 1),
      dir: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat',
      isGood
    };
  };

  const runSimulation = async () => {
    if (!patient) return;

    const payload = {
      inputs: {
        ...patient.inputs,
        bmi: Number(simFactors.bmi),
        blood_glucose_level: Number(simFactors.glucose),
        HbA1c_level: Number(simFactors.hba1c)
      }
    };

    try {
      const { data } = await api.post('/patients/simulate', payload);
      const newScore = data.risk_score;
      setSimulatedScore(newScore);
      setIsSimulated(true);

      // Update Graph Visually (Your logic)
      setHistory(prev => {
        const cleanHistory = prev.filter(h => h.type !== 'simulated');
        return [
          ...cleanHistory,
          {
            date: 'Projected',
            score: newScore,
            type: 'simulated'
          }
        ];
      });

      // Update Local State for UI feedback
      setPatient((prev: any) => ({
        ...prev,
        inputs: { ...prev.inputs, ...payload.inputs },
        prediction: { ...prev.prediction, riskScore: newScore }
      }));

    } catch (err) {
      toast.error("Simulation Failed", { description: "Check AI Service connection." });
    }
  };

  const saveProjection = async () => {
    try {
      const payload = {
        name: patient.name,
        inputs: { ...patient.inputs },
      };
      await api.post('/patients/predict', payload);
      toast.custom((t) => (
        <div className="bg-slate-950 border border-emerald-500/20 p-4 rounded-xl shadow-2xl shadow-emerald-500/10 flex items-center gap-4 relative overflow-hidden w-full max-w-md animate-in slide-in-from-top-2 duration-300">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <div className="h-10 w-10 bg-emerald-500/10 rounded-full flex items-center justify-center shrink-0 border border-emerald-500/20">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              PROJECTION COMMITTED
            </h3>
            <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">
              New clinical trajectory successfully computed and integrated into patient history.
            </p>
          </div>
          <div className="absolute -right-6 -top-6 h-20 w-20 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        </div>
      ), { duration: 5000 });
      router.push('/doctor/dashboard');
    } catch (e) {
      toast.error("Save Failed", { description: "Could not save the projection." });
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin h-8 w-8 text-blue-500" /></div>;
  if (!patient) return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-4"><AlertCircle className="h-12 w-12 text-red-500" /><p>Patient record not found.</p><Button onClick={() => router.push('/doctor/dashboard')} variant="outline">Return to Dashboard</Button></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 backdrop-blur-md sticky top-4 z-10 shadow-xl">
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => router.back()} className="text-slate-400 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button
            onClick={() => generatePatientReport(patient)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-lg shadow-emerald-500/10"
          >
            <FileDown size={18} /> Download {isSimulated ? "Projected" : "Current"} Report
          </Button>
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">{patient.name}</h1>
          <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Clinical ID: {patient._id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <Card className={`bg-slate-900 border-slate-800 text-white transition-colors shadow-md ${isSimulated ? 'border-blue-500/50 bg-blue-900/10' : ''}`}>
              <CardContent className="pt-6 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-tighter">Glucose</p>
                <p className="text-2xl font-bold text-blue-400">{patient.inputs?.blood_glucose_level || "N/A"}</p>
              </CardContent>
            </Card>
            <Card className={`bg-slate-900 border-slate-800 text-white transition-colors shadow-md ${isSimulated ? 'border-purple-500/50 bg-purple-900/10' : ''}`}>
              <CardContent className="pt-6 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-tighter">HbA1c (%)</p>
                <p className="text-2xl font-bold text-purple-400">{patient.inputs?.HbA1c_level || "N/A"}</p>
              </CardContent>
            </Card>
            <Card className={`bg-slate-900 border-slate-800 text-white transition-colors shadow-md ${isSimulated ? 'border-orange-500/50 bg-orange-900/10' : ''}`}>
              <CardContent className="pt-6 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-tighter">BMI Index</p>
                <p className="text-2xl font-bold text-orange-400">{patient.inputs?.bmi || "N/A"}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-900 border-slate-800 text-white shadow-xl h-full">
              <CardHeader className="pb-2 border-b border-slate-800/50 mb-4">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-teal-400"><AlertCircle className="h-4 w-4" /> Clinical Observations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                      <CheckCircle className="h-3 w-3 text-teal-500 mt-0.5 shrink-0" />{insight}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Enhanced Graph (Tabs) */}
            <Card className="bg-slate-900 border-slate-800 text-white shadow-xl h-[380px]">
              <Tabs defaultValue="risk" className="h-full flex flex-col">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 border-b border-slate-800/50">
                  <CardTitle className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Clinical Trends</CardTitle>
                  <TabsList className="bg-slate-950 border border-slate-800 h-8">
                    <TabsTrigger value="risk" className="text-[10px] px-3 font-bold">Risk</TabsTrigger>
                    <TabsTrigger value="hba1c" className="text-[10px] px-3 font-bold">HbA1c</TabsTrigger>
                    <TabsTrigger value="bmi" className="text-[10px] px-3 font-bold">BMI</TabsTrigger>
                    <TabsTrigger value="glucose" className="text-[10px] px-3 font-bold">Glucose</TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 p-4">
                  {['risk', 'hba1c', 'bmi', 'glucose'].map(metric => {
                    const dataKey = metric === 'risk' ? 'score' : metric;
                    const trend = getTrend(dataKey);
                    const color = metric === 'risk' ? '#2dd4bf' : metric === 'hba1c' ? '#a855f7' : metric === 'bmi' ? '#f97316' : '#3b82f6';

                    return (
                      <TabsContent key={metric} value={metric} className="h-full flex flex-col mt-0 data-[state=active]:flex">
                        {/* Delta Block */}
                        <div className="flex items-center gap-3 mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800/50">
                          <div className={`flex items-center justify-center h-8 w-8 rounded-full ${trend.isGood ? 'bg-emerald-500/10 text-emerald-400' : (trend.dir === 'flat' ? 'bg-slate-800 text-slate-400' : 'bg-red-500/10 text-red-400')}`}>
                            {trend.dir === 'up' ? <ArrowUpRight size={16} /> : trend.dir === 'down' ? <ArrowDownRight size={16} /> : <Minus size={16} />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-300">
                              {trend.dir === 'flat' ? 'Stable' : (trend.isGood ? 'Improving' : 'Worsening')}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {Math.abs(Number(trend.diff))} unit change since last assessment
                            </p>
                          </div>
                        </div>

                        {/* Chart */}
                        <div className="flex-1 min-h-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                              <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} />
                              <YAxis stroke="#475569" domain={['auto', 'auto']} fontSize={10} tickLine={false} />
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '11px' }} />

                              {metric === 'hba1c' && <ReferenceLine y={6.5} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Threshold (6.5)', fill: '#ef4444', fontSize: 10 }} />}
                              {metric === 'bmi' && <ReferenceLine y={25} stroke="#f59e0b" strokeDasharray="3 3" />}
                              {metric === 'bmi' && <ReferenceLine y={30} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Obesity', fill: '#ef4444', fontSize: 10 }} />}
                              {metric === 'glucose' && <ReferenceLine y={126} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: '126 mg/dL', fill: '#ef4444', fontSize: 10 }} />}

                              <Line
                                type="monotone"
                                dataKey={dataKey}
                                stroke={color}
                                strokeWidth={3}
                                dot={(props: any) => {
                                  const { cx, cy, payload } = props;
                                  if (payload.type === 'simulated') return <circle key={props.key} cx={cx} cy={cy} r={6} fill="#f59e0b" stroke="none" />;
                                  return <circle key={props.key} cx={cx} cy={cy} r={4} fill={color} stroke="none" />;
                                }}
                                activeDot={{ r: 6 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </TabsContent>
                    );
                  })}
                </CardContent>
              </Tabs>
            </Card>
          </div>

          {/* Secure Chat Section */}
          {patient.patient_id ? (
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
              <p className="text-[10px] text-slate-600 max-w-[200px]">Messaging unavailable: Patient portal not registered.</p>
            </div>
          )}
        </div>

        {/* Right Column: Simulator (Your Logic + Save Button) */}
        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800 text-white h-full shadow-2xl overflow-hidden relative border-t-0">
            <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${isSimulated ? 'from-orange-500 via-yellow-500 to-orange-500' : 'from-blue-600 via-teal-400 to-blue-600'}`}></div>
            <CardHeader className="pt-8">
              <CardTitle className="flex items-center gap-2 font-black italic tracking-tighter">
                <TrendingDown className="h-6 w-6 text-blue-500" />
                RISK SIMULATOR
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">

              <div className="text-center p-8 bg-slate-950 rounded-3xl border border-slate-800/50 shadow-inner">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-2 tracking-widest">Target Risk Projection</p>
                <div className={`text-6xl font-black tracking-tighter drop-shadow-[0_0_15px_rgba(45,212,191,0.3)] ${isSimulated ? 'text-yellow-400' : 'text-white'}`}>
                  {simulatedScore?.toFixed(4)}%
                </div>
                {!isSimulated && patient.prediction?.confidenceLabel && (
                  <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${patient.prediction.confidenceLabel === 'High' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    patient.prediction.confidenceLabel === 'Moderate' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                      'bg-red-500/10 border-red-500/20 text-red-500'
                    }`}>
                    Confidence: {patient.prediction.confidenceLabel}
                  </div>
                )}
                <div className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase">
                  Reduction Potential: -{((history.find(h => h.type !== 'simulated')?.score || 0) - (simulatedScore || 0)).toFixed(2)}%
                </div>
              </div>

              <div className="space-y-8 px-2 pb-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center"><Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Target Glucose</Label><span className="text-blue-400 font-mono font-bold bg-blue-500/10 px-3 py-1 rounded-full text-xs border border-blue-500/20">{simFactors.glucose}</span></div>
                  <input type="range" min="70" max="300" step="1" value={simFactors.glucose} onChange={(e) => setSimFactors({ ...simFactors, glucose: Number(e.target.value) })} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center"><Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Target HbA1c</Label><span className="text-purple-400 font-mono font-bold bg-purple-500/10 px-3 py-1 rounded-full text-xs border border-purple-500/20">{simFactors.hba1c}</span></div>
                  <input type="range" min="4" max="15" step="0.1" value={simFactors.hba1c} onChange={(e) => setSimFactors({ ...simFactors, hba1c: Number(e.target.value) })} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center"><Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Target BMI</Label><span className="text-orange-400 font-mono font-bold bg-orange-500/10 px-3 py-1 rounded-full text-xs border border-orange-500/20">{simFactors.bmi}</span></div>
                  <input type="range" min="15" max="50" step="0.5" value={simFactors.bmi} onChange={(e) => setSimFactors({ ...simFactors, bmi: Number(e.target.value) })} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                </div>

                <div className="flex flex-col gap-3">
                  <Button onClick={runSimulation} className="w-full bg-blue-600 hover:bg-blue-500 h-14 text-sm font-black tracking-widest shadow-xl shadow-blue-500/20 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all">
                    <RefreshCw className="mr-2 h-4 w-4" /> COMPUTE PROJECTION
                  </Button>
                  {isSimulated && (
                    <Button onClick={saveProjection} className="w-full bg-emerald-600 hover:bg-emerald-500 h-10 text-xs font-bold tracking-widest shadow-lg shadow-emerald-500/20">
                      <CheckCircle className="mr-2 h-4 w-4" /> COMMIT CHANGE TO DASHBOARD
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Clinical CoPilot (Friend's logic) */}
      <ClinicalCoPilot patientContext={patient} />
    </div>
  );
}