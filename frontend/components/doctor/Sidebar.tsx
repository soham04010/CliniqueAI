"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    MessageSquare,
    Users,
    FileText,
    Activity,
    LogOut,
    ChevronRight,
    PanelLeftClose,
    PanelLeftOpen
} from "lucide-react";
import { useState, useEffect } from "react";

export default function Sidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("sidebar-collapsed");
        if (stored) setIsCollapsed(JSON.parse(stored));
    }, []);

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem("sidebar-collapsed", JSON.stringify(newState));
    };

    const navItems = [
        { icon: LayoutDashboard, label: "Dashboard", path: "/doctor/dashboard" },
        { icon: MessageSquare, label: "Inbox", path: "/doctor/inbox" },
        { icon: Users, label: "Patients", path: "/doctor/patients" },
        { icon: FileText, label: "Medical Reports", path: "/doctor/reports" },
    ];

    return (
        <aside className={`bg-white border-r border-slate-100 flex flex-col justify-between hidden md:flex sticky top-0 h-screen z-50 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-20 lg:w-72'}`}>
            <div className="flex flex-col h-full">
                {/* Logo & Toggle Section */}
                <div className={`h-24 flex items-center ${isCollapsed ? 'justify-center flex-col gap-2' : 'justify-between px-6'}`}>
                    <Link href="/doctor/dashboard">
                        <div className="flex items-center gap-3 cursor-pointer group">
                            <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center border border-white/10 shadow-lg group-hover:scale-105 transition-transform">
                                <Activity className="h-6 w-6 text-[#2bd4bd]" strokeWidth={3} />
                            </div>
                            {!isCollapsed && (
                                <span className="font-black text-2xl text-slate-900 hidden lg:block tracking-tighter group-hover:text-[#2bd4bd] transition-colors">
                                    CliniqueAI
                                </span>
                            )}
                        </div>
                    </Link>

                    {/* Desktop Toggle Button */}
                    <button
                        onClick={toggleSidebar}
                        className={`hidden lg:flex p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors ${isCollapsed ? '' : 'ml-auto'}`}
                    >
                        {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-2 mt-2">
                    {navItems.map((item, idx) => {
                        const isActive = pathname === item.path;

                        return (
                            <Link key={idx} href={item.path || "#"}>
                                <div className={`relative group flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 cursor-pointer overflow-hidden ${isActive
                                    ? "bg-teal-50 text-teal-800 font-bold shadow-sm ring-1 ring-teal-100"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                    }`}>

                                    <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'gap-3.5'} relative z-10 w-full`}>
                                        <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-teal-600" : "text-slate-400 group-hover:text-slate-600"} />
                                        {!isCollapsed && <span className={`hidden lg:block text-[15px] ${isActive ? "text-teal-900" : ""}`}>{item.label}</span>}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </nav>



            </div>
        </aside>
    );
}
