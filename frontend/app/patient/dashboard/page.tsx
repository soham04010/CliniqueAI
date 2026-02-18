"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ShieldCheck,
    AlertTriangle,
    CheckCircle,
    Activity,
    Share2,
    TrendingUp,
    Loader2,
    Droplets,
    Scale,
    Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ClinicalCoPilot from "@/components/ClinicalCoPilot";
import api from "@/lib/api";
import { getHumanStatus, getDeltas } from "@/lib/patientLogic";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

export default function PatientDashboard() {
    const router = useRouter();
    const [patient, setPatient] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Computed States
    const [status, setStatus] = useState<any>(null);
    const [deltas, setDeltas] = useState<any[]>([]);

    // Vitals Form State
    const [isVitalsOpen, setIsVitalsOpen] = useState(false);
    const [vitalsForm, setVitalsForm] = useState({
        age: '',
        gender: 'Male',
        smoking_history: 'never',
        hypertension: '0',
        heart_disease: '0',
        glucose: '',
        hba1c: '',
        bmi: '',
        doctor_email: ''
    });
    const [doctorName, setDoctorName] = useState<string | null>(null);

    const handleUpdateVitals = async () => {
        setLoading(true);
        try {
            // 1. One-Hot Encode Smoking History
            const smokingMap: any = {
                "current": "smoking_history_current",
                "former": "smoking_history_former",
                "never": "smoking_history_never",
                "No Info": "smoking_history_not current",
                "ever": "smoking_history_ever"
            };

            const smokingState = vitalsForm.smoking_history; // current selection
            const smokingPayload = {
                "smoking_history_current": 0,
                "smoking_history_ever": 0,
                "smoking_history_former": 0,
                "smoking_history_never": 0,
                "smoking_history_not current": 0
            };

            if (smokingMap[smokingState]) {
                // @ts-ignore
                smokingPayload[smokingMap[smokingState]] = 1;
            }

            // 2. Prepare Payload
            const newInputs = {
                ...(patient.inputs || {}),
                gender: vitalsForm.gender === 'Male' ? 1 : 0, // Male=1, Female=0
                age: Number(vitalsForm.age),
                hypertension: Number(vitalsForm.hypertension),
                heart_disease: Number(vitalsForm.heart_disease),
                bmi: Number(vitalsForm.bmi),
                HbA1c_level: Number(vitalsForm.hba1c),
                blood_glucose_level: Number(vitalsForm.glucose),
                ...smokingPayload
            };

            // Remove legacy field if it exists to avoid backend validation errors
            // @ts-ignore
            delete newInputs.smoking_history;

            const { data: newRecord } = await api.post('/patients/predict', {
                name: patient.name,
                inputs: newInputs,
                doctor_id: patient.doctor_id,
                doctor_email: vitalsForm.doctor_email // Send email for lookup
            });

            setPatient({ ...patient, ...newRecord });

            if (newRecord.prediction) {
                setStatus(getHumanStatus(newRecord.prediction.riskScore));
            }

            try {
                const { data: hist } = await api.get(`/patients/history/${encodeURIComponent(patient.name)}`);
                setDeltas(getDeltas(newInputs, hist));
            } catch (e) {
                console.warn("History refresh failed", e);
            }

            toast.success("Analysis Complete & Shared", {
                description: `Results sent to ${patient?.doctor_id || 'your doctor'}. Risk Score: ${newRecord.prediction.riskScore.toFixed(4)}%`
            });
            setIsVitalsOpen(false);

        } catch (error) {
            console.error(error);
            toast.error("Analysis Failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            const userStr = localStorage.getItem("user");
            const token = localStorage.getItem("token");

            if (!userStr || !token) {
                router.push("/login");
                return;
            }

            try {
                const localUser = JSON.parse(userStr);
                const { data: records } = await api.get(`/patients`);
                let fullPatient = localUser;

                if (records && records.length > 0) {
                    fullPatient = { ...localUser, ...records[0] };
                    setPatient(fullPatient);

                    // Fetch Doctor Details if linked
                    if (fullPatient.doctor_id) {
                        try {
                            const { data: doctorData } = await api.get(`/auth/user/${fullPatient.doctor_id}`);
                            if (doctorData && doctorData.name) {
                                setDoctorName(doctorData.name);
                            }
                        } catch (err) {
                            console.warn("Doctor fetch error", err);
                        }
                    }

                    // Initialize form with current values
                    if (fullPatient.inputs) {
                        setVitalsForm(prev => ({
                            ...prev,
                            age: fullPatient.inputs.age || '',
                            gender: fullPatient.inputs.gender === 1 ? 'Male' : (fullPatient.inputs.gender === 0 ? 'Female' : 'Male'),

                            // Reconstruct smoking status from one-hot
                            smoking_history:
                                fullPatient.inputs.smoking_history_current ? 'current' :
                                    fullPatient.inputs.smoking_history_former ? 'former' :
                                        fullPatient.inputs.smoking_history_never ? 'never' :
                                            fullPatient.inputs["smoking_history_not current"] ? 'No Info' : 'never',

                            hypertension: String(fullPatient.inputs.hypertension || '0'),
                            heart_disease: String(fullPatient.inputs.heart_disease || '0'),
                            glucose: fullPatient.inputs.blood_glucose_level || '',
                            hba1c: fullPatient.inputs.HbA1c_level || '',
                            bmi: fullPatient.inputs.bmi || '',
                            // Keep doctor email if set
                            doctor_email: prev.doctor_email
                        }));
                    }

                    if (fullPatient.prediction) {
                        setStatus(getHumanStatus(fullPatient.prediction.riskScore));
                    }

                    try {
                        const { data: hist } = await api.get(`/patients/history/${encodeURIComponent(fullPatient.name)}`);
                        setDeltas(getDeltas(fullPatient.inputs, hist));
                    } catch (err) {
                        console.warn("Could not fetch history for trends.");
                    }

                } else {
                    setPatient(localUser);
                    setStatus({
                        status: "Welcome to CliniqueAI",
                        color: "bg-indigo-50 text-indigo-800",
                        iconColor: "text-indigo-600",
                        message: "We don't have enough data yet. Schedule a checkup to get started.",
                        level: "info"
                    });
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    const handleShare = (metric: string, value: any) => {
        // In a real app, this would make an API call to notify the doctor
        toast.success(`${metric} results shared with your doctor!`, {
            description: `Dr. Panel has been notified of your ${value} value.`
        });
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
            <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
        </div>
    );

    return (
        <div className="font-sans text-slate-900 pb-20">

            <main className="max-w-5xl mx-auto px-6 py-8 space-y-8 animate-in fade-in duration-500">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Good Morning, {patient?.name?.split(' ')[0] || 'Patient'}</h1>
                        <p className="text-slate-500 font-medium">Here is your health overview for today.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Care Team / Doctor Status */}
                        <div className={`hidden md:flex items-center gap-3 px-4 py-2 rounded-xl border ${vitalsForm.doctor_email ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${vitalsForm.doctor_email ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-200 text-slate-500'}`}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            </div>
                            <div className="text-xs">
                                <p className="font-bold uppercase tracking-wider opacity-70">Care Team</p>
                                <p className="font-semibold">{doctorName || (vitalsForm.doctor_email ? 'Dr. Assigned' : 'No Doctor')}</p>
                            </div>
                        </div>

                        {/* Routine Vital Check Modal */}
                        <Dialog open={isVitalsOpen} onOpenChange={setIsVitalsOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 rounded-xl px-6 font-bold tracking-wide transition-all hover:scale-105 active:scale-95">
                                    <Activity className="h-4 w-4 mr-2" />
                                    ROUTINE VITAL CHECK
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[480px] rounded-[2rem] bg-white text-slate-900 border-slate-100 shadow-2xl shadow-indigo-900/10 p-0 overflow-hidden">
                                <DialogTitle className="sr-only">Routine Vital Check</DialogTitle>


                                <div className="p-6 space-y-6">
                                    {/* Physician Info */}
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consulting Physician (Email)</Label>
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500">
                                                    <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold">DR</div>
                                                </div>
                                                <Input
                                                    placeholder="Enter Doctor's Email..."
                                                    value={vitalsForm.doctor_email}
                                                    onChange={(e) => setVitalsForm({ ...vitalsForm, doctor_email: e.target.value })}
                                                    className="pl-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium px-1">
                                            Connect with your doctor to share these results instantly.
                                        </p>
                                    </div>

                                    {/* Personal Stats Grid */}
                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="space-y-3">
                                            <Label htmlFor="age" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Age</Label>
                                            <div className="flex items-center justify-between bg-white p-1 rounded-2xl border border-slate-200 shadow-sm h-14">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => setVitalsForm(prev => ({ ...prev, age: String(Math.max(0, Number(prev.age) - 1)) }))}
                                                    className="h-12 w-14 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                                >
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M5 12H19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </Button>

                                                <div className="flex flex-col items-center justify-center -space-y-0.5 px-2">
                                                    <input
                                                        id="age"
                                                        type="number"
                                                        value={vitalsForm.age}
                                                        onChange={(e) => setVitalsForm({ ...vitalsForm, age: e.target.value })}
                                                        className="bg-transparent border-none text-center text-xl font-black text-slate-900 focus:outline-none focus:ring-0 p-0 h-7 w-20 [&::-webkit-inner-spin-button]:appearance-none"
                                                        placeholder="--"
                                                    />
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Years</span>
                                                </div>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => setVitalsForm(prev => ({ ...prev, age: String(Number(prev.age) + 1) }))}
                                                    className="h-12 w-14 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                                >
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <Label htmlFor="gender" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Gender</Label>
                                            <div className="relative">
                                                <select
                                                    id="gender"
                                                    value={vitalsForm.gender}
                                                    onChange={(e) => setVitalsForm({ ...vitalsForm, gender: e.target.value })}
                                                    className="w-full bg-white border border-slate-200 text-slate-900 rounded-2xl px-4 h-14 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none text-sm font-bold appearance-none cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
                                                >
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Smoking History */}
                                    <div className="space-y-2">
                                        <Label htmlFor="smoking" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Smoking History</Label>
                                        <div className="relative">
                                            <select
                                                id="smoking"
                                                value={vitalsForm.smoking_history}
                                                onChange={(e) => setVitalsForm({ ...vitalsForm, smoking_history: e.target.value })}
                                                className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-4 h-11 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none text-sm appearance-none cursor-pointer hover:bg-slate-50 transition-colors shadow-sm font-medium"
                                            >
                                                <option value="never">Never Smoked</option>
                                                <option value="current">Current Smoker</option>
                                                <option value="former">Former Smoker</option>
                                                <option value="No Info">No Information</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Binary Toggles */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-center mb-2">Hypertension</Label>
                                            <div className="flex bg-slate-200/50 rounded-lg p-1">
                                                <button
                                                    onClick={() => setVitalsForm({ ...vitalsForm, hypertension: '0' })}
                                                    className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${vitalsForm.hypertension === '0' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    NO
                                                </button>
                                                <button
                                                    onClick={() => setVitalsForm({ ...vitalsForm, hypertension: '1' })}
                                                    className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${vitalsForm.hypertension === '1' ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/20' : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    YES
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-center mb-2">Heart Disease</Label>
                                            <div className="flex bg-slate-200/50 rounded-lg p-1">
                                                <button
                                                    onClick={() => setVitalsForm({ ...vitalsForm, heart_disease: '0' })}
                                                    className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${vitalsForm.heart_disease === '0' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    NO
                                                </button>
                                                <button
                                                    onClick={() => setVitalsForm({ ...vitalsForm, heart_disease: '1' })}
                                                    className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${vitalsForm.heart_disease === '1' ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/20' : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    YES
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Vitals Inputs */}
                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="glucose" className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest pl-1">Glucose</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="glucose"
                                                        type="number"
                                                        value={vitalsForm.glucose}
                                                        onChange={(e) => setVitalsForm({ ...vitalsForm, glucose: e.target.value })}
                                                        className="bg-white border-slate-200 text-slate-900 focus:ring-indigo-500/20 focus:border-indigo-500 h-10 pr-12 font-bold shadow-sm"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold pointer-events-none">mg/dL</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="hba1c" className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest pl-1">HbA1c</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="hba1c"
                                                        type="number"
                                                        step="0.1"
                                                        value={vitalsForm.hba1c}
                                                        onChange={(e) => setVitalsForm({ ...vitalsForm, hba1c: e.target.value })}
                                                        className="bg-white border-slate-200 text-slate-900 focus:ring-indigo-500/20 focus:border-indigo-500 h-10 pr-8 font-bold shadow-sm"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold pointer-events-none">%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bmi" className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest pl-1">BMI Index</Label>
                                            <div className="relative">
                                                <Input
                                                    id="bmi"
                                                    type="number"
                                                    step="0.1"
                                                    value={vitalsForm.bmi}
                                                    onChange={(e) => setVitalsForm({ ...vitalsForm, bmi: e.target.value })}
                                                    className="bg-white border-slate-200 text-slate-900 focus:ring-indigo-500/20 focus:border-indigo-500 h-10 pr-12 font-bold shadow-sm"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold pointer-events-none">kg/m²</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 pt-2 bg-slate-50/50">
                                    <Button
                                        onClick={handleUpdateVitals}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold tracking-widest h-12 text-sm rounded-xl shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        EXECUTE AI ANALYSIS
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* 1. Hero: "Am I Okay?" */}
                {
                    status && (
                        <div className={`relative overflow-hidden p-8 rounded-[2rem] shadow-sm border transition-all duration-300 group
                      ${status.level === 'low' ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100/50' :
                                status.level === 'high' ? 'bg-gradient-to-br from-rose-50 to-orange-50 border-rose-100/50' :
                                    'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100/50'}`}>

                            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div className="space-y-3">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border border-white/50 backdrop-blur-sm
                               ${status.level === 'low' ? 'bg-emerald-100/80 text-emerald-800' :
                                            status.level === 'high' ? 'bg-rose-100/80 text-rose-800' : 'bg-amber-100/80 text-amber-800'}`}>
                                        {status.level === 'low' ? <ShieldCheck className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                        Current Status
                                    </span>
                                    <div>
                                        <div className="flex items-baseline gap-3">
                                            <h2 className="text-5xl font-black tracking-tighter text-slate-900 leading-none">
                                                {patient.prediction?.riskScore ? `${patient.prediction.riskScore.toFixed(4)}%` : '--'}
                                            </h2>
                                            <span className="text-xl font-bold text-slate-400 uppercase tracking-widest">{status.level} RISK</span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-700 mt-1">{status.status}</h3>
                                    </div>
                                    <p className="text-base font-medium text-slate-600/90 leading-relaxed max-w-lg">
                                        {status.message}
                                    </p>
                                </div>

                                <div className={`hidden md:flex h-20 w-20 rounded-full border-4 items-center justify-center bg-white shadow-sm
                            ${status.level === 'low' ? 'border-emerald-100 text-emerald-500' :
                                        status.level === 'high' ? 'border-rose-100 text-rose-500' : 'border-amber-100 text-amber-500'}`}>
                                    {status.level === 'low' ? <CheckCircle className="h-8 w-8" /> : <Activity className="h-8 w-8" />}
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* 2. My Vitals Section (Real Data & Share) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Activity className="h-5 w-5 text-indigo-600" />
                            My Vitals
                        </h2>
                        <Link href="/patient/history" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline underline-offset-4 transition-all">
                            View All History
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Glucose Card */}
                        <Card className="rounded-[1.5rem] border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <Droplets className="h-5 w-5" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Glucose</p>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <h3 className="text-3xl font-black text-slate-900">{patient?.inputs?.blood_glucose_level || '--'}</h3>
                                        <span className="text-sm font-semibold text-slate-400">mg/dL</span>
                                    </div>
                                </div>
                                {patient?.inputs?.blood_glucose_level && (
                                    <div className={`text-xs font-bold px-2 py-1 rounded inline-block ${patient.inputs.blood_glucose_level > 140 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                        {patient.inputs.blood_glucose_level > 140 ? 'High' : 'Normal'}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* HbA1c Card */}
                        <Card className="rounded-[1.5rem] border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="bg-purple-50 p-2.5 rounded-xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                        <Activity className="h-5 w-5" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">HbA1c</p>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <h3 className="text-3xl font-black text-slate-900">{patient?.inputs?.HbA1c_level || '--'}</h3>
                                        <span className="text-sm font-semibold text-slate-400">%</span>
                                    </div>
                                </div>
                                {patient?.inputs?.HbA1c_level && (
                                    <div className={`text-xs font-bold px-2 py-1 rounded inline-block ${patient.inputs.HbA1c_level > 6.5 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                        {patient.inputs.HbA1c_level > 6.5 ? 'Elevated' : 'Normal'}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* BMI Card */}
                        <Card className="rounded-[1.5rem] border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="bg-orange-50 p-2.5 rounded-xl text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                        <Scale className="h-5 w-5" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">BMI</p>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <h3 className="text-3xl font-black text-slate-900">{patient?.inputs?.bmi || '--'}</h3>
                                        <span className="text-sm font-semibold text-slate-400">kg/m²</span>
                                    </div>
                                </div>
                                {patient?.inputs?.bmi && (
                                    <div className={`text-xs font-bold px-2 py-1 rounded inline-block ${patient.inputs.bmi > 25 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                        {patient.inputs.bmi > 25 ? 'Overweight' : 'Normal'}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* 3. Trends & Safety (Right Column) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Trends List */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-slate-400" />
                                Recent Changes
                            </h3>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {deltas.length > 0 ? (
                                deltas.map((delta: any, i: number) => (
                                    <div key={i} className="p-6 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                                        <div className={`p-2.5 rounded-2xl flex-none shadow-sm ${delta.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                            <TrendingUp className={`h-5 w-5 ${delta.positive ? 'rotate-0' : 'rotate-180'}`} />
                                        </div>
                                        <p className="text-sm font-semibold text-slate-700 leading-snug">{delta.text}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-slate-400 text-sm">No recent changes detected.</div>
                            )}
                        </div>
                    </div>

                    {/* Safety Banner */}
                    <div className="bg-slate-900 rounded-[2rem] p-8 shadow-xl shadow-slate-200 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10">
                            <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                                Should I be worried?
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                You are not in immediate danger. Your risk level is manageable.
                            </p>
                            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                                <p className="text-rose-300 text-xs font-bold uppercase tracking-wide mb-1">Doctor Alert</p>
                                <p className="text-slate-200 text-sm font-medium">
                                    If glucose &gt; 180 mg/dL for 3 days.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

                <ClinicalCoPilot patientContext={patient} />
            </main>
        </div>
    );
}
