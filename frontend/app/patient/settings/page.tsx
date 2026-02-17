"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Activity, LogOut, ArrowLeft, Save, Loader2, Lock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import api from "@/lib/api";

export default function PatientSettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form States
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    // Password States
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    // Phone OTP States
    const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false);
    const [otp, setOtp] = useState("");
    const [newPhone, setNewPhone] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);

    const handleRequestOtp = async () => {
        setOtpLoading(true);
        try {
            await api.post("/auth/request-phone-otp");
            toast.success("OTP Sent!", { description: "Check your email/console." });
            setOtpSent(true);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to send OTP");
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || !newPhone) {
            toast.error("MissingFields", { description: "Please enter OTP and new number." });
            return;
        }
        setOtpLoading(true);
        try {
            const { data } = await api.put("/auth/update-phone", { otp, newPhone });
            toast.success("Success!", { description: "Phone number updated securey." });

            // Update Local State
            const updatedUser = { ...user, phone: data.phone };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setUser(updatedUser);

            // Reset & Close
            setIsPhoneDialogOpen(false);
            setOtpSent(false);
            setOtp("");
            setNewPhone("");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Invalid OTP");
        } finally {
            setOtpLoading(false);
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const userStr = localStorage.getItem("user");
                if (!userStr) {
                    router.push("/login");
                    return;
                }
                const localUser = JSON.parse(userStr);
                setUser(localUser);
                setName(localUser.name);
                setEmail(localUser.email);
                setLoading(false);
            } catch (e) {
                router.push("/login");
            }
        };
        fetchProfile();
    }, [router]);

    const handleUpdateProfile = async () => {
        setSaving(true);
        try {
            const { data } = await api.put("/auth/profile", { name, email });
            // Update local storage
            const updatedUser = { ...user, name, email };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setUser(updatedUser);
            toast.success("Profile updated successfully");
            // Trigger a re-render or header update if needed via context/event
            window.dispatchEvent(new Event("storage"));
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePassword = async () => {
        setSaving(true);
        try {
            await api.put("/auth/password", { currentPassword, newPassword });
            toast.success("Password changed successfully");
            setCurrentPassword("");
            setNewPassword("");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to change password");
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push("/login");
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-12">

            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button onClick={() => router.back()} variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <div className="bg-indigo-600 p-1.5 rounded-lg">
                                <Activity className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold text-lg tracking-tight text-slate-900">Settings</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-3 text-right">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                                <p className="text-xs text-slate-500">Patient</p>
                            </div>
                            <Avatar className="h-9 w-9 border border-slate-200">
                                <AvatarImage src={user?.avatar} />
                                <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold">{user?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </div>
                        <Button onClick={handleLogout} variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 hover:bg-red-50">
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">

                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
                    <p className="text-slate-500">Manage your profile and security.</p>
                </div>

                {/* Profile Card */}
                <Card className="border border-slate-200 shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-indigo-600" />
                            Profile Information
                        </CardTitle>
                        <CardDescription>Update your personal details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled className="bg-slate-50" />
                        </div>
                        <div className="pt-2">
                            <Button onClick={handleUpdateProfile} disabled={saving} className="bg-slate-900 text-white hover:bg-slate-800">
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Security Card */}
                <Card className="border border-slate-200 shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-indigo-600" />
                            Security
                        </CardTitle>
                        <CardDescription>Change your password.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="current">Current Password</Label>
                            <Input id="current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="new">New Password</Label>
                            <Input id="new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                        </div>
                        <div className="pt-2">
                            <Button onClick={handleUpdatePassword} disabled={saving} variant="outline" className="border-slate-200">
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Password
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Phone Number Logic */}
                <Card className="border border-slate-200 shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Phone className="h-5 w-5 text-indigo-600" />
                            Phone Number
                        </CardTitle>
                        <CardDescription>Securely update your contact number.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Current Phone Number</Label>
                            <div className="flex items-center gap-4">
                                <Input value={user?.phone || "Not Set"} disabled className="bg-slate-50 flex-1" />
                                <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">Change</Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-white z-50 shadow-xl">
                                        <DialogHeader>
                                            <DialogTitle>Update Phone Number</DialogTitle>
                                            <DialogDescription>
                                                To secure your account, we'll send a One-Time Password (OTP) to your <strong>email address</strong> before updating.
                                            </DialogDescription>
                                        </DialogHeader>

                                        {!otpSent ? (
                                            <div className="space-y-4 py-4">
                                                <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
                                                    Click below to generate a secure OTP.
                                                </div>
                                                <Button onClick={handleRequestOtp} disabled={otpLoading} className="w-full bg-slate-900">
                                                    {otpLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Send OTP
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label>Enter OTP</Label>
                                                    <Input placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} className="tracking-widest text-center text-lg" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>New Phone Number</Label>
                                                    <Input placeholder="+1 234 567 8900" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
                                                </div>
                                                <Button onClick={handleVerifyOtp} disabled={otpLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                                                    {otpLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Verify & Update
                                                </Button>
                                            </div>
                                        )}
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </main>
        </div>
    );
}
