'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Calendar, Activity, Droplets, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';

export default function PatientHistoryPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<any[]>([]);
    const [patientName, setPatientName] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const userStr = localStorage.getItem('user');
                if (!userStr) {
                    router.push('/login');
                    return;
                }

                const user = JSON.parse(userStr);
                setPatientName(user.name);

                // Fetch history
                const { data } = await api.get(`/patients/history/${encodeURIComponent(user.name)}`);

                // Sort by date descending (newest first)
                const sortedHistory = Array.isArray(data) ? data.sort((a: any, b: any) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                ) : [];

                setHistory(sortedHistory);
            } catch (error) {
                console.error("Failed to fetch history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 font-sans text-slate-900">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/patient/dashboard">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-200/50">
                            <ArrowLeft className="h-6 w-6 text-slate-600" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Health History</h1>
                        <p className="text-slate-500 text-sm">Track your vital trends over time.</p>
                    </div>
                </div>

                {/* History List */}
                <Card className="rounded-[2rem] border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden bg-white">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-6">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-indigo-500" />
                                Past Assessments
                            </CardTitle>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                                {history.length} Records
                            </span>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {history.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-slate-400">No history records found.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/30 border-b border-slate-100/50">
                                            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Risk Score</th>
                                            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">HbA1c</th>
                                            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Glucose</th>
                                            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">BMI</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {history.map((record, index) => {
                                            const riskScore = record.prediction?.riskScore || 0;
                                            const date = new Date(record.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            });

                                            return (
                                                <tr key={index} className="hover:bg-indigo-50/30 transition-colors group">
                                                    <td className="px-8 py-5 text-sm font-semibold text-slate-600 whitespace-nowrap">
                                                        {date}
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${riskScore > 50
                                                            ? 'bg-rose-50 text-rose-600 border-rose-100'
                                                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                            }`}>
                                                            {riskScore.toFixed(2)}%
                                                            <span className="opacity-70 font-medium">Risk</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-sm font-bold text-slate-700">
                                                        <div className="flex items-center gap-2">
                                                            <Activity className="h-3.5 w-3.5 text-purple-400" />
                                                            {record.inputs?.HbA1c_level ?? '--'}%
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-sm font-bold text-slate-700">
                                                        <div className="flex items-center gap-2">
                                                            <Droplets className="h-3.5 w-3.5 text-blue-400" />
                                                            {record.inputs?.blood_glucose_level ?? '--'}
                                                            <span className="text-[10px] text-slate-400 font-normal">mg/dL</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-sm font-bold text-slate-700">
                                                        <div className="flex items-center gap-2">
                                                            <Scale className="h-3.5 w-3.5 text-orange-400" />
                                                            {record.inputs?.bmi ?? '--'}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
