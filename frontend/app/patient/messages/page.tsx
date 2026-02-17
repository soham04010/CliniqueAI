"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    LogOut,
    Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ChatBox from "@/components/ChatBox";

export default function PatientMessagesPage() {
    const router = useRouter();
    const [patient, setPatient] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (!userStr) {
            router.push("/login");
            return;
        }
        setPatient(JSON.parse(userStr));
        setLoading(false);
    }, [router]);

    const handleLogout = () => {
        localStorage.clear();
        router.push("/login");
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex flex-col">

            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 flex-none">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <Button onClick={() => router.back()} variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <div className="bg-indigo-600 p-1.5 rounded-lg">
                                <Activity className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold text-lg tracking-tight text-slate-900">Messages</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-3 text-right">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">{patient?.name}</p>
                                <p className="text-xs text-slate-500">Patient ID: {patient?._id?.slice(-6).toUpperCase()}</p>
                            </div>
                            <Avatar className="h-9 w-9 border border-slate-200">
                                <AvatarImage src={patient?.avatar} />
                                <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold">{patient?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </div>
                        <Button onClick={handleLogout} variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 hover:bg-red-50">
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content (ChatBox) */}
            <main className="flex-1 w-full h-[calc(100vh-64px)]">
                <ChatBox
                    senderId={patient._id}
                    senderName={patient.name}
                />
            </main>

        </div>
    );
}
