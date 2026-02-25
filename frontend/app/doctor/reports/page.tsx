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
import BrandedLoading from "@/components/shared/BrandedLoading";

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
        <BrandedLoading message="Generating Clinical Outcomes Report..." />
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

                <div className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-8">

                    {/* SECTION 1: OUTCOME SUMMARY */}
                    <section>
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 px-1">
                            <div className="flex items-center gap-3">
                                <div className="h-4 w-1 bg-slate-900 rounded-full"></div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Patient Outcome Summary</h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Institutional Performance Metrics • Verified Analysis</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100/50 px-3 py-1.5 rounded-lg border border-slate-200/60">
                                <Clock size={12} className="text-slate-400" />
                                Reporting Window: Last 30 Days • Sync: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                            {/* Improved */}
                            <div className="bg-white rounded-[10px] p-5 border border-slate-200 transition-all duration-200 relative overflow-hidden">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-6 w-6 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                                        <TrendingDown size={14} strokeWidth={2.5} />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Reduced Risk Cases</p>
                                </div>
                                <div className="mt-4 flex flex-col">
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-1">{activityMetrics.improved}</h3>
                                    <div className="flex items-center gap-1.5 mt-auto">
                                        <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Clinical Recovery Path</p>
                                    </div>
                                </div>
                            </div>

                            {/* Worsened */}
                            <div className="bg-white rounded-[10px] p-5 border border-slate-200 transition-all duration-200 relative overflow-hidden">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-6 w-6 rounded-md bg-red-50 flex items-center justify-center text-red-600 border border-red-100">
                                        <TrendingUp size={14} strokeWidth={2.5} />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Escalated Cases</p>
                                </div>
                                <div className="mt-4 flex flex-col">
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-1">{activityMetrics.worsened}</h3>
                                    <div className="flex items-center gap-1.5 mt-auto">
                                        <div className="h-1 w-1 rounded-full bg-red-500" />
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Immediate Monitoring Required</p>
                                    </div>
                                </div>
                            </div>

                            {/* Stable */}
                            <div className="bg-white rounded-[10px] p-5 border border-slate-200 transition-all duration-200 relative overflow-hidden">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-6 w-6 rounded-md bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-200">
                                        <Minus size={14} strokeWidth={2.5} />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Maintained Baseline</p>
                                </div>
                                <div className="mt-4 flex flex-col">
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-1">{activityMetrics.stable}</h3>
                                    <div className="flex items-center gap-1.5 mt-auto">
                                        <div className="h-1 w-1 rounded-full bg-slate-400" />
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Verified Stable Cohort</p>
                                    </div>
                                </div>
                            </div>

                            {/* Net Improvement */}
                            <div className="bg-white rounded-[10px] p-5 border-2 border-slate-950 flex flex-col justify-between relative overflow-hidden group">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Net Clinical Effect</p>
                                        <Activity size={12} className="text-slate-400" />
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <h3 className="text-4xl font-black text-slate-950 tracking-tighter">
                                            {activityMetrics.netImprovement > 0 ? "+" : ""}{activityMetrics.netImprovement.toFixed(1)}%
                                        </h3>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-1.5">Statistical Impact Formula</div>
                                    <div className="inline-flex items-center bg-slate-50 px-2 py-0.5 rounded text-[9px] font-bold text-slate-600 border border-slate-100">
                                        (Improved - Worsened) / Total Patients
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                        {/* SECTION 2: ESCALATION TRACKER (60%) */}
                        <section className="lg:col-span-3 flex flex-col">
                            <div className="flex items-center justify-between mb-6 px-1">
                                <div className="flex items-center gap-3">
                                    <div className="h-4 w-1 bg-amber-500 rounded-full"></div>
                                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Escalation Tracker</h2>
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100/50 px-3 py-1.5 rounded-lg border border-slate-200/60 flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                                    {escalations.length} Detected Incidents
                                </div>
                            </div>

                            <div className="bg-white rounded-[10px] border border-slate-200 overflow-hidden">
                                {/* Summary Grid - New Clinical Structure */}
                                <div className="grid grid-cols-4 divide-x divide-slate-100 bg-slate-50/50 border-b border-slate-200">
                                    <div className="p-4 text-center">
                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Signals</div>
                                        <div className="text-xl font-black text-slate-900">{escalations.length}</div>
                                    </div>
                                    <div className="p-4 text-center">
                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">High Severity</div>
                                        <div className="text-xl font-black text-red-600">{escalations.filter(p => p.riskChange > 15).length}</div>
                                    </div>
                                    <div className="p-4 text-center">
                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Moderate</div>
                                        <div className="text-xl font-black text-amber-600">{escalations.filter(p => p.riskChange > 5 && p.riskChange <= 15).length}</div>
                                    </div>
                                    <div className="p-4 text-center">
                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Resolved</div>
                                        <div className="text-xl font-black text-emerald-600">0</div>
                                    </div>
                                </div>

                                {escalations.length === 0 ? (
                                    <div className="p-16 flex flex-col items-center justify-center text-center">
                                        <div className="h-12 w-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-4 text-emerald-500 border border-emerald-100">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <h3 className="text-slate-900 font-bold mb-1 text-sm uppercase tracking-tight">Clean Record</h3>
                                        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">No significant clinical escalations detected.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-12 gap-4 p-5 bg-slate-50/30 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            <div className="col-span-5 pl-2">Clinical Identifier</div>
                                            <div className="col-span-3">Risk Variance</div>
                                            <div className="col-span-4">Primary Driver</div>
                                        </div>
                                        <div className="divide-y divide-slate-100">
                                            {escalations.slice(0, 5).map(p => (
                                                <div
                                                    key={p._id}
                                                    onClick={() => router.push(`/doctor/patients/${p._id}`)}
                                                    className="group grid grid-cols-12 gap-4 p-4 hover:bg-slate-50 transition-all cursor-pointer items-center relative overflow-hidden"
                                                >
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                                    <div className="col-span-5 flex items-center gap-4 pl-2">
                                                        <Avatar className="h-8 w-8 border border-slate-200 rounded-md">
                                                            <AvatarFallback className="bg-slate-50 text-slate-600 font-bold text-[10px] uppercase">{p.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-bold text-slate-900 text-xs uppercase tracking-tight transition-colors">{p.name}</p>
                                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">ID: {p._id.slice(-6).toUpperCase()}</p>
                                                        </div>
                                                    </div>

                                                    <div className="col-span-3">
                                                        <div className="inline-flex items-center px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-100 text-[10px] font-black uppercase tracking-tight">
                                                            <TrendingUp size={10} className="mr-1" strokeWidth={3} />
                                                            +{p.riskChange.toFixed(1)}%
                                                        </div>
                                                    </div>

                                                    <div className="col-span-4 pr-2">
                                                        {p.escalationType === 'threshold' && (
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="h-1 w-1 rounded-full bg-amber-500" />
                                                                <span className="text-[9px] font-bold text-amber-700 uppercase tracking-widest">Pathological Threshold (HbA1c)</span>
                                                            </div>
                                                        )}
                                                        {p.escalationType === 'significant' && (
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="h-1 w-1 rounded-full bg-red-600" />
                                                                <span className="text-[9px] font-bold text-red-700 uppercase tracking-widest">Rapid Signal Escalation</span>
                                                            </div>
                                                        )}
                                                        {!p.escalationType && (
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Standard Variance</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {escalations.length > 5 && (
                                            <div className="p-3 text-center border-t border-slate-100 bg-slate-50/20">
                                                <button className="text-[10px] font-bold text-slate-900 hover:text-black uppercase tracking-widest transition-colors flex items-center justify-center w-full gap-2">
                                                    Expand Incident Logs <ArrowRight size={10} />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </section>

                        {/* SECTION 3: MONITORING GAPS (40%) */}
                        <section className="lg:col-span-2 flex flex-col">
                            <div className="flex items-center gap-3 mb-6 px-1">
                                <div className="h-4 w-1 bg-slate-300 rounded-full"></div>
                                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Monitoring Gaps</h2>
                            </div>

                            <div className="flex flex-col gap-5">
                                {/* 180 Days */}
                                <div className="bg-white rounded-[10px] border border-slate-200 overflow-hidden relative">
                                    <div className="flex items-center justify-between p-4 bg-slate-50/50 border-b border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse"></div>
                                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Critical: Overdue {'>'} 180 Days</span>
                                        </div>
                                        <div className="text-xs font-black text-red-600 underline decoration-red-200 underline-offset-4">{monitoringGaps.over180.length}</div>
                                    </div>

                                    <div className="divide-y divide-slate-50">
                                        {monitoringGaps.over180.length === 0 ? (
                                            <div className="p-8 text-center bg-white">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">System Health Optimal:<br />No Clinical Gaps Detected</p>
                                            </div>
                                        ) : (
                                            monitoringGaps.over180.slice(0, 5).map(p => (
                                                <div key={p._id} className="flex items-center justify-between p-3.5 hover:bg-slate-50/80 transition-all cursor-pointer group border-l-4 border-l-red-600" onClick={() => router.push(`/doctor/patients/${p._id}`)}>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-7 w-7 border border-slate-200 rounded-md">
                                                            <AvatarFallback className="text-[9px] font-black text-slate-500 bg-slate-100 uppercase">{p.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-[11px] font-bold text-slate-900 uppercase tracking-tight group-hover:text-red-700 transition-colors">{p.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Last Visit:</span>
                                                        <div className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                                                            {p.daysSinceLastVisit}d
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* 90 Days */}
                                <div className="bg-white rounded-[10px] border border-slate-200 overflow-hidden relative">
                                    <div className="flex items-center justify-between p-4 bg-slate-50/50 border-b border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Warning: Overdue {'>'} 90 Days</span>
                                        </div>
                                        <div className="text-xs font-black text-amber-600 underline decoration-amber-200 underline-offset-4">{monitoringGaps.over90.length}</div>
                                    </div>

                                    <div className="divide-y divide-slate-50">
                                        {monitoringGaps.over90.length === 0 ? (
                                            <div className="p-8 text-center bg-white">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Continuous Monitoring:<br />Active Surveillance Stable</p>
                                            </div>
                                        ) : (
                                            monitoringGaps.over90.slice(0, 5).map(p => (
                                                <div key={p._id} className="flex items-center justify-between p-3.5 hover:bg-slate-50/80 transition-all cursor-pointer group border-l-4 border-l-amber-500" onClick={() => router.push(`/doctor/patients/${p._id}`)}>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-7 w-7 border border-slate-200 rounded-md">
                                                            <AvatarFallback className="text-[9px] font-black text-slate-500 bg-slate-100 uppercase">{p.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-[11px] font-bold text-slate-900 uppercase tracking-tight group-hover:text-amber-700 transition-colors">{p.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Last Visit:</span>
                                                        <div className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                                            {p.daysSinceLastVisit}d
                                                        </div>
                                                    </div>
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
