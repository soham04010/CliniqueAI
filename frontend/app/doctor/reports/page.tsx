"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Loader2,
    TrendingUp,
    TrendingDown,
    Minus,
    AlertTriangle,
    Clock,
    CheckCircle2,
    ArrowRight,
    Activity,
    AlertCircle,
    ChevronUp,
    ChevronDown,
    User
} from "lucide-react";
import Sidebar from "@/components/doctor/Sidebar";
import Header from "@/components/doctor/Header";
import api from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// TYPES
interface Patient {
    _id: string;
    name: string;
    email: string;
    updatedAt: string;
    prediction?: {
        riskScore: number;
        riskLevel: string;
    };
    medicalHistory?: {
        hba1c: number;
    };
}

interface ProcessedPatient extends Patient {
    previousRiskScore: number;
    riskChange: number;
    daysSinceLastVisit: number;
    status: 'improved' | 'worsened' | 'stable';
    escalationType?: 'category' | 'threshold' | 'significant' | null;
}

export default function ReportsPage() {
    const router = useRouter();
    const [doctorName, setDoctorName] = useState("");
    const [loading, setLoading] = useState(true);
    const [patients, setPatients] = useState<ProcessedPatient[]>([]);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            const user = JSON.parse(userStr);
            setDoctorName(user.name);
            fetchData();
        } else {
            router.push("/login");
        }
    }, []);

    const fetchData = async () => {
        try {
            const { data } = await api.get(`/patients?refresh=${Date.now()}`);

            // PROCESS DATA (SIMULATING HISTORY FOR DEMO)
            const processed = data.map((p: Patient) => {
                const currentScore = p.prediction?.riskScore || 0;

                // Deterministic mock history based on ID char code sum
                const idSum = p._id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const mockVariance = (idSum % 20) - 10; // -10 to +10 change
                const previousRiskScore = Math.max(0, Math.min(100, currentScore - mockVariance));
                const riskChange = currentScore - previousRiskScore;

                // Determine Status
                let status: 'improved' | 'worsened' | 'stable' = 'stable';
                if (riskChange < -1) status = 'improved';
                if (riskChange > 1) status = 'worsened';

                // Escalation Logic
                let escalationType: ProcessedPatient['escalationType'] = null;
                const currentHba1c = 5.7 + (idSum % 30) / 10; // Mock Hba1c 5.7 - 8.7 if missing

                if (riskChange > 15) escalationType = 'significant';
                if (currentHba1c > 6.5 && (currentHba1c - 0.5) <= 6.5) escalationType = 'threshold'; // Just crossed (simulated)

                // Monitor Gaps
                const lastVisit = new Date(p.updatedAt || Date.now());
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - lastVisit.getTime());
                const daysSinceLastVisit = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Accurate calculation

                return {
                    ...p,
                    previousRiskScore,
                    riskChange,
                    daysSinceLastVisit,
                    status,
                    escalationType,
                    // Inject mock Hba1c if missing for demo
                    medicalHistory: { ...p.medicalHistory, hba1c: p.medicalHistory?.hba1c || currentHba1c }
                };
            });

            setPatients(processed);
        } catch (err) {
            console.error("Failed to load reports data:", err);
        } finally {
            setLoading(false);
        }
    };

    // COMPUTED METRICS
    const activityMetrics = useMemo(() => {
        const total = patients.length || 1;
        const improved = patients.filter(p => p.status === 'improved').length;
        const worsened = patients.filter(p => p.status === 'worsened').length;
        const stable = patients.filter(p => p.status === 'stable').length;
        const netImprovement = ((improved - worsened) / total) * 100;

        return { improved, worsened, stable, netImprovement };
    }, [patients]);

    const escalations = useMemo(() => {
        return patients.filter(p => p.escalationType || p.status === 'worsened').sort((a, b) => b.riskChange - a.riskChange);
    }, [patients]);

    const monitoringGaps = useMemo(() => {
        return {
            over90: patients.filter(p => p.daysSinceLastVisit > 90 && p.daysSinceLastVisit <= 180),
            over180: patients.filter(p => p.daysSinceLastVisit > 180)
        };
    }, [patients]);


    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <Loader2 className="animate-spin h-8 w-8 text-teal-600" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex text-sm selection:bg-teal-100 selection:text-teal-900">
            <Sidebar />

            <main className="flex-1 flex flex-col min-w-0">
                <Header
                    doctorName={doctorName}
                    title="Clinical Reports"
                    subtitle="Outcomes & Accountability Panel"
                    searchQuery=""
                    setSearchQuery={() => { }}
                />

                <div className="flex-1 p-6 lg:p-10 overflow-y-auto space-y-10">

                    {/* SECTION 1: OUTCOME SUMMARY */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-8 w-1 bg-blue-600 rounded-full"></div>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Patient Outcome Summary <span className="text-slate-400 font-normal text-sm ml-2">Last 30 Days</span></h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {/* Improved */}
                            <div className="group bg-white rounded-[24px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100 hover:shadow-[0_8px_32px_rgba(16,185,129,0.1)] transition-all duration-300 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                                    <TrendingDown size={100} className="text-emerald-900" />
                                </div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                        <TrendingDown size={16} strokeWidth={3} />
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Improved</p>
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-4xl font-black text-slate-800 tracking-tight mb-1">{activityMetrics.improved}</h3>
                                    <p className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                                        Patients reduced risk
                                    </p>
                                </div>
                            </div>

                            {/* Worsened */}
                            <div className="group bg-white rounded-[24px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100 hover:shadow-[0_8px_32px_rgba(239,68,68,0.1)] transition-all duration-300 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                                    <TrendingUp size={100} className="text-red-900" />
                                </div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-8 w-8 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                                        <TrendingUp size={16} strokeWidth={3} />
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Escalated</p>
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-4xl font-black text-slate-800 tracking-tight mb-1">{activityMetrics.worsened}</h3>
                                    <p className="text-xs font-medium text-red-600 flex items-center gap-1">
                                        Risk increased
                                    </p>
                                </div>
                            </div>

                            {/* Stable */}
                            <div className="group bg-white rounded-[24px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100 hover:shadow-[0_8px_32px_rgba(0,0,0,0.05)] transition-all duration-300 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                                    <Minus size={100} className="text-slate-900" />
                                </div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
                                        <Minus size={16} strokeWidth={3} />
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Stable</p>
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-4xl font-black text-slate-800 tracking-tight mb-1">{activityMetrics.stable}</h3>
                                    <p className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                        Maintained baseline
                                    </p>
                                </div>
                            </div>

                            {/* Net Improvement */}
                            <div className="relative bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 rounded-[24px] p-6 shadow-[0_12px_24px_rgba(37,99,235,0.25)] text-white overflow-hidden group">
                                <div className="absolute -right-6 -top-6 h-32 w-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                                    <Activity size={120} />
                                </div>

                                <p className="text-xs font-bold text-blue-100 uppercase tracking-widest mb-4 opacity-80">Net Clinical Effect</p>
                                <div className="flex items-end gap-2 mb-2">
                                    <h3 className="text-5xl font-black tracking-tighter">
                                        {activityMetrics.netImprovement > 0 ? "+" : ""}{activityMetrics.netImprovement.toFixed(1)}%
                                    </h3>
                                </div>
                                <div className="inline-flex items-center bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white border border-white/10">
                                    (Improved - Worsened) / Total
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                        {/* SECTION 2: ESCALATION TRACKER (60%) */}
                        <section className="lg:col-span-3 flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-1 bg-amber-500 rounded-full"></div>
                                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Escalation Tracker</h2>
                                </div>
                                <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                    {escalations.length} Detected
                                </Badge>
                            </div>

                            <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
                                {escalations.length === 0 ? (
                                    <div className="p-16 flex flex-col items-center justify-center text-center">
                                        <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 text-emerald-500">
                                            <CheckCircle2 size={32} />
                                        </div>
                                        <h3 className="text-slate-800 font-bold mb-1">Clean Record</h3>
                                        <p className="text-slate-400 text-sm">No significant escalations detected this period.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-12 gap-4 p-5 bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider backdrop-blur-sm sticky top-0 z-10">
                                            <div className="col-span-5 pl-2">Patient</div>
                                            <div className="col-span-3">Risk Shift</div>
                                            <div className="col-span-4">Primary Driver</div>
                                        </div>
                                        <div className="divide-y divide-slate-50">
                                            {escalations.slice(0, 5).map(p => (
                                                <div
                                                    key={p._id}
                                                    onClick={() => router.push(`/doctor/patients/${p._id}`)}
                                                    className="group grid grid-cols-12 gap-4 p-4 hover:bg-slate-50 transition-all cursor-pointer items-center relative overflow-hidden"
                                                >
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                                    <div className="col-span-5 flex items-center gap-4 pl-2">
                                                        <Avatar className="h-10 w-10 border border-slate-100 bg-white shadow-sm group-hover:scale-105 transition-transform">
                                                            <AvatarFallback className="bg-slate-50 text-slate-600 font-bold text-xs">{p.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">{p.name}</p>
                                                            <p className="text-[11px] text-slate-400 font-mono tracking-wide">ID: {p._id.slice(-6).toUpperCase()}</p>
                                                        </div>
                                                    </div>

                                                    <div className="col-span-3">
                                                        <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-100 text-xs font-bold shadow-sm group-hover:shadow-md transition-shadow">
                                                            <TrendingUp size={12} className="mr-1.5" />
                                                            +{p.riskChange.toFixed(1)}%
                                                        </div>
                                                    </div>

                                                    <div className="col-span-4 pr-2">
                                                        {p.escalationType === 'threshold' && (
                                                            <span className="inline-flex items-center text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100/50">
                                                                <AlertCircle size={12} className="mr-1.5" /> HbA1c {'>'} 6.5
                                                            </span>
                                                        )}
                                                        {p.escalationType === 'significant' && (
                                                            <span className="inline-flex items-center text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-100/50">
                                                                <Activity size={12} className="mr-1.5" /> Rapid Shift
                                                            </span>
                                                        )}
                                                        {!p.escalationType && (
                                                            <span className="text-xs font-medium text-slate-400 italic">Routine Variation</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {escalations.length > 5 && (
                                            <div className="p-3 text-center border-t border-slate-100">
                                                <button className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                                                    View All Escalations
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </section>

                        {/* SECTION 3: MONITORING GAPS (40%) */}
                        <section className="lg:col-span-2 flex flex-col">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-8 w-1 bg-slate-300 rounded-full"></div>
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Monitoring Gaps</h2>
                            </div>

                            <div className="flex flex-col gap-6">
                                {/* 180 Days */}
                                <div className="bg-white rounded-[24px] border border-red-100 shadow-[0_4px_20px_rgba(254,242,242,0.5)] overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-4 opacity-[0.05] pointer-events-none">
                                        <AlertCircle size={80} className="text-red-900" />
                                    </div>

                                    <div className="p-5 pb-2 flex items-center justify-between">
                                        <span className="text-xs font-bold text-red-600 uppercase tracking-widest flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                                            Overdue {'>'} 180 Days
                                        </span>
                                        <Badge className="bg-red-50 text-red-700 border-red-100 hover:bg-red-100">{monitoringGaps.over180.length}</Badge>
                                    </div>

                                    <div className="p-2 space-y-1">
                                        {monitoringGaps.over180.length === 0 ? (
                                            <div className="p-6 text-center">
                                                <p className="text-xs text-slate-400 font-medium">No critical gaps.</p>
                                            </div>
                                        ) : (
                                            monitoringGaps.over180.slice(0, 3).map(p => (
                                                <div key={p._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-red-50/60 transition-colors cursor-pointer group" onClick={() => router.push(`/doctor/patients/${p._id}`)}>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8 border border-white shadow-sm">
                                                            <AvatarFallback className="text-[10px] font-bold text-slate-600 bg-slate-100">{p.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm font-bold text-slate-700 group-hover:text-red-800 transition-colors">{p.name}</span>
                                                    </div>
                                                    <Badge className="bg-white text-red-600 border border-red-100 shadow-sm font-mono text-[10px] px-2">
                                                        {p.daysSinceLastVisit}d
                                                    </Badge>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* 90 Days */}
                                <div className="bg-white rounded-[24px] border border-amber-100 shadow-[0_4px_20px_rgba(255,251,235,0.5)] overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-4 opacity-[0.05] pointer-events-none">
                                        <Clock size={80} className="text-amber-900" />
                                    </div>

                                    <div className="p-5 pb-2 flex items-center justify-between">
                                        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                                            Overdue {'>'} 90 Days
                                        </span>
                                        <Badge className="bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100">{monitoringGaps.over90.length}</Badge>
                                    </div>

                                    <div className="p-2 space-y-1">
                                        {monitoringGaps.over90.length === 0 ? (
                                            <div className="p-6 text-center">
                                                <p className="text-xs text-slate-400 font-medium">All monitored.</p>
                                            </div>
                                        ) : (
                                            monitoringGaps.over90.slice(0, 3).map(p => (
                                                <div key={p._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-amber-50/60 transition-colors cursor-pointer group" onClick={() => router.push(`/doctor/patients/${p._id}`)}>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8 border border-white shadow-sm">
                                                            <AvatarFallback className="text-[10px] font-bold text-slate-600 bg-slate-100">{p.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm font-bold text-slate-700 group-hover:text-amber-800 transition-colors">{p.name}</span>
                                                    </div>
                                                    <Badge className="bg-white text-amber-600 border border-amber-100 shadow-sm font-mono text-[10px] px-2">
                                                        {p.daysSinceLastVisit}d
                                                    </Badge>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                </div>
            </main>
        </div>
    );
}
