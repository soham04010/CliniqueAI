"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Loader2,
    Search,
    Filter,
    MoreVertical,
    User,
    Calendar,
    Activity,
    ChevronRight,
    TrendingUp,
    AlertTriangle,
    ShieldCheck,
    Mail,
    Phone,
    FileDown
} from "lucide-react";
import Sidebar from "@/components/doctor/Sidebar";
import Header from "@/components/doctor/Header";
import { MobileNav } from "@/components/shared/MobileNav";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PatientsPage() {
    const router = useRouter();
    const [doctorName, setDoctorName] = useState("");
    const [loading, setLoading] = useState(true);
    const [patients, setPatients] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("all");

    // FETCH PATIENTS
    const fetchPatients = useCallback(async () => {
        try {
            const { data } = await api.get(`/patients?refresh=${Date.now()}`);
            setPatients(data);
        } catch (err) {
            console.error("Fetch failed:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            const user = JSON.parse(userStr);
            setDoctorName(user.name);
            fetchPatients();
        } else {
            router.push("/login");
        }
    }, [fetchPatients, router]);

    // FILTER LOGIC
    const filteredPatients = patients.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p._id.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (filterType === 'all') return true;
        if (filterType === 'high') return p.prediction?.riskLevel === 'High';
        if (filterType === 'low') return !p.prediction?.riskLevel || p.prediction?.riskLevel === 'Low';

        return true;
    });

    // CSV EXPORT LOGIC
    const handleExportCSV = () => {
        const headers = ["ID", "Name", "Email", "Phone", "Risk Level", "Risk Score", "Last Visit"];
        const rows = filteredPatients.map(p => [
            p._id,
            p.name,
            p.email || "N/A",
            p.phone || "N/A",
            p.prediction?.riskLevel || "Low",
            p.prediction?.riskScore || 0,
            new Date(p.updatedAt || Date.now()).toLocaleDateString()
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `patients_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // MOCK STATS
    const highRiskCount = patients.filter(p => p.prediction?.riskLevel === 'High').length;
    const activeCount = patients.length;

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <Loader2 className="animate-spin h-8 w-8 text-teal-600" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex text-sm selection:bg-teal-100 selection:text-teal-900">

            {/* SIDEBAR */}
            <Sidebar />

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col min-w-0">
                <Header
                    doctorName={doctorName}
                    title="Patient Directory"
                    subtitle="Manage your patient panel and records"
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />

                <div className="flex-1 p-6 lg:p-8 overflow-y-auto">

                    {/* STATS ROW (ULTRA MODERN) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

                        {/* Total Patients */}
                        <div className="group relative bg-white rounded-[24px] p-6 shadow-[0_2px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 overflow-hidden border border-slate-100">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500 transform group-hover:scale-110">
                                <User size={140} className="text-blue-900" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                                        <User size={18} strokeWidth={2.5} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Patients</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-5xl font-black text-slate-800 tracking-tight">{activeCount}</h3>
                                    <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                                        <TrendingUp size={12} /> +12%
                                    </span>
                                </div>
                                <p className="text-slate-400 text-xs font-medium mt-3 pl-1">Active within last 30 days</p>
                            </div>
                        </div>

                        {/* Low Risk */}
                        <div className="group relative bg-white rounded-[24px] p-6 shadow-[0_2px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 overflow-hidden border border-slate-100">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500 transform group-hover:scale-110">
                                <ShieldCheck size={140} className="text-emerald-900" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                                        <ShieldCheck size={18} strokeWidth={2.5} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Stable</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-5xl font-black text-slate-800 tracking-tight">{activeCount - highRiskCount}</h3>
                                    <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                                        <TrendingUp size={12} /> +5%
                                    </span>
                                </div>
                                <p className="text-slate-400 text-xs font-medium mt-3 pl-1">Low clinical risk detected</p>
                            </div>
                        </div>

                        {/* High Risk */}
                        <div className="group relative bg-white rounded-[24px] p-6 shadow-[0_2px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(239,68,68,0.15)] transition-all duration-500 overflow-hidden border border-slate-100 hover:border-red-100">
                            <div className="absolute inset-0 bg-gradient-to-r from-red-50/0 to-red-50/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500 transform group-hover:scale-110">
                                <AlertTriangle size={140} className="text-red-900" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform duration-300 animate-pulse">
                                        <AlertTriangle size={18} strokeWidth={2.5} />
                                    </div>
                                    <span className="text-xs font-bold text-red-400 uppercase tracking-widest group-hover:text-red-500 transition-colors">Attention Needed</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-5xl font-black text-slate-800 tracking-tight">{highRiskCount}</h3>
                                    <span className="text-sm font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 flex items-center gap-1">
                                        <TrendingUp size={12} /> +2
                                    </span>
                                </div>
                                <p className="text-slate-400 text-xs font-medium mt-3 pl-1 group-hover:text-red-400 transition-colors">Require immediate review</p>
                            </div>
                        </div>
                    </div>

                    {/* TABLE SECTION (FLOATING ROWS) */}
                    <div className="flex items-center justify-between mb-6 px-1">
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Active Patients</h2>
                        <div className="flex gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className={`h-9 px-4 rounded-xl text-xs font-bold border-slate-200 bg-white hover:bg-slate-50 shadow-sm ${filterType !== 'all' ? 'text-blue-600 border-blue-200 bg-blue-50' : 'text-slate-500'}`}>
                                        <Filter size={14} className="mr-2" />
                                        {filterType === 'all' ? 'Filter' : filterType === 'high' ? 'High Risk' : 'Low Risk'}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-white z-50 shadow-xl border border-slate-100">
                                    <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setFilterType('all')} className="cursor-pointer hover:bg-slate-50">All Patients</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setFilterType('high')} className="text-red-600 focus:text-red-700 cursor-pointer hover:bg-red-50">High Risk Only</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setFilterType('low')} className="text-emerald-600 focus:text-emerald-700 cursor-pointer hover:bg-emerald-50">Low Risk Only</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button onClick={handleExportCSV} variant="outline" size="sm" className="h-9 px-4 rounded-xl text-xs font-bold text-slate-500 border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-800 shadow-sm">
                                <FileDown size={14} className="mr-2" /> Export CSV
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {filteredPatients.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border border-dashed border-slate-200">
                                <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-slate-300">
                                    <User size={32} />
                                </div>
                                <p className="text-slate-500 font-medium">No patients found</p>
                            </div>
                        ) : (
                            filteredPatients.map((patient) => (
                                <div
                                    key={patient._id}
                                    onClick={() => router.push(`/doctor/patients/${patient._id}`)}
                                    className="group flex flex-col md:flex-row md:items-center p-4 bg-white rounded-[20px] border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.01)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.05)] hover:border-blue-100 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative overflow-hidden"
                                >
                                    {/* Hover Strip */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    <div className="flex items-center justify-between w-full md:w-auto md:flex-1">
                                        {/* NAME */}
                                        <div className="flex items-center gap-4 pl-2">
                                            <Avatar className="h-10 w-10 md:h-12 md:w-12 border border-slate-100 shadow-sm group-hover:scale-105 transition-transform bg-white">
                                                <AvatarFallback className="font-bold text-slate-600 bg-slate-50">{patient.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm md:text-[15px] group-hover:text-blue-700 transition-colors">{patient.name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium font-mono">ID: {patient._id.slice(-6).toUpperCase()}</p>
                                            </div>
                                        </div>

                                        {/* Mobile Risk Indicator */}
                                        <div className="md:hidden">
                                            <div className={`p-1.5 rounded-full border ${patient.prediction?.riskLevel === 'High' ? 'bg-red-50 border-red-100 text-red-500' : 'bg-emerald-50 border-emerald-100 text-emerald-500'}`}>
                                                <Activity size={14} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap md:flex-nowrap items-center w-full md:w-auto mt-4 md:mt-0 gap-4 md:gap-0">
                                        {/* STATUS */}
                                        <div className="flex-1 md:w-40 flex justify-start md:justify-center">
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold border ${patient.prediction?.riskLevel === 'High'
                                                ? 'bg-red-50 text-red-700 border-red-100'
                                                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                }`}>
                                                <span className={`h-1.5 w-1.5 md:h-2 md:w-2 rounded-full ${patient.prediction?.riskLevel === 'High' ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                                                {patient.prediction?.riskLevel || "Low"} Risk
                                            </div>
                                        </div>

                                        {/* CONTACT */}
                                        <div className="w-full md:w-64 flex flex-col md:flex-col gap-1 text-left md:pl-8 py-2 md:py-0 border-t md:border-t-0 border-slate-50">
                                            <div className="flex items-center gap-2 text-slate-500 text-xs">
                                                <Mail size={12} className="text-slate-400" />
                                                <span className="truncate">{patient.email || "No email"}</span>
                                            </div>
                                            <div className="hidden md:flex items-center gap-2 text-slate-500 text-xs">
                                                <Phone size={12} className="text-slate-400" />
                                                <span className="truncate">{patient.phone || "No phone"}</span>
                                            </div>
                                        </div>

                                        {/* LAST VISIT */}
                                        <div className="flex-none w-auto md:w-32 text-right md:text-center text-slate-500 text-[10px] md:text-xs font-bold ml-auto md:ml-0">
                                            <div className="flex items-center justify-center gap-1.5 p-1.5 md:p-2 rounded-lg group-hover:bg-slate-50 transition-colors">
                                                <Calendar size={12} className="text-slate-300 md:hidden" />
                                                <span className="md:hidden">Last: </span>
                                                {new Date(patient.updatedAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                            </div>
                                        </div>

                                        {/* ACTION */}
                                        <div className="hidden md:flex w-16 justify-end pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                <ChevronRight size={16} />
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            ))
                        )}
                    </div>

                </div>
                <MobileNav />
            </main>
        </div>
    );
}
