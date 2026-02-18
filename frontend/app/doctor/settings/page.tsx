"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    Activity, LogOut, ArrowLeft, Loader2, Lock, Phone,
    Camera, Save, ShieldCheck, AlertTriangle, CheckCircle,
    Stethoscope, FileText, Bell, AlertCircle as AlertIcon, Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/lib/api";
import Sidebar from "@/components/doctor/Sidebar";
import Header from "@/components/doctor/Header";



export default function DoctorSettingsPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Profile States
    const [name, setName] = useState("");
    const [specialty, setSpecialty] = useState("");
    const [clinicName, setClinicName] = useState("");
    const [bio, setBio] = useState("");
    const [license, setLicense] = useState("");
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    // Notification States
    const [notifications, setNotifications] = useState({
        highRiskAlerts: true,
        dailyDigest: true
    });

    // Password States
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
    const [emailOtp, setEmailOtp] = useState("");

    // Phone States
    const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false);
    const [phoneOtp, setPhoneOtp] = useState("");
    const [newPhone, setNewPhone] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);


    // 1. INITIAL FETCH
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get("/auth/me"); // Use your actual endpoint
                loadUserData(data);
            } catch (e) {
                const userStr = localStorage.getItem("user");
                if (!userStr) {
                    router.push("/login");
                    return;
                }
                loadUserData(JSON.parse(userStr));
            }
        };

        const loadUserData = (data: any) => {
            setUser(data);
            setName(data.name || "");
            setSpecialty(data.specialty || data.specialization || "");
            setClinicName(data.clinicName || "");
            setBio(data.bio || "");
            setLicense(data.license || "");
            setPhotoPreview(data.profilePicture || data.avatar);
            // Mock notifications if not in DB yet
            if (data.notifications) setNotifications(data.notifications);
            setLoading(false);
        };

        fetchProfile();
    }, [router]);

    // 2. PHOTO HANDLING
    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // 3. UPDATE PROFILE
    const handleUpdateProfile = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("specialty", specialty);
            formData.append("clinicName", clinicName);
            formData.append("bio", bio);
            formData.append("license", license);
            // formData.append("notifications", JSON.stringify(notifications)); // If backend supports it

            if (photoFile) {
                formData.append("profilePicture", photoFile);
            }

            const { data } = await api.put("/auth/profile", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            // Update Local Storage
            const updatedUser = {
                ...user,
                name: data.name,
                specialty: data.specialty,
                clinicName: data.clinicName,
                bio: data.bio,
                license: data.license,
                profilePicture: data.profilePicture
            };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setUser(updatedUser);

            toast.success("Profile updated successfully!");
            window.dispatchEvent(new Event("storage"));
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    // 4. PASSWORD UPDATE
    const handleInitiatePasswordChange = async () => {
        if (!currentPassword || !newPassword) {
            toast.error("Please fill in both password fields");
            return;
        }
        setSaving(true);
        try {
            await api.post("/auth/request-password-otp", { email: user.email });
            setIsEmailDialogOpen(true);
            toast.success("Verification Code Sent", { description: `Check ${user.email}` });
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to initiate change");
        } finally {
            setSaving(false);
        }
    };

    const handleConfirmPasswordChange = async () => {
        if (!emailOtp) return toast.error("Enter verification code");
        setSaving(true);
        try {
            await api.put("/auth/update-password-secure", {
                currentPassword,
                newPassword,
                otp: emailOtp
            });
            toast.success("Password updated securey!");
            setIsEmailDialogOpen(false);
            setCurrentPassword("");
            setNewPassword("");
            setEmailOtp("");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Invalid Code");
        } finally {
            setSaving(false);
        }
    };

    // 5. PHONE VERIFICATION (FIREBASE)

    // Initialize Recaptcha


    const handleRequestPhoneOtp = async () => {
        if (!newPhone || newPhone.length < 10) return toast.error("Enter a valid 10-digit number");

        // Format: E.164 (e.g., +919876543210)
        const formattedPhone = newPhone.startsWith("+") ? newPhone : `+91${newPhone}`;

        setOtpLoading(true);
        try {
            await api.post("/auth/request-whatsapp-otp", { phoneNumber: formattedPhone });
            setOtpSent(true);
            toast.success("WhatsApp Code Sent!", { description: `Check WhatsApp on ${formattedPhone}` });
        } catch (error: any) {
            console.error("WhatsApp OTP Error:", error);
            toast.error(error.response?.data?.message || "Failed to send WhatsApp code.");
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyPhoneUpdate = async () => {
        if (!phoneOtp) return toast.error("Please enter the 6-digit code");

        const formattedPhone = newPhone.startsWith("+") ? newPhone : `+91${newPhone}`;

        setOtpLoading(true);
        try {
            const { data } = await api.put("/auth/verify-whatsapp-otp", {
                phoneNumber: formattedPhone,
                otp: phoneOtp
            });

            toast.success("Verified!", { description: "Phone number updated." });

            // Update State
            const updatedUser = { ...user, mobileNumber: data.mobileNumber, isMobileVerified: true };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setUser(updatedUser);

            setIsPhoneDialogOpen(false);
            setOtpSent(false);
            setPhoneOtp("");
            setNewPhone("");
        } catch (error: any) {
            console.error("Verification Error:", error);
            toast.error(error.response?.data?.message || "Invalid Code");
        } finally {
            setOtpLoading(false);
        }
    };
    if (loading) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-teal-600" /></div>;

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex text-sm selection:bg-teal-100 selection:text-teal-900">
            <Sidebar />

            <main className="flex-1 flex flex-col min-w-0">
                <Header
                    doctorName={user?.name || ""}
                    title="Account Settings"
                    subtitle="Manage your profile and preferences"
                    searchQuery=""
                    setSearchQuery={() => { }}
                />

                <div className="flex-1 p-6 lg:p-10 overflow-y-auto">
                    <div className="max-w-4xl mx-auto space-y-8">

                        {/* 1. PROFILE CARD */}
                        <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Stethoscope className="h-4 w-4 text-teal-600" />
                                    Professional Profile
                                </CardTitle>
                                <CardDescription>Visible to patients and administrators.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">

                                {/* Photo Upload */}
                                <div className="flex items-center gap-6">
                                    <div className="relative group">
                                        <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                                            <AvatarImage src={photoPreview || user?.profilePicture} className="object-cover" />
                                            <AvatarFallback className="text-2xl bg-teal-100 text-teal-600">Dr</AvatarFallback>
                                        </Avatar>
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute bottom-0 right-0 bg-teal-600 p-2 rounded-full text-white cursor-pointer shadow-md hover:bg-teal-700 transition-colors"
                                        >
                                            <Camera className="h-4 w-4" />
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handlePhotoSelect}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-medium text-slate-900">Professional Headshot</h3>
                                        <p className="text-xs text-slate-500 max-w-[200px]">
                                            Upload a clear photo for your patient profile card.
                                        </p>
                                    </div>
                                </div>

                                {/* Main Fields */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name (Dr.)</Label>
                                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="specialty">Specialization</Label>
                                        <Input id="specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="e.g. Cardiologist" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="clinic">Clinic / Hospital Name</Label>
                                        <Input id="clinic" value={clinicName} onChange={(e) => setClinicName(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input id="email" value={user?.email} disabled className="bg-slate-50 text-slate-500 cursor-not-allowed" />
                                    </div>
                                </div>

                                {/* Bio */}
                                <div className="space-y-2">
                                    <Label htmlFor="bio">Professional Bio</Label>
                                    <Textarea
                                        id="bio"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Briefly describe your experience..."
                                        className="min-h-[100px]"
                                    />
                                </div>

                                {/* License Verification Logic */}
                                <div className="space-y-2 pt-2">
                                    <Label htmlFor="license" className="flex items-center gap-2">
                                        Medical License ID
                                        {user?.isLicenseVerified ? (
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 gap-1"><ShieldCheck size={10} /> Verified</Badge>
                                        ) : license.length > 0 ? (
                                            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-100 gap-1"><AlertTriangle size={10} /> Pending Verification</Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-100">Unverified</Badge>
                                        )}
                                    </Label>
                                    <Input
                                        id="license"
                                        value={license}
                                        onChange={(e) => setLicense(e.target.value)}
                                        placeholder="Enter License Number"
                                    />
                                </div>

                                <div className="pt-2 flex justify-end">
                                    <Button onClick={handleUpdateProfile} disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white min-w-[120px]">
                                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Save Changes
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. NOTIFICATIONS CARD */}
                        <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Bell className="h-4 w-4 text-teal-600" />
                                    Alert Preferences
                                </CardTitle>
                                <CardDescription>Customize your clinical alerts.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl border border-red-100">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                                            <AlertIcon size={16} />
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

                                <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100">
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
                            </CardContent>
                        </Card>

                        {/* 3. SECURITY & CONTACT */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* 2. CONTACT VERIFICATION (SMS) */}
                            <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Phone className="h-4 w-4 text-teal-600" />
                                        Direct Contact Line
                                    </CardTitle>
                                    <CardDescription>Verified mobile number for urgent alerts.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6">
                                    <div className="grid gap-2">
                                        <Label>Mobile Number</Label>
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1 flex items-center">
                                                {/* Visual Prefix for Main Display */}
                                                <span className="absolute left-0 top-0 bottom-0 bg-slate-100 border-r border-slate-200 text-slate-500 px-3 flex items-center rounded-l-md text-sm pointer-events-none">
                                                    +91
                                                </span>
                                                <Input
                                                    // Strip +91 for display if it exists, otherwise show raw
                                                    value={user?.mobileNumber ? user.mobileNumber.replace(/^\+91/, '') : ""}
                                                    disabled
                                                    className="pl-14 bg-slate-50 text-slate-700 font-mono"
                                                    placeholder="Not Verified"
                                                />
                                                {/* Verification Badge */}
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    {user?.isMobileVerified ? (
                                                        <CheckCircle className="h-5 w-5 text-emerald-500 bg-white rounded-full" />
                                                    ) : (
                                                        <AlertTriangle className="h-5 w-5 text-amber-500 bg-white rounded-full" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Change Button & Dialog */}
                                            <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" className="text-teal-600 border-teal-200 hover:bg-teal-50 min-w-[90px]">
                                                        {user?.mobileNumber ? "Change" : "Add"}
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="bg-white z-50 shadow-xl">
                                                    <DialogHeader>
                                                        <DialogTitle>Verify Mobile Number</DialogTitle>
                                                        <DialogDescription>
                                                            We will send an SMS verification code to your device.
                                                        </DialogDescription>
                                                    </DialogHeader>

                                                    {!otpSent ? (
                                                        <div className="space-y-4 pt-4">
                                                            <div className="space-y-2">
                                                                <Label>Phone Number (10-digit)</Label>
                                                                <div className="flex items-center">
                                                                    <span className="bg-slate-100 border border-r-0 border-slate-200 text-slate-500 px-3 py-2 rounded-l-md text-sm border-y">+91</span>
                                                                    <Input
                                                                        placeholder="9876543210"
                                                                        value={newPhone}
                                                                        onChange={(e) => setNewPhone(e.target.value)}
                                                                        className="rounded-l-none"
                                                                        maxLength={10}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <Button onClick={handleRequestPhoneOtp} disabled={otpLoading} className="w-full bg-slate-900">
                                                                {otpLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                                Send SMS Code
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4 pt-4">
                                                            <div className="bg-emerald-50 text-emerald-700 text-sm p-3 rounded-md text-center border border-emerald-100">
                                                                Code sent to <strong>+91 {newPhone}</strong>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Enter 6-Digit SMS Code</Label>
                                                                <Input
                                                                    placeholder="123456"
                                                                    value={phoneOtp}
                                                                    onChange={(e) => setPhoneOtp(e.target.value)}
                                                                    maxLength={6}
                                                                    className="text-center tracking-[0.5em] text-lg font-bold"
                                                                />
                                                            </div>
                                                            <Button onClick={handleVerifyPhoneUpdate} disabled={otpLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                                                                {otpLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                                Verify & Save
                                                            </Button>
                                                        </div>
                                                    )}
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            {/* Password Update */}
                            <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Lock className="h-4 w-4 text-teal-600" />
                                        Security
                                    </CardTitle>
                                    <CardDescription>Password updates require email code.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6">
                                    <div className="grid gap-3">
                                        <Input type="password" placeholder="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                                        <Input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                                        <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                                            <Button onClick={handleInitiatePasswordChange} disabled={saving} variant="outline" className="w-full">Update Password</Button>
                                            <DialogContent className="bg-white">
                                                <DialogHeader>
                                                    <DialogTitle>Verify Email</DialogTitle>
                                                    <DialogDescription>Code sent to <strong>{user?.email}</strong></DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4 pt-4">
                                                    <Input placeholder="123456" value={emailOtp} onChange={(e) => setEmailOtp(e.target.value)} className="text-center tracking-widest" />
                                                    <Button onClick={handleConfirmPasswordChange} disabled={saving} className="w-full bg-teal-600">Confirm Change</Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </CardContent>
                            </Card>

                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}