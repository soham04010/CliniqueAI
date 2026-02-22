"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileDown,
  Activity,
  Droplets,
  Scale,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Save,
  X
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import api from "@/lib/api";
import { toast } from "sonner";

// Components
import Sidebar from "@/components/doctor/Sidebar";
import Header from "@/components/doctor/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

import ClinicalCoPilot from "@/components/ClinicalCoPilot";
import { generatePatientReport, generateClinicalReport } from "@/lib/generatePDF";

export default function PatientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [patient, setPatient] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorName, setDoctorName] = useState("");
  const [doctor, setDoctor] = useState<any>({});

  // Simulator State
  const [simulatedScore, setSimulatedScore] = useState<number | null>(null);
  const [simFactors, setSimFactors] = useState({ bmi: 0, glucose: 0, hba1c: 0 });
  const [isSimulated, setIsSimulated] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);
  const [simLoading, setSimLoading] = useState(false);

  // Metadata Edit State
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [metadataForm, setMetadataForm] = useState({
    email: "", phone: "", gender: "Male", age: "", hypertension: "0", heart_disease: "0", smoking_history: "never"
  });

  // HANDLERS
  const startMetadataEdit = () => {
    setMetadataForm({
      email: patient.email || "",
      phone: patient.phone || "",
      gender: patient.inputs?.gender === 1 ? "Male" : "Female",
      age: patient.inputs?.age || "",
      hypertension: String(patient.inputs?.hypertension || 0),
      heart_disease: String(patient.inputs?.heart_disease || 0),
      smoking_history: patient.inputs?.smoking_history_current ? 'current' :
        patient.inputs?.smoking_history_former ? 'former' :
          patient.inputs?.["smoking_history_not current"] ? 'not current' : 'never'
    });
    setIsEditingMetadata(true);
  };

  const saveMetadata = async () => {
    try {
      await api.put(`/patients/${id}`, metadataForm);
      toast.success("Profile Updated", { description: "Patient details synced successfully." });
      setIsEditingMetadata(false);
      fetchPatientData(); // Refresh to see changes
    } catch (error) {
      toast.error("Update Failed", { description: "Could not save changes." });
    }
  };

  // Initialize Doctor
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setDoctor(user);
      setDoctorName(user.name);
    } else {
      router.push("/login");
    }
  }, [router]);

  const generateInsights = (inputs: any) => {
    const newInsights = [];
    if (!inputs) return;
    if (inputs.bmi >= 30) newInsights.push("Obesity detected (BMI > 30). Major risk driver.");
    else if (inputs.bmi >= 25) newInsights.push("Patient is Overweight (BMI > 25).");
    if (inputs.HbA1c_level >= 6.5) newInsights.push("HbA1c indicates Diabetes range (> 6.5%).");
    else if (inputs.HbA1c_level >= 5.7) newInsights.push("HbA1c indicates Pre-Diabetes (5.7-6.4%).");
    if (inputs.blood_glucose_level > 200) newInsights.push("Random Glucose is critically high (> 200 mg/dL).");
    if (inputs.hypertension === 1) newInsights.push("Hypertension is a concurrent comorbidity.");
    if (newInsights.length === 0) newInsights.push("All vitals are currently within stable ranges.");
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

      // Fetch History (Strict Mode: Use User Account ID if available, otherwise fallback to Name)
      // This allows the backend to find both explicit links AND orphan records with the same name.
      const searchKey = current.patient_id || current.name;
      const { data: hist } = await api.get(`/patients/history/${encodeURIComponent(searchKey)}?t=${Date.now()}`);

      // SYNC SIMULATOR WITH LATEST HISTORY (hist[0] is newest)
      if (hist && hist.length > 0 && hist[0].inputs) {
        setSimFactors({
          bmi: hist[0].inputs.bmi || 0,
          glucose: hist[0].inputs.blood_glucose_level || 0,
          hba1c: hist[0].inputs.HbA1c_level || 0
        });
        setSimulatedScore(hist[0].prediction?.riskScore || 0); // Start with LATEST risk score
        generateInsights(hist[0].inputs); // Update Observations with LATEST inputs
      }

      const graphData = hist.map((h: any) => ({
        date: new Date(h.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        score: h.prediction?.riskScore || 0,
        bmi: h.inputs?.bmi || 0,
        glucose: h.inputs?.blood_glucose_level || 0,
        hba1c: h.inputs?.HbA1c_level || 0,
        type: 'actual'
      })).reverse(); // Reverse to show Oldest -> Newest (Left -> Right)
      setHistory(graphData);

    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("Error loading patient details");
      router.push("/doctor/patients");
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

    // Lower is better logic (Risk, A1C, BMI, Glucose generally)
    const isGood = diff <= 0;

    return {
      diff: Math.abs(diff).toFixed(metric === 'score' ? 2 : 1),
      dir: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat',
      isGood
    };
  };

  const runSimulation = async () => {
    if (!patient) return;
    setSimLoading(true);

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

      // Update Graph Visually
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

      toast.success("Simulation Complete", { description: `Projected Risk: ${newScore.toFixed(1)}%` });

    } catch (err) {
      toast.error("Simulation Failed");
    } finally {
      setSimLoading(false);
    }
  };

  const saveProjection = async () => {
    try {
      // Create payload with simulated values and explicit Link
      const payload = {
        name: patient.name,
        patient_id: patient.patient_id, // Link to the correct USER ID account (not the record ID)
        inputs: {
          ...patient.inputs,
          bmi: Number(simFactors.bmi),
          blood_glucose_level: Number(simFactors.glucose),
          HbA1c_level: Number(simFactors.hba1c)
        }
      };

      // Call Predict API to save as new official record
      await api.post('/patients/predict', payload);

      toast.success("Projection Synced", { description: "Patient dashboard updated with new target." });
      setIsSimulated(false);
      fetchPatientData(); // Refresh history charts
    } catch (e) {
      console.error(e);
      toast.error("Sync Failed", { description: "Could not update patient record." });
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="animate-spin h-6 w-6 text-slate-400" />
    </div>
  );

  if (!patient) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header doctorName={doctorName} title="Patient Overview" subtitle={patient.name} />

        <div className="flex-1 p-6 lg:p-10 space-y-8 overflow-y-auto">

          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => router.back()} className="h-9 w-9 rounded-full border-slate-200 hover:bg-white hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{patient.name}</h1>
                <p className="text-sm text-slate-500">ID: {patient._id.slice(-6).toUpperCase()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {(() => {
                // Use the latest history point if available, otherwise fallback to patient.prediction
                const latestHistory = history.length > 0 ? history[history.length - 1] : null;
                const currentRiskScore = latestHistory ? latestHistory.score : (patient.prediction?.riskScore || 0);

                return (
                  <Badge variant="outline" className={`py-1.5 px-3 rounded-full font-medium ${currentRiskScore > 50 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                    Risk: {currentRiskScore.toFixed(1)}%
                  </Badge>
                );
              })()}
              <Button
                onClick={() => {
                  // Navigate to Inbox with auto-select
                  const targetId = patient.patient_id || patient._id; // Prefer linked user ID
                  router.push(`/doctor/inbox?chatWith=${targetId}`);
                }}
                variant="outline"
                className="border-slate-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-200 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                  Message
                </div>
              </Button>
              <Button
                onClick={async () => await generateClinicalReport(patient, patient.name, true, doctorName)}
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-white hover:text-slate-900 shadow-sm transition-all hover:border-slate-300"
              >
                <FileDown className="mr-2 h-4 w-4" /> Clinical Report
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

            {/* LEFT COLUMN */}
            <div className="xl:col-span-2 space-y-8">

              {/* Vitals Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Glucose", val: simFactors.glucose, unit: "mg/dL", icon: Droplets, color: "blue" },
                  { label: "HbA1c", val: simFactors.hba1c, unit: "%", icon: Activity, color: "violet" },
                  { label: "BMI", val: simFactors.bmi, unit: "kg/m²", icon: Scale, color: "orange" }
                ].map((metric, i) => (
                  <Card key={i} className="border border-slate-200 shadow-sm bg-white">
                    <CardContent className="p-6 flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">{metric.label}</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-slate-900">{metric.val}</span>
                          <span className="text-xs text-slate-400 font-medium">{metric.unit}</span>
                        </div>
                      </div>
                      <div className={`p-2 rounded-lg bg-${metric.color}-50 text-${metric.color}-600`}>
                        <metric.icon className="h-5 w-5" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts Section */}
              <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
                <Tabs defaultValue="risk" className="flex flex-col h-[400px]">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">Health Trends</h3>
                    <TabsList className="bg-slate-100 h-8 p-0.5">
                      <TabsTrigger value="risk" className="h-[28px] text-xs font-medium rounded-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">Risk</TabsTrigger>
                      <TabsTrigger value="hba1c" className="h-[28px] text-xs font-medium rounded-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">HbA1c</TabsTrigger>
                      <TabsTrigger value="bmi" className="h-[28px] text-xs font-medium rounded-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">BMI</TabsTrigger>
                      <TabsTrigger value="glucose" className="h-[28px] text-xs font-medium rounded-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">Glucose</TabsTrigger>
                    </TabsList>
                  </div>
                  <CardContent className="flex-1 min-h-0 p-6">
                    {['risk', 'hba1c', 'bmi', 'glucose'].map(metric => {
                      const dataKey = metric === 'risk' ? 'score' : metric;
                      const color = metric === 'risk' ? '#2563eb' : metric === 'hba1c' ? '#8b5cf6' : metric === 'bmi' ? '#f97316' : '#10b981';

                      return (
                        <TabsContent key={metric} value={metric} className="h-full mt-0 data-[state=active]:flex flex-col">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history}>
                              <defs>
                                <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={color} stopOpacity={0.1} />
                                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', padding: '8px 12px' }}
                                itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                                cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }}
                              />
                              <Area
                                type="monotone"
                                dataKey={dataKey}
                                stroke={color}
                                strokeWidth={2}
                                fill={`url(#grad-${metric})`}
                                dot={{ r: 3, fill: '#fff', stroke: color, strokeWidth: 2 }}
                                activeDot={{ r: 5, fill: color, stroke: '#fff', strokeWidth: 2 }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </TabsContent>
                      );
                    })}
                  </CardContent>
                </Tabs>
              </Card>

              {/* Insights List */}
              <Card className="border border-slate-200 shadow-sm bg-white">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-base font-semibold text-slate-900">Clinical Observations</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-1">
                  {insights.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No significant risk factors flagged.</p>
                  ) : (
                    insights.map((insight, idx) => {
                      const isCritical = insight.includes('Critical') || insight.includes('Obesity') || insight.includes('High');
                      return (
                        <div key={idx} className="flex gap-3 py-2">
                          {isCritical ? <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />}
                          <span className={`text-sm ${isCritical ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>{insight}</span>
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>

            </div>

            {/* RIGHT COLUMN: SIMULATOR */}
            <div className="space-y-6">
              <Card className={`border border-slate-200 shadow-sm bg-white overflow-hidden transition-all duration-500 ${isSimulated ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}>
                <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-base font-semibold text-slate-900">Risk Simulator</CardTitle>
                    {isSimulated && <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">Simulated</Badge>}
                  </div>
                  <CardDescription>Adjust vitals to project outcomes.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-8">

                  {/* Big Score */}
                  <div className="text-center">
                    <div className={`text-5xl font-bold tracking-tight mb-2 ${isSimulated ? 'text-amber-500' : 'text-slate-900'}`}>
                      {simulatedScore?.toFixed(1)}<span className="text-2xl text-slate-400 font-medium">%</span>
                    </div>
                    <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Projected Risk</p>
                  </div>

                  {/* Controls */}
                  <div className="space-y-6">
                    {[
                      { label: "Haemoglobin A1c", val: simFactors.hba1c, set: (v: number) => setSimFactors(p => ({ ...p, hba1c: v })), min: 4, max: 14, step: 0.1, unit: "%" },
                      { label: "BMI", val: simFactors.bmi, set: (v: number) => setSimFactors(p => ({ ...p, bmi: v })), min: 18, max: 45, step: 0.5, unit: "kg/m²" },
                      { label: "Glucose", val: simFactors.glucose, set: (v: number) => setSimFactors(p => ({ ...p, glucose: v })), min: 70, max: 200, step: 1, unit: "mg/dL" },
                    ].map((s, i) => (
                      <div key={i} className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <Label className="text-slate-600 font-medium">{s.label}</Label>
                          <span className="font-mono font-medium text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">{s.val} {s.unit}</span>
                        </div>
                        <input
                          type="range"
                          min={s.min}
                          max={s.max}
                          step={s.step}
                          value={s.val}
                          onChange={(e) => s.set(Number(e.target.value))}
                          className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 pt-2">
                    <Button onClick={runSimulation} disabled={simLoading} className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-sm h-11">
                      {simLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                      {isSimulated ? 'Update Projection' : 'Run Simulation'}
                    </Button>
                    {isSimulated && (
                      <Button onClick={saveProjection} variant="outline" className="w-full border-slate-200 hover:bg-slate-50 text-emerald-600 hover:text-emerald-700">
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Save as Target
                      </Button>
                    )}
                  </div>

                </CardContent>
              </Card>

              {/* Additional Metadata Card (Editable) */}
              <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between py-3 px-4 bg-slate-50 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-700 text-sm">Patient Details</h3>
                  {!isEditingMetadata && (
                    <Button onClick={startMetadataEdit} variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700">
                      <Edit2 size={12} />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {isEditingMetadata ? (
                    /* EDIT MODE */
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase font-bold text-slate-500">Gender</Label>
                          <Select onValueChange={(val) => setMetadataForm({ ...metadataForm, gender: val })} value={metadataForm.gender}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-white z-50"><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase font-bold text-slate-500">Age</Label>
                          <Input type="number" className="h-8 text-xs" value={metadataForm.age} onChange={(e) => setMetadataForm({ ...metadataForm, age: e.target.value })} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-slate-500">Smoking Status</Label>
                        <Select onValueChange={(val) => setMetadataForm({ ...metadataForm, smoking_history: val })} value={metadataForm.smoking_history}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-white z-50">
                            <SelectItem value="never">Never</SelectItem>
                            <SelectItem value="current">Current</SelectItem>
                            <SelectItem value="former">Former</SelectItem>
                            <SelectItem value="not current">Not Current</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase font-bold text-slate-500">Hypertension</Label>
                          <Select onValueChange={(val) => setMetadataForm({ ...metadataForm, hypertension: val })} value={metadataForm.hypertension}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-white z-50"><SelectItem value="0">No</SelectItem><SelectItem value="1">Yes</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase font-bold text-slate-500">Heart Disease</Label>
                          <Select onValueChange={(val) => setMetadataForm({ ...metadataForm, heart_disease: val })} value={metadataForm.heart_disease}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-white z-50"><SelectItem value="0">No</SelectItem><SelectItem value="1">Yes</SelectItem></SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 space-y-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase font-bold text-slate-500">Email</Label>
                          <Input className="h-8 text-xs" value={metadataForm.email} onChange={(e) => setMetadataForm({ ...metadataForm, email: e.target.value })} placeholder="patient@example.com" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase font-bold text-slate-500">Phone</Label>
                          <Input className="h-8 text-xs" value={metadataForm.phone} onChange={(e) => setMetadataForm({ ...metadataForm, phone: e.target.value })} placeholder="+1 234 567 890" />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Button variant="outline" onClick={() => setIsEditingMetadata(false)} size="sm" className="flex-1 h-8 text-xs border-slate-200 text-slate-600 hover:bg-slate-50">
                          Cancel
                        </Button>
                        <Button onClick={saveMetadata} size="sm" className="flex-1 h-8 bg-slate-900 hover:bg-slate-800 text-white text-xs shadow-sm">
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* VIEW MODE */
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Gender</span>
                        <span className="font-medium text-slate-900 capitalize">{patient.inputs?.gender === 1 ? 'Male' : 'Female'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Age</span>
                        <span className="font-medium text-slate-900">{patient.inputs?.age} yrs</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Smoking Status</span>
                        <span className="font-medium text-slate-900 capitalize">
                          {patient.inputs?.smoking_history_current ? 'Current' :
                            patient.inputs?.smoking_history_former ? 'Former' :
                              patient.inputs?.smoking_history_never ? 'Never' :
                                patient.inputs?.["smoking_history_not current"] ? 'Not Current' : 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Hypertension</span>
                        <span className={`font-medium ${patient.inputs?.hypertension === 1 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {patient.inputs?.hypertension === 1 ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Heart Disease</span>
                        <span className={`font-medium ${patient.inputs?.heart_disease === 1 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {patient.inputs?.heart_disease === 1 ? 'Yes' : 'No'}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-100"></div>

                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Email</span>
                        <span className="font-medium text-slate-900 text-xs truncate max-w-[150px]">{patient.email || "N/A"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Phone</span>
                        <span className="font-medium text-slate-900 text-xs">{patient.phone || "N/A"}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

            </div>

          </div>
        </div>
      </main>

      <ClinicalCoPilot patientContext={patient} />
    </div>
  );
}