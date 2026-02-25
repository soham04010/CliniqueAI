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
        <div className="h-screen bg-[#F8FAFC] font-sans text-slate-900 flex flex-col overflow-hidden">

            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 flex-none">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <Button onClick={() => router.back()} variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="h-8 w-[1px] bg-slate-100 mx-1 hidden sm:block"></div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-lg tracking-tight text-slate-900">Messages</span>
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">Secure Clinical Communication</p>
                        </div>
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