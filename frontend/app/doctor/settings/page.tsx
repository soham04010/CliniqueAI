"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    User,
    Bell,
    Shield,
    Mail,
    Smartphone,
    Lock,
    LogOut,
    Camera,
    Save,
    CheckCircle2,
    AlertCircle,
    Building2,
    Stethoscope
} from "lucide-react";
import api from "@/lib/api"; // Added api import
import { toast } from "sonner";
import Sidebar from "@/components/doctor/Sidebar";
import Header from "@/components/doctor/Header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
    const router = useRouter();
    const [doctorName, setDoctorName] = useState("");
    const [loading, setLoading] = useState(false);

    // MOCK STATE
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        specialty: "Cardiology",
        license: "MED-2024-8892",
        clinicName: "Clinique Heart Center",
        phone: "+1 (555) 000-0000",
        bio: "Specializing in preventative cardiology and AI-driven risk assessment."
    });

    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        smsAlerts: false,
        highRiskAlerts: true,
        dailyDigest: true,
        marketing: false
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [security, setSecurity] = useState({
        twoFactor: false,
        sessionTimeout: "30m"
    });

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            const user = JSON.parse(userStr);
            setDoctorName(user.name);
            setSecurity(prev => ({ ...prev, twoFactor: user.twoFactorEnabled || false }));

            setFormData(prev => ({
                ...prev,
                name: user.name || "",
                email: user.email || "",
                specialty: user.specialty || "Cardiology",
                license: user.license || "",
                clinicName: user.clinicName || "",
                phone: user.phone || "",
                bio: user.bio || ""
            }));
        } else {
            router.push("/login");
        }
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            const { data } = await api.put('/auth/profile', formData);

            // Update Local Storage
            localStorage.setItem("user", JSON.stringify(data));
            setDoctorName(data.name);

            toast.success("Profile Updated", {
                description: "Your changes have been saved successfully.",
                icon: <CheckCircle2 className="text-emerald-500" />,
            });
        } catch (error) {
            console.error("Update failed:", error);
            toast.error("Update Failed", { description: "Could not save changes. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async () => {
        if (!passwordData.currentPassword || !passwordData.newPassword) {
            toast.error("Missing Fields", { description: "Please fill in all password fields." });
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("Password Mismatch", { description: "New passwords do not match." });
            return;
        }

        try {
            await api.put('/auth/password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            toast.success("Password Updated", {
                description: "Your password has been changed securelly.",
                icon: <CheckCircle2 className="text-emerald-500" />
            });
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (error: any) {
            toast.error("Update Failed", { description: error.response?.data?.message || "Could not update password." });
        }
    };

    const handle2FAToggle = async (checked: boolean) => {
        try {
            await api.put('/auth/2fa', { enable: checked });
            setSecurity(prev => ({ ...prev, twoFactor: checked }));

            // Update local user object
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const user = JSON.parse(userStr);
                user.twoFactorEnabled = checked;
                localStorage.setItem("user", JSON.stringify(user));
            }

            toast.success(`2FA ${checked ? 'Enabled' : 'Disabled'}`, {
                description: `Two-factor authentication has been turned ${checked ? 'on' : 'off'}.`
            });
        } catch (error) {
            toast.error("Failed to update 2FA settings");
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex text-sm selection:bg-teal-100 selection:text-teal-900">
            <Sidebar />

            <main className="flex-1 flex flex-col min-w-0">
                <Header
                    doctorName={doctorName}
                    title="Account Settings"
                    subtitle="Manage your profile and preferences"
                    searchQuery=""
                    setSearchQuery={() => { }}
                />

                <div className="flex-1 p-6 lg:p-10 overflow-y-auto">
                    <div className="max-w-5xl mx-auto">

                        <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
                            {/* Profile Header Card */}
                            <Card className="w-full md:w-auto flex-1 bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                                <div className="h-24 bg-gradient-to-r from-slate-100 to-slate-200"></div>
                                <div className="px-6 pb-6 -mt-10 flex items-end justify-between">
                                    <div className="flex items-end gap-4">
                                        <div className="relative group">
                                            <Avatar className="h-20 w-20 border-4 border-white shadow-md bg-white">
                                                <AvatarFallback className="bg-slate-100 text-slate-500 text-2xl font-bold">{doctorName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full shadow-md hover:bg-blue-700 transition-colors opacity-0 group-hover:opacity-100">
                                                <Camera size={14} />
                                            </button>
                                        </div>
                                        <div className="mb-1">
                                            <h2 className="text-xl font-bold text-slate-900">{doctorName}</h2>
                                            <p className="text-sm text-slate-500 font-medium">{formData.specialty} • {formData.clinicName}</p>
                                        </div>
                                    </div>
                                    <Button onClick={handleSave} disabled={loading} className="bg-slate-900 hover:bg-slate-800 text-white gap-2 shadow-sm rounded-xl">
                                        {loading ? <span className="animate-spin">⏳</span> : <Save size={16} />} Save Changes
                                    </Button>
                                </div>
                            </Card>
                        </div>

                        <Tabs defaultValue="profile" className="space-y-6">
                            <TabsList className="bg-white p-1 border border-slate-200 rounded-xl shadow-sm h-auto inline-flex">
                                <TabsTrigger value="profile" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 rounded-lg gap-2 px-4 py-2 font-medium text-slate-500 transition-all">
                                    <User size={16} /> Profile
                                </TabsTrigger>
                                <TabsTrigger value="notifications" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 rounded-lg gap-2 px-4 py-2 font-medium text-slate-500 transition-all">
                                    <Bell size={16} /> Notifications
                                </TabsTrigger>
                                <TabsTrigger value="security" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 rounded-lg gap-2 px-4 py-2 font-medium text-slate-500 transition-all">
                                    <Shield size={16} /> Security
                                </TabsTrigger>
                            </TabsList>

                            {/* PROFILE TAB */}
                            <TabsContent value="profile" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
                                    <CardHeader>
                                        <CardTitle>Personal Information</CardTitle>
                                        <CardDescription>Update your public profile and licensing details.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Full Name</Label>
                                                <Input
                                                    id="name"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="bg-slate-50 border-slate-200 focus:bg-white"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email Address</Label>
                                                <Input
                                                    id="email"
                                                    value={formData.email}
                                                    disabled
                                                    className="bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="specialty">Specialty</Label>
                                                <div className="relative">
                                                    <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                                                    <Input
                                                        id="specialty"
                                                        value={formData.specialty}
                                                        onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                                                        className="pl-9 bg-slate-50 border-slate-200 focus:bg-white"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="license">Medical License ID</Label>
                                                <div className="relative">
                                                    <Badge variant="outline" className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-50 text-emerald-600 border-emerald-100">Verified</Badge>
                                                    <Input
                                                        id="license"
                                                        value={formData.license}
                                                        onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                                                        className="bg-slate-50 border-slate-200 focus:bg-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bio">Professional Bio</Label>
                                            <textarea
                                                id="bio"
                                                className="w-full min-h-[100px] rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
                                                value={formData.bio}
                                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            />
                                            <p className="text-xs text-slate-400 text-right">0 / 500 characters</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
                                    <CardHeader>
                                        <CardTitle>Clinic Details</CardTitle>
                                        <CardDescription>Establishment information for patient reports.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="clinicName">Clinic Name</Label>
                                                <div className="relative">
                                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                                                    <Input
                                                        id="clinicName"
                                                        value={formData.clinicName}
                                                        onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                                                        className="pl-9 bg-slate-50 border-slate-200 focus:bg-white"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Contact Phone</Label>
                                                <Input
                                                    id="phone"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    className="bg-slate-50 border-slate-200 focus:bg-white"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* NOTIFICATIONS TAB */}
                            <TabsContent value="notifications" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
                                    <CardHeader>
                                        <CardTitle>Alert Preferences</CardTitle>
                                        <CardDescription>Choose how you want to be notified about patient updates.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-base">Email Notifications</Label>
                                                <p className="text-slate-500 text-xs">Receive daily summaries and critical alerts via email.</p>
                                            </div>
                                            <Switch
                                                checked={notifications.emailAlerts}
                                                onCheckedChange={(checked) => setNotifications({ ...notifications, emailAlerts: checked })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-base">SMS Alerts</Label>
                                                <p className="text-slate-500 text-xs">Get urgent high-risk notifications on your phone.</p>
                                            </div>
                                            <Switch
                                                checked={notifications.smsAlerts}
                                                onCheckedChange={(checked) => setNotifications({ ...notifications, smsAlerts: checked })}
                                            />
                                        </div>
                                        <div className="h-px bg-slate-100 my-4" />
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Event Types</h4>

                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                                                        <AlertCircle size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">High Risk Escalation</p>
                                                        <p className="text-xs text-slate-500">When a patient moves to High Risk category.</p>
                                                    </div>
                                                </div>
                                                <Switch
                                                    checked={notifications.highRiskAlerts}
                                                    onCheckedChange={(checked) => setNotifications({ ...notifications, highRiskAlerts: checked })}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                                        <Mail size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">Daily Clinical Digest</p>
                                                        <p className="text-xs text-slate-500">Morning summary of your patient panel status.</p>
                                                    </div>
                                                </div>
                                                <Switch
                                                    checked={notifications.dailyDigest}
                                                    onCheckedChange={(checked) => setNotifications({ ...notifications, dailyDigest: checked })}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* SECURITY TAB */}
                            <TabsContent value="security" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
                                    <CardHeader>
                                        <CardTitle>Password & Authentication</CardTitle>
                                        <CardDescription>Manage your account security settings.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="currentPass">Current Password</Label>
                                                <Input
                                                    id="currentPass"
                                                    type="password"
                                                    className="bg-slate-50 border-slate-200"
                                                    value={passwordData.currentPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="newPass">New Password</Label>
                                                    <Input
                                                        id="newPass"
                                                        type="password"
                                                        className="bg-slate-50 border-slate-200"
                                                        value={passwordData.newPassword}
                                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="confirmPass">Confirm New Password</Label>
                                                    <Input
                                                        id="confirmPass"
                                                        type="password"
                                                        className="bg-slate-50 border-slate-200"
                                                        value={passwordData.confirmPassword}
                                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end">
                                                <Button onClick={handlePasswordUpdate} variant="outline" className="text-slate-600 hover:text-slate-900 border-slate-200">Update Password</Button>
                                            </div>
                                        </div>

                                        <div className="h-px bg-slate-100 my-4" />

                                        <div className="flex items-center justify-between p-4 border border-blue-100 bg-blue-50/50 rounded-xl">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                                    <Smartphone size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800">Two-Factor Authentication</h4>
                                                    <p className="text-xs text-slate-500">Secure your account with SMS or Authenticator app.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-sm font-bold ${security.twoFactor ? 'text-teal-600' : 'text-slate-400'}`}>
                                                    {security.twoFactor ? "Enabled" : "Disabled"}
                                                </span>
                                                <Switch
                                                    checked={security.twoFactor}
                                                    onCheckedChange={handle2FAToggle}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 border border-red-100 bg-red-50/30 rounded-xl">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                                                    <LogOut size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800">Active Sessions</h4>
                                                    <p className="text-xs text-slate-500">Log out of all other devices and browsers.</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 font-bold">
                                                Log Out All
                                            </Button>
                                        </div>

                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </main>
        </div>
    );
}
