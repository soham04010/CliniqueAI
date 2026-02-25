"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { User, Activity, LogOut, ArrowLeft, Loader2, Lock, Phone, Camera, Upload, Mail, Save, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import api from "@/lib/api";
import BrandedLoading from "@/components/shared/BrandedLoading";


export default function PatientSettingsPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Profile States
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

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
                // Try fetching fresh data from API first
                const { data } = await api.get("/auth/me"); // Assuming you have a /me endpoint
                setUser(data);
                setName(data.name);
                setEmail(data.email);
                setPhotoPreview(data.profilePicture); // Ensure backend sends this field
                setLoading(false);
            } catch (e) {
                // Fallback to local storage if API fails (offline mode)
                const userStr = localStorage.getItem("user");
                if (!userStr) {
                    router.push("/login");
                    return;
                }
                const localUser = JSON.parse(userStr);
                setUser(localUser);
                setName(localUser.name);
                setEmail(localUser.email);
                setPhotoPreview(localUser.profilePicture);
                setLoading(false);
            }
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

    // 3. UPDATE PROFILE (MULTIPART FORM DATA)
    const handleUpdateProfile = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append("name", name);
            if (photoFile) {
                formData.append("profilePicture", photoFile);
            }

            // Note: We use 'headers' to let axios know it's multipart, 
            // but modern axios often detects FormData automatically.
            const { data } = await api.put("/auth/profile", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            // Update Local State & Storage
            const updatedUser = { ...user, name: data.name, profilePicture: data.profilePicture };
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

    // 4. PASSWORD UPDATE FLOW (WITH EMAIL OTP)
    const handleInitiatePasswordChange = async () => {
        if (!currentPassword || !newPassword) {
            toast.error("Please fill in both password fields");
            return;
        }
        setSaving(true);
        try {
            // Step 1: Request Email OTP for security
            await api.post("/auth/request-password-otp", { email: user.email });
            setIsEmailDialogOpen(true);
            toast.success("Verification Code Sent", { description: `Check ${user.email} for your code.` });
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to initiate password change");
        } finally {
            setSaving(false);
        }
    };

    const handleConfirmPasswordChange = async () => {
        if (!emailOtp) return toast.error("Please enter the verification code");

        setSaving(true);
        try {
            // Step 2: Verify OTP and Change Password
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
            toast.error(error.response?.data?.message || "Invalid Code or Password");
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
    const handleLogout = () => {
        localStorage.clear();
        router.push("/login");
    };

    if (loading) return <BrandedLoading message="Securing Your Profile..." />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-12">

            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button onClick={() => router.back()} variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="h-8 w-[1px] bg-slate-100 mx-1 hidden sm:block"></div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-lg tracking-tight text-slate-900">Settings</span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">System Protocol & Security</p>
                        </div>
                    </div>


                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">

                <div className="space-y-0.5 mb-2">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Account Protocols</h1>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest border border-slate-200">Production Node</span>
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Administrative Management & Security Access</p>
                </div>

                {/* 1. Profile Information Card */}
                <Card className="border border-slate-200 shadow-none bg-white overflow-hidden rounded-lg">
                    <CardHeader className="bg-slate-50/30 border-b border-slate-100 py-4">
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                                <User className="h-3.5 w-3.5" />
                                Personal Identity
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded text-emerald-600 text-[9px] font-black uppercase tracking-tighter">
                                <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse"></div> Verified Record
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">

                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <Avatar className="h-20 w-20 border border-slate-100 rounded-lg">
                                    <AvatarImage src={photoPreview || user?.profilePicture} className="object-cover" />
                                    <AvatarFallback className="text-xl bg-slate-50 text-slate-400 font-black rounded-lg">{user?.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute -bottom-1 -right-1 bg-slate-900 p-2 rounded-md text-white cursor-pointer shadow-md hover:bg-black transition-colors"
                                >
                                    <Camera className="h-3.5 w-3.5" />
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handlePhotoSelect}
                                />
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-xs font-bold text-slate-900 uppercase">Operational Identity</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[200px]">
                                    Clinical Media Assets • 5MB Limit
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Full Legal Name</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-md border-slate-200 text-sm font-medium" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Primary Endpoint Email</Label>
                                <Input id="email" value={email} disabled className="bg-slate-50 text-slate-400 cursor-not-allowed rounded-md border-slate-200 text-sm font-medium" />
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <Button onClick={handleUpdateProfile} disabled={saving} className="bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-md px-6 shadow-sm">
                                {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5 shadow-none" />}
                                Synchronize Identity
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Security Card (Password) */}
                <Card className="border border-slate-200 shadow-none bg-white rounded-lg">
                    <CardHeader className="bg-slate-50/30 border-b border-slate-100 py-4">
                        <CardTitle className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                            <Lock className="h-3.5 w-3.5" />
                            Access Protocols
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="current" className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Current Password</Label>
                                <Input id="current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="rounded-md border-slate-200" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="new" className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">New Complex Password</Label>
                                <Input id="new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="rounded-md border-slate-200" />
                            </div>
                        </div>
                        <div className="pt-2 flex justify-end">
                            <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                                <Button onClick={handleInitiatePasswordChange} disabled={saving} variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-md px-6 shadow-none">
                                    {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                                    Initiate Secure Update
                                </Button>
                                <DialogContent className="bg-white">
                                    <DialogHeader>
                                        <DialogTitle>Verify Email</DialogTitle>
                                        <DialogDescription>
                                            We sent a verification code to <strong>{user?.email}</strong>. Enter it below to confirm your password change.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Email OTP Code</Label>
                                            <Input placeholder="123456" value={emailOtp} onChange={(e) => setEmailOtp(e.target.value)} className="text-center text-lg tracking-widest" />
                                        </div>
                                        <Button onClick={handleConfirmPasswordChange} disabled={saving} className="w-full bg-indigo-600">
                                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Confirm Change
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Phone Number Card (SMS) */}
                <Card className="border border-slate-200 shadow-none bg-white rounded-lg">
                    <CardHeader className="bg-slate-50/30 border-b border-slate-100 py-4">
                        <CardTitle className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                            <Phone className="h-3.5 w-3.5" />
                            Mobile Authentication
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="grid gap-2">
                            <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Secondary Authentication Link</Label>
                            <div className="flex items-center gap-4">
                                <div className="relative flex-1">
                                    <Input value={user?.mobileNumber || "PROTOCOL_PENDING"} disabled className="bg-slate-50 border-slate-200 pl-10 rounded-md text-xs font-black uppercase tracking-wider" />
                                    {user?.isMobileVerified ? (
                                        <CheckCircle className="absolute left-3 top-2.5 h-4 w-4 text-emerald-500" />
                                    ) : (
                                        <AlertTriangle className="absolute left-3 top-2.5 h-3.5 w-3.5 text-amber-500" />
                                    )}
                                </div>
                                <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-md px-6 shadow-none">
                                            {user?.mobileNumber ? "Update Link" : "Activate SMS"}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-white z-50 shadow-xl">
                                        <DialogHeader>
                                            <DialogTitle>Verify Mobile Number</DialogTitle>
                                            <DialogDescription>
                                                We will send an SMS with a verification code to your mobile device.
                                            </DialogDescription>
                                        </DialogHeader>

                                        {!otpSent ? (
                                            <div className="space-y-2">
                                                <Label>Phone Number (10-digit)</Label>
                                                <div className="flex items-center">
                                                    <span className="bg-slate-100 border border-r-0 border-slate-200 text-slate-500 px-3 py-2 rounded-l-md text-sm">+91</span>
                                                    <Input
                                                        placeholder="9876543210"
                                                        value={newPhone}
                                                        onChange={(e) => setNewPhone(e.target.value)}
                                                        className="rounded-l-none"
                                                        maxLength={10} // Restrict to 10 digits
                                                    />
                                                </div>
                                                <Button onClick={handleRequestPhoneOtp} disabled={otpLoading} className="w-full bg-slate-900">
                                                    {otpLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Send SMS Code
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4 py-4">
                                                <div className="bg-emerald-50 text-emerald-700 text-sm p-3 rounded-md text-center">
                                                    Code sent to {newPhone}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Enter SMS Code</Label>
                                                    <Input placeholder="123456" value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value)} maxLength={6} className="tracking-widest text-center text-lg" />
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

            </main>
        </div>
    );
}