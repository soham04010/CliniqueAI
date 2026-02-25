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
import BrandedLoading from "@/components/shared/BrandedLoading";
import Sidebar from "@/components/doctor/Sidebar";
import Header from "@/components/doctor/Header";
import { MobileNav } from "@/components/shared/MobileNav";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
        <BrandedLoading message="Fetching Patient Directory..." />
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                        {/* Total Patients */}
                        <Card className="bg-white rounded-[10px] p-5 border border-slate-200 flex flex-col justify-between min-h-[130px]">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <User size={14} strokeWidth={2} />
                                    <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Global Register</h4>
                                </div>
                                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-tight">Clinical Cohort</h2>
                            </div>

                            <div className="mt-4 flex flex-col flex-1 justify-end">
                                <div className="flex items-baseline justify-between">
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{activeCount}</h3>
                                    <div className="text-[10px] font-bold text-emerald-600">
                                        ▲ 12%
                                    </div>
                                </div>
                                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-tight mt-1">
                                    vs last 30 days
                                </p>
                            </div>
                        </Card>

                        {/* Stable Cases */}
                        <Card className="bg-white rounded-[10px] p-5 border border-slate-200 flex flex-col justify-between min-h-[130px]">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <ShieldCheck size={14} strokeWidth={2} />
                                    <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Clinical Baseline</h4>
                                </div>
                                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-tight">Verified Stable</h2>
                            </div>

                            <div className="mt-4 flex flex-col flex-1 justify-end">
                                <div className="flex items-baseline justify-between">
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{activeCount - highRiskCount}</h3>
                                    <div className="text-[10px] font-bold text-slate-500">
                                        ▼ 2.4%
                                    </div>
                                </div>
                                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-tight mt-1">
                                    Stable Capacity
                                </p>
                            </div>
                        </Card>

                        {/* Attention Needed */}
                        <Card className="bg-white rounded-[10px] p-5 border border-slate-200 border-l-4 border-l-red-600 relative overflow-hidden flex flex-col justify-between min-h-[130px]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded bg-red-50 flex items-center justify-center text-red-600 border border-red-100">
                                        <AlertTriangle size={16} strokeWidth={2.5} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <h4 className="text-[10px] font-bold text-red-900 uppercase tracking-widest">Urgent</h4>
                                        <h2 className="text-[11px] font-black text-red-600 uppercase tracking-tight">Critical Cases</h2>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-col flex-1 justify-end">
                                <div className="flex items-baseline justify-between">
                                    <h3 className="text-3xl font-black text-red-950 tracking-tight">{highRiskCount}</h3>
                                    <div className="text-[10px] font-bold text-red-600 animate-pulse">
                                        +2 Pending
                                    </div>
                                </div>
                                <p className="text-red-900/40 text-[9px] font-bold uppercase tracking-tight mt-1">
                                    Immediate Review Required
                                </p>
                            </div>
                        </Card>
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

                    <Card className="bg-white rounded-[10px] border border-slate-200 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest h-10 px-6">
                                        <div className="flex items-center gap-1.5">
                                            Patient Profile
                                            <div className="flex flex-col gap-0.5 opacity-30">
                                                <div className="w-1.5 h-0.5 bg-slate-950" />
                                                <div className="w-1 h-0.5 bg-slate-950" />
                                            </div>
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest h-10">
                                        <div className="flex items-center gap-1.5">
                                            Clinical ID
                                            <div className="w-1.5 h-1.5 border-r border-t border-slate-400 rotate-45 mt-1 opacity-20" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest h-10 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            Risk Status
                                            <div className="w-1.5 h-1.5 border-r border-t border-slate-400 rotate-45 mt-1 opacity-20" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest h-10">Communication</TableHead>
                                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest h-10 text-right px-6">
                                        <div className="flex items-center justify-end gap-1.5">
                                            Enrolled Date
                                            <div className="flex flex-col gap-0.5 opacity-30">
                                                <div className="w-1 h-0.5 bg-slate-950" />
                                                <div className="w-1.5 h-0.5 bg-slate-950" />
                                            </div>
                                        </div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPatients.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-64 text-center bg-slate-50/10">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <User className="text-slate-300" size={32} strokeWidth={1} />
                                                <div>
                                                    <p className="text-slate-800 font-black text-sm uppercase">No active records</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Found in current clinical view</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredPatients.map((patient) => {
                                        const enrollmentDate = new Date(patient.createdAt || Date.now());
                                        const formattedDate = `${enrollmentDate.getDate()} ${enrollmentDate.toLocaleString('default', { month: 'short' })} ${enrollmentDate.getFullYear()}`;

                                        return (
                                            <TableRow
                                                key={patient._id}
                                                onClick={() => router.push(`/doctor/patients/${patient._id}`)}
                                                className="group cursor-pointer hover:bg-slate-50 border-slate-50 transition-colors relative"
                                            >
                                                <TableCell className="py-2.5 px-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-slate-900 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        <Avatar className="h-10 w-10 border border-slate-100 bg-white">
                                                            <AvatarFallback className={`text-[10px] font-bold uppercase ${patient.prediction?.riskLevel === 'High' ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-700'}`}>
                                                                {patient.name.charAt(0)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-[13px] font-bold text-slate-900 group-hover:text-black leading-tight uppercase tracking-tight">{patient.name}</p>
                                                            <p className="text-[9px] text-slate-450 font-bold mt-0.5 uppercase tracking-widest leading-none">{patient.inputs?.age || '--'} Yrs • {patient.inputs?.gender === 1 ? 'M' : 'F'}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="py-2.5">
                                                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 uppercase tracking-widest font-mono">
                                                        ID-{patient._id.slice(-6).toUpperCase()}
                                                    </span>
                                                </TableCell>

                                                <TableCell className="py-2.5 text-center">
                                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-[9px] font-black uppercase tracking-wider border ${patient.prediction?.riskLevel === 'High'
                                                        ? 'bg-red-50 text-red-700 border-red-100'
                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                        }`}>
                                                        <div className={`h-1.5 w-1.5 rounded-full ${patient.prediction?.riskLevel === 'High' ? 'bg-red-600' : 'bg-emerald-600'}`} />
                                                        {patient.prediction?.riskLevel || "Low"} Risk
                                                    </div>
                                                </TableCell>

                                                <TableCell className="py-2.5">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2" title={patient.email || "No email"}>
                                                            <Mail size={11} className="text-slate-300" />
                                                            <span className={`text-[10px] font-bold truncate max-w-[150px] uppercase tracking-tight ${!patient.email ? 'text-slate-400 italic' : 'text-slate-600'}`}>
                                                                {patient.email || "Not Provided"}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2" title={patient.phone || "No phone"}>
                                                            <Phone size={11} className="text-slate-300" />
                                                            <span className={`text-[10px] font-bold uppercase tracking-tight ${!patient.phone ? 'text-slate-400 italic' : 'text-slate-600'}`}>
                                                                {patient.phone || "Not Provided"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="py-2.5 text-right px-6">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                                        {formattedDate}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </Card>

                </div>
                <MobileNav />
            </main>
        </div>
    );
}
