"use client";

import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    MessageSquare,
    Users,
    FileText,
    Activity,
    Settings,
    History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/shared/AuthProvider";

export function MobileNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuth();

    if (!user) return null;

    const role = user.role;

    const doctorItems = [
        { icon: LayoutDashboard, label: "Home", path: "/doctor/dashboard" },
        { icon: MessageSquare, label: "Inbox", path: "/doctor/inbox" },
        { icon: Users, label: "Patients", path: "/doctor/patients" },
        { icon: Settings, label: "Settings", path: "/doctor/settings" },
    ];

    const patientItems = [
        { icon: LayoutDashboard, label: "Home", path: "/patient/dashboard" },
        { icon: MessageSquare, label: "Chat", path: "/patient/messages" },
        { icon: Activity, label: "History", path: "/patient/history" },
        { icon: Settings, label: "Settings", path: "/patient/settings" },
    ];

    const items = role === 'doctor' ? doctorItems : patientItems;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 px-4 flex items-center justify-around z-50 pb-safe shadow-[0_-1px_10px_rgba(0,0,0,0.05)]">
            {items.map((item) => {
                const isActive = pathname === item.path;
                return (
                    <button
                        key={item.path}
                        onClick={() => router.push(item.path)}
                        className="flex flex-col items-center justify-center gap-1 min-w-[64px]"
                    >
                        <div className={cn(
                            "p-1.5 rounded-lg transition-all",
                            isActive ? (role === 'doctor' ? "bg-teal-50 text-teal-600" : "bg-indigo-50 text-indigo-600") : "text-slate-400"
                        )}>
                            <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                        </div>
                        <span className={cn(
                            "text-[10px] font-bold uppercase tracking-tighter",
                            isActive ? (role === 'doctor' ? "text-teal-700" : "text-indigo-700") : "text-slate-400"
                        )}>
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
}
