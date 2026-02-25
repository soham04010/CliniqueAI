"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
    Activity,
    LayoutDashboard,
    MessageSquare,
    Settings,
    LogOut,
    ChevronUp,
    HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import HelpSupportModal from "@/components/shared/HelpSupportModal";
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
    const [isHelpOpen, setIsHelpOpen] = useState(false);

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
        { name: "History", href: "/patient/history", icon: Activity },
        { name: "Messages", href: "/patient/messages", icon: MessageSquare },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 z-50">
            {/* Brand */}
            <div className="h-20 flex items-center px-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="bg-slate-900 p-1.5 rounded-lg shadow-sm">
                        <Activity className="h-5 w-5 text-[#2bd4bd]" strokeWidth={2.5} />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-slate-900">CliniqueAI</span>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-8 px-0 space-y-1">
                <p className="px-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">My Health</p>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <button
                            key={item.href}
                            onClick={() => router.push(item.href)}
                            className={cn(
                                "w-full relative flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all duration-200 group outline-none focus-visible:bg-slate-50",
                                isActive
                                    ? "bg-slate-50/50 text-slate-900 font-bold"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-indigo-600 rounded-r-full" />
                            )}
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
                            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50/50 border border-slate-200/50 cursor-pointer transition-colors group select-none">
                                <Avatar className="h-8 w-8 border border-slate-200 rounded-md">
                                    <AvatarImage src={user?.profilePicture || user?.avatar} className="object-cover" />
                                    <AvatarFallback className="bg-white text-slate-600 font-bold text-xs">
                                        {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="text-xs font-bold text-slate-900 truncate uppercase tracking-tight">{user?.name || 'Loading...'}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Verified Profile</p>
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
                            <DropdownMenuItem onClick={() => setIsHelpOpen(true)} className="cursor-pointer">
                                <HelpCircle className="mr-2 h-4 w-4" />
                                <span>Help & Support</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            <HelpSupportModal
                isOpen={isHelpOpen}
                onOpenChange={setIsHelpOpen}
            />
        </aside>
    );
}