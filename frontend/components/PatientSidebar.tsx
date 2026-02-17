"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
    Activity,
    LayoutDashboard,
    MessageSquare,
    Settings,
    LogOut,
    ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PatientSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Only run on client after mount
        if (typeof window !== 'undefined') {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                try {
                    setUser(JSON.parse(userStr));
                } catch (e) {
                    console.error("Failed to parse user data", e);
                }
            }
            
            // Listen for profile updates (photo changes)
            const handleStorageChange = () => {
                const updatedStr = localStorage.getItem("user");
                if (updatedStr) setUser(JSON.parse(updatedStr));
            };
            window.addEventListener("storage", handleStorageChange);
            return () => window.removeEventListener("storage", handleStorageChange);
        }
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        router.push("/login");
    };

    const navItems = [
        { name: "Dashboard", href: "/patient/dashboard", icon: LayoutDashboard },
        { name: "Messages", href: "/patient/messages", icon: MessageSquare },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 z-50">
            {/* Brand */}
            <div className="h-16 flex items-center px-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-600 p-1.5 rounded-lg shadow-sm">
                        <Activity className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-slate-900">CliniqueAI</span>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-6 px-3 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <button
                            key={item.href}
                            onClick={() => router.push(item.href)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                                isActive
                                    ? "bg-indigo-50 text-indigo-700 shadow-sm"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")} />
                            {item.name}
                        </button>
                    );
                })}
            </div>

            {/* User Profile Dropdown */}
            <div className="p-4 border-t border-slate-100">
                {user && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group select-none">
                                <Avatar className="h-9 w-9 border border-slate-200">
                                    {/* UPDATED: Prioritize profilePicture */}
                                    <AvatarImage src={user?.profilePicture || user?.avatar} className="object-cover" />
                                    <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold">
                                        {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'Loading...'}</p>
                                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                </div>
                                <ChevronUp className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 mb-2" align="start" side="top">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push('/patient/settings')} className="cursor-pointer">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </aside>
    );
}