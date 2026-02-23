"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    Bell,
    Settings,
    HelpCircle,
    LogOut,
} from "lucide-react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import HelpSupportModal from "@/components/shared/HelpSupportModal";

interface HeaderProps {
    doctorName?: string;
    doctorImage?: string; // Added Prop
    searchQuery?: string;
    setSearchQuery?: (query: string) => void;
    title?: string;
    subtitle?: string;
    rightAction?: React.ReactNode;
}

export default function Header({
    doctorName = "Doctor",
    doctorImage,
    searchQuery,
    setSearchQuery,
    title = "Dashboard",
    subtitle = "Live risk intelligence overview",
    rightAction
}: HeaderProps) {
    const router = useRouter();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isHelpSupportOpen, setIsHelpSupportOpen] = useState(false);

    // Local state to handle instant updates from Settings page
    const [localImage, setLocalImage] = useState(doctorImage);
    const [localName, setLocalName] = useState(doctorName);

    // 1. Sync with Local Storage (Instant Updates)
    useEffect(() => {
        const syncUser = () => {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    // Prioritize Cloudinary 'profilePicture', fallback to 'avatar'
                    setLocalImage(user.profilePicture || user.avatar);
                    setLocalName(user.name);
                } catch (e) {
                    console.error("Header parse error", e);
                }
            }
        };

        // Initial load
        syncUser();

        // Listen for updates from Settings page
        window.addEventListener("storage", syncUser);
        return () => window.removeEventListener("storage", syncUser);
    }, []);

    // 2. Fetch Notifications
    const fetchNotifications = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const { data } = await api.get('/notifications');
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
        } catch (error: any) {
            if (error.code !== "ERR_NETWORK") {
                console.warn("Failed to fetch notifications:", error.message);
            }
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleMarkRead = async (id: string, link?: string) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            if (link) {
                setIsOpen(false);
                router.push(link);
            }
        } catch (e) {
            console.error("Error marking read");
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (e) {
            console.error("Error marking all read");
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push("/login");
    };

    return (
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 transition-all duration-300">

            {/* Left: Title or Search */}
            <div className="flex items-center gap-8 w-full max-w-3xl">
                {title && (
                    <div className="hidden lg:block">
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h1>
                        {subtitle && <p className="text-xs font-medium text-slate-500 mt-0.5">{subtitle}</p>}
                    </div>
                )}

                {setSearchQuery && (
                    <div className="relative w-full max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors h-5 w-5" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search patients, messages, or reports..."
                            className="pl-12 h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-full transition-all text-slate-700 font-medium placeholder:text-slate-400 text-sm"
                        />
                    </div>
                )}
            </div>

            {/* Right: Actions & Profile */}
            <div className="flex items-center gap-2 md:gap-6">
                <div className="flex items-center gap-2 md:gap-4 border-r border-slate-200 pr-3 md:pr-6">
                    {rightAction && <div>{rightAction}</div>}

                    {/* Notifications Popover */}
                    <Popover open={isOpen} onOpenChange={setIsOpen}>
                        <PopoverTrigger asChild>
                            <button className="relative h-10 w-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-teal-600 hover:border-teal-200 hover:shadow-md transition-all active:scale-95 outline-none">
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0 mr-4 bg-white border-slate-100 shadow-xl rounded-2xl overflow-hidden" align="end">
                            <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                                <h4 className="font-bold text-slate-800">Notifications</h4>
                                {unreadCount > 0 && <span className="bg-teal-100 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount} New</span>}
                            </div>
                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                {notifications.length > 0 ? (
                                    notifications.map((notif) => (
                                        <div
                                            key={notif._id}
                                            onClick={() => handleMarkRead(notif._id, notif.data?.patientId ? `/doctor/patients/${notif.data.patientId}` : undefined)}
                                            className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${!notif.read ? 'bg-blue-50/30' : ''}`}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!notif.read ? 'bg-blue-500' : 'bg-slate-200'}`}></div>
                                                <div>
                                                    <p className={`text-sm ${!notif.read ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                                                        {notif.message}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center">
                                        <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Bell className="h-6 w-6 text-slate-300" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-700">No new notifications</p>
                                    </div>
                                )}
                            </div>
                            {notifications.length > 0 && (
                                <div className="p-3 bg-slate-50/50 text-center border-t border-slate-100">
                                    <button onClick={markAllAsRead} className="text-xs font-bold text-blue-600 hover:text-blue-700">Mark all as read</button>
                                </div>
                            )}
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Profile Dropdown */}
                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-slate-800">
                            {/* Uses localName for instant updates */}
                            Dr. {(localName || "Doctor").replace(/^Dr\.?\s*/i, "").split(" ")[0]}
                        </p>
                        <p className="text-xs text-slate-500 font-medium">Cardiologist</p>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Avatar className="h-11 w-11 border-2 border-white ring-2 ring-slate-100 cursor-pointer hover:ring-teal-100 transition-all">
                                {/* UPDATED: Uses localImage logic */}
                                <AvatarImage src={localImage || undefined} className="object-cover" />
                                <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-bold text-lg">
                                    {(localName || "D").replace(/^Dr\.?\s*/i, "").charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 mr-6 bg-white border-slate-100 shadow-xl rounded-2xl p-2" align="end">
                            <DropdownMenuLabel className="font-bold text-slate-700 px-3 py-2">My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-100" />
                            <DropdownMenuItem onClick={() => router.push("/doctor/settings")} className="p-3 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-600 font-medium text-sm gap-2">
                                <Settings size={16} /> Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsHelpSupportOpen(true)} className="p-3 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-600 font-medium text-sm gap-2">
                                <HelpCircle size={16} /> Help & Support
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-100" />
                            <DropdownMenuItem onClick={handleLogout} className="p-3 rounded-lg hover:bg-red-50 cursor-pointer text-red-600 font-bold text-sm gap-2 focus:bg-red-50 focus:text-red-700">
                                <LogOut size={16} /> Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <HelpSupportModal
                        isOpen={isHelpSupportOpen}
                        onOpenChange={setIsHelpSupportOpen}
                    />
                </div>
            </div>
        </header>
    );
}