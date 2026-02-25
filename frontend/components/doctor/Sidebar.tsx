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
    PanelLeftOpen,
    User
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [user, setUser] = useState<{ name: string; role?: string } | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("sidebar-collapsed");
        if (stored) setIsCollapsed(JSON.parse(stored));

        const userStr = localStorage.getItem("user");
        if (userStr) {
            setUser(JSON.parse(userStr));
        }
    }, []);

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem("sidebar-collapsed", JSON.stringify(newState));
    };

    const navGroups = [
        {
            label: "Main",
            items: [
                { icon: LayoutDashboard, label: "Dashboard", path: "/doctor/dashboard" },
                { icon: Users, label: "Patients", path: "/doctor/patients" },
                { icon: FileText, label: "Medical Reports", path: "/doctor/reports" },
            ]
        },
        {
            label: "Communication",
            items: [
                { icon: MessageSquare, label: "Inbox", path: "/doctor/inbox" },
            ]
        }
    ];

    return (
        <aside className={`bg-slate-50/50 border-r border-slate-200 flex flex-col justify-between hidden md:flex sticky top-0 h-screen z-50 transition-all duration-200 ease-in-out ${isCollapsed ? 'w-20' : 'w-20 lg:w-72'}`}>
            <div className="flex flex-col h-full">
                {/* Logo & Toggle Section */}
                <div className={`h-20 flex items-center border-b border-slate-100 mb-6 ${isCollapsed ? 'justify-center flex-col gap-2' : 'justify-between px-6'}`}>
                    <Link href="/doctor/dashboard">
                        <div className="flex items-center gap-3 cursor-pointer group">
                            <div className="h-9 w-9 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800 shadow-sm transition-transform duration-200">
                                <Activity className="h-5 w-5 text-[#2bd4bd]" strokeWidth={2.5} />
                            </div>
                            {!isCollapsed && (
                                <div className="hidden lg:block">
                                    <h1 className="font-bold text-lg text-slate-900 tracking-tight leading-none">CliniqueAI</h1>
                                    <div className="flex items-center gap-1 mt-1">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Operational</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Link>

                    {/* Desktop Toggle Button */}
                    <button
                        onClick={toggleSidebar}
                        aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        className={`hidden lg:flex p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 ${isCollapsed ? '' : 'ml-auto'}`}
                    >
                        {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-6">
                    {navGroups.map((group, gIdx) => (
                        <div key={gIdx} className="space-y-1">
                            {!isCollapsed && (
                                <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 hidden lg:block">
                                    {group.label}
                                </p>
                            )}
                            <div className="space-y-1">
                                {group.items.map((item, idx) => {
                                    const isActive = pathname === item.path;

                                    return (
                                        <Link
                                            key={idx}
                                            href={item.path || "#"}
                                            title={isCollapsed ? item.label : ""}
                                            aria-current={isActive ? "page" : undefined}
                                            className="block"
                                        >
                                            <div className={cn(
                                                "relative group flex items-center px-4 py-2.5 rounded-md transition-all duration-150 cursor-pointer overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
                                                isActive
                                                    ? "bg-white text-slate-900 font-bold border border-slate-200 shadow-sm"
                                                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                            )}>
                                                {/* Left Accent Strip */}
                                                {isActive && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-slate-900 rounded-r-full" />
                                                )}

                                                <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'gap-3'} relative z-10 w-full`}>
                                                    <item.icon
                                                        size={18}
                                                        strokeWidth={isActive ? 2.5 : 2}
                                                        className={isActive ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600"}
                                                    />
                                                    {!isCollapsed && (
                                                        <span className="hidden lg:block text-[13px] tracking-tight">
                                                            {item.label}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                            {gIdx < navGroups.length - 1 && <div className="mx-4 my-4 border-t border-slate-100" />}
                        </div>
                    ))}
                </nav>

                {/* Bottom Profile Section */}
                <div className="p-4 border-t border-slate-100">
                    <div className={cn(
                        "flex items-center gap-3 p-2 rounded-lg bg-slate-100/50 border border-slate-200/50",
                        isCollapsed ? "justify-center" : ""
                    )}>
                        <div className="h-8 w-8 rounded-md bg-white border border-slate-200 flex items-center justify-center">
                            <User size={16} className="text-slate-400" />
                        </div>
                        {!isCollapsed && (
                            <div className="hidden lg:block overflow-hidden">
                                <p className="text-[11px] font-bold text-slate-900 truncate uppercase tracking-tight leading-none">
                                    {user?.name ? (user.name.startsWith("Dr.") ? user.name : `Dr. ${user.name}`) : "Dr. Clinical User"}
                                </p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                    {user?.role || "Cardiologist"}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </aside>
    );
}
