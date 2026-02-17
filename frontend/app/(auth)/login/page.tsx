"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Activity, Mail, Lock, ArrowRight, CheckCircle2, Star } from "lucide-react";
import api from "@/lib/api";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState("doctor"); // Defaulting to doctor for the demo feel
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      const { data } = await api.post("/auth/google", {
        token: credentialResponse.credential,
      });
      handleAuthSuccess(data);
    } catch (err: any) {
      console.error("Google Login Error:", err);
      setError(err.response?.data?.message || "Google Login failed");
    } finally {
      setLoading(false);
    }
  };

  // 2FA State
  const [show2FA, setShow2FA] = useState(false);
  const [otp, setOtp] = useState("");

  // Forgot Password State
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [resetData, setResetData] = useState({ email: "", otp: "", newPassword: "", confirmPassword: "" });
  const [resetLoading, setResetLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (show2FA) {
        const { data } = await api.post("/auth/login-otp", { email: formData.email, otp });
        handleAuthSuccess(data);
      } else {
        const { data } = await api.post("/auth/login", formData);
        if (data.requires2FA) {
          setShow2FA(true);
          setLoading(false);
          return;
        }
        if (data.role !== role) {
          setError(`Access Denied. This email belongs to a ${data.role} account.`);
          setLoading(false);
          return;
        }
        handleAuthSuccess(data);
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.code === "ERR_NETWORK") {
        setError("Cannot connect to server. Is Backend running?");
      } else {
        setError(err.response?.data?.message || "Invalid credentials");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (data: any) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("uid", data._id);
    localStorage.setItem("user", JSON.stringify(data));
    router.push(data.role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard");
  };

  const sendOTP = async () => {
    setResetLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: resetData.email });
      setForgotStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setResetLoading(false);
    }
  };

  const submitReset = async () => {
    if (resetData.newPassword !== resetData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setResetLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email: resetData.email,
        otp: resetData.otp,
        newPassword: resetData.newPassword
      });
      toast.success("Success! You can now login.");
      setIsForgotOpen(false);
      setForgotStep(1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Reset failed");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white selection:bg-blue-100 selection:text-blue-900">

      {/* LEFT COLUMN: Cinematic Visuals (60%) */}
      <div className="hidden lg:flex lg:w-[60%] relative bg-slate-900 overflow-hidden flex-col justify-end p-16">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop"
            alt="Medical Technology"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-transparent" />
        </div>

        {/* Floating Glass Testimonial */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 max-w-xl"
        >
          <div className="bg-white/10 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-2xl">
            <div className="flex gap-1 mb-4 text-emerald-400">
              {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-5 w-5 fill-current" />)}
            </div>
            <blockquote className="text-2xl font-medium text-white leading-relaxed tracking-tight mb-6">
              "CliniqueAI gives us the predictive clarity we've been missing. It's not just a dashboard; it's a second opinion I trust."
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-emerald-400 p-[2px]">
                <div className="h-full w-full rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-sm">P</div>
              </div>
              <div>
                <div className="text-white font-bold text-lg">Dr. Prince Patel</div>
                <div className="text-slate-400 text-sm">Head of Internal Medicine, Mercy General</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* RIGHT COLUMN: Login Form (40%) */}
      <div className="w-full lg:w-[40%] flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-white relative">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto space-y-8"
        >
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-9 w-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">CliniqueAI</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
            <p className="text-slate-500">Please enter your details to sign in.</p>
          </div>

          {/* Role Selection */}
          <Tabs defaultValue="doctor" onValueChange={setRole} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-50 p-1 h-12 rounded-xl border border-slate-100">
              <TabsTrigger
                value="patient"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-black/5 font-semibold text-slate-500 transition-all h-full"
              >
                Patient
              </TabsTrigger>
              <TabsTrigger
                value="doctor"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-black/5 font-semibold text-slate-500 transition-all h-full"
              >
                Doctor
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {!show2FA ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Email</Label>
                  <Input
                    name="email"
                    type="email"
                    onChange={handleChange}
                    className="h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-lg shadow-sm placeholder:text-slate-400"
                    placeholder="name@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-slate-700 font-semibold text-sm">Password</Label>
                    <button type="button" onClick={() => setIsForgotOpen(true)} className="text-sm font-medium text-blue-600 hover:text-blue-700">Forgot password?</button>
                  </div>
                  <Input
                    name="password"
                    type="password"
                    onChange={handleChange}
                    className="h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-lg shadow-sm placeholder:text-slate-400"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6 py-4 animate-in fade-in slide-in-from-right-8 duration-300">
                <div className="flex items-center justify-center mb-6">
                  <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 ring-8 ring-blue-50/50">
                    <Lock className="h-8 w-8" />
                  </div>
                </div>
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Two-Factor Authentication</h3>
                  <p className="text-sm text-slate-500">We sent a unique code to your email.</p>
                </div>
                <Input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="text-center text-3xl font-mono tracking-[0.5em] h-14 bg-white border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg shadow-sm"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                />
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-red-600" /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              className={`w-full h-11 text-base font-semibold shadow-lg shadow-blue-900/5 hover:translate-y-[-1px] transition-all rounded-lg ${role === 'doctor' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (show2FA ? "Verify Code" : "Sign in")}
            </Button>

            {!show2FA && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">Or continue with</span></div>
              </div>
            )}

            {!show2FA && (
              <div className="grid grid-cols-1 gap-4">
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => console.log('Login Failed')}
                    theme="outline"
                    size="large"
                    width="100%"
                    text="continue_with"
                    shape="circle"
                  />
                </div>
              </div>
            )}
          </form>

          <p className="text-center text-sm text-slate-500">
            Don't have an account? <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">Sign up for free</Link>
          </p>
        </motion.div>
      </div>

      <Dialog open={isForgotOpen} onOpenChange={(open) => {
        setIsForgotOpen(open);
        if (!open) setForgotStep(1); // Reset to Step 1 when closed
      }}>
        <DialogContent className="bg-white border-none shadow-2xl rounded-2xl sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {forgotStep === 1 ? "Reset Password" : "Verify & Set New Password"}
            </DialogTitle>
            <DialogDescription>
              {forgotStep === 1
                ? "Enter your email to receive a recovery code."
                : "Enter the code sent to your email and your new password."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {forgotStep === 1 ? (
              <Input placeholder="name@company.com" onChange={(e) => setResetData({ ...resetData, email: e.target.value })} className="h-11 bg-white border-slate-200" />
            ) : (
              <>
                <Input placeholder="Recovery Code" className="h-11 bg-white border-slate-200 font-mono text-center tracking-widest" onChange={(e) => setResetData({ ...resetData, otp: e.target.value })} />
                <Input type="password" placeholder="New Password" className="h-11 bg-white border-slate-200" onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })} />
                <Input type="password" placeholder="Confirm Password" className="h-11 bg-white border-slate-200" onChange={(e) => setResetData({ ...resetData, confirmPassword: e.target.value })} />
              </>
            )}
            <Button onClick={forgotStep === 1 ? sendOTP : submitReset} className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold">
              {resetLoading ? <Loader2 className="animate-spin" /> : (forgotStep === 1 ? "Send Code" : "Reset Password")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}