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
import { Loader2, Activity, Mail, Lock } from "lucide-react";
import api from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState("patient");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      const { data } = await api.post("/auth/login", formData);
      
      // Strict Role Check
      if (data.role !== role) {
        setError(`Access Denied. This email belongs to a ${data.role} account.`);
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("uid", data._id);
      localStorage.setItem("user", JSON.stringify(data));
      
      router.push(data.role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard");
    } catch (err: any) {
      console.error("Login Error:", err);
      
      if (err.code === "ERR_NETWORK") {
        setError("Cannot connect to server. Is Backend running?");
      } else if (err.response?.status === 404) {
        setError("404 Error: Backend route not found.");
      } else {
        setError(err.response?.data?.message || "Invalid credentials");
      }
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async () => {
    setResetLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: resetData.email });
      setForgotStep(2);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setResetLoading(false);
    }
  };

  const submitReset = async () => {
    if (resetData.newPassword !== resetData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setResetLoading(true);
    try {
      await api.post("/auth/reset-password", { 
        email: resetData.email, 
        otp: resetData.otp, 
        newPassword: resetData.newPassword 
      });
      alert("Success! You can now login.");
      setIsForgotOpen(false);
      setForgotStep(1);
    } catch (err: any) {
      alert(err.response?.data?.message || "Reset failed");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden p-4">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] animate-pulse" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="z-10 w-full max-w-[400px]"
      >
        <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-tr from-teal-500 to-blue-600 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
              <Activity className="text-white h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">CliniqueAI</h1>
            <p className="text-slate-400 text-sm mt-1">Intelligent Healthcare Portal</p>
          </div>

          <Tabs defaultValue="patient" onValueChange={setRole} className="mb-6">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 p-1 rounded-xl">
              <TabsTrigger value="patient" className="rounded-lg data-[state=active]:bg-teal-600 data-[state=active]:text-white text-slate-400">Patient</TabsTrigger>
              <TabsTrigger value="doctor" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400">Doctor</TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300 text-xs uppercase font-bold tracking-wider">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input 
                  name="email" 
                  onChange={handleChange} 
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-teal-500 focus:ring-teal-500/20 transition-all" 
                  placeholder="name@example.com" 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-slate-300 text-xs uppercase font-bold tracking-wider">Password</Label>
                {role === 'patient' && (
                  <button type="button" onClick={() => setIsForgotOpen(true)} className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input 
                  name="password" 
                  type="password" 
                  onChange={handleChange} 
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-teal-500 focus:ring-teal-500/20 transition-all" 
                  placeholder="••••••••" 
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-red-400 text-sm bg-red-900/20 p-2 rounded-lg text-center border border-red-900/50">
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <Button 
              type="submit" 
              className={`w-full h-11 font-medium shadow-lg transition-all active:scale-[0.98] ${
                role === 'doctor' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-teal-600 hover:bg-teal-700'
              }`}
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-500 text-xs">
              New here? <Link href="/register" className="text-white hover:text-teal-400 font-medium transition-colors">Create Account</Link>
            </p>
          </div>
        </div>
      </motion.div>

      <Dialog open={isForgotOpen} onOpenChange={setIsForgotOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription className="text-slate-400">
              {forgotStep === 1 ? "Enter your email to receive a code." : "Enter code & new password."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {forgotStep === 1 ? (
              <Input placeholder="name@example.com" className="bg-slate-800 border-slate-700 text-white" onChange={(e) => setResetData({...resetData, email: e.target.value})} />
            ) : (
              <>
                <Input placeholder="OTP Code" className="bg-slate-800 border-slate-700 text-white text-center tracking-widest" onChange={(e) => setResetData({...resetData, otp: e.target.value})} />
                <Input type="password" placeholder="New Password" className="bg-slate-800 border-slate-700 text-white" onChange={(e) => setResetData({...resetData, newPassword: e.target.value})} />
                <Input type="password" placeholder="Confirm Password" className="bg-slate-800 border-slate-700 text-white" onChange={(e) => setResetData({...resetData, confirmPassword: e.target.value})} />
              </>
            )}
            <Button onClick={forgotStep === 1 ? sendOTP : submitReset} className="w-full bg-teal-600 hover:bg-teal-700" disabled={resetLoading}>
              {resetLoading ? <Loader2 className="animate-spin w-4 h-4" /> : (forgotStep === 1 ? "Send Code" : "Reset Password")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}