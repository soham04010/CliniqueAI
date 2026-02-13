"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User, Mail, Lock, Check, X } from "lucide-react";
import api from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  const [validations, setValidations] = useState({
    length: false, upper: false, lower: false, number: false, special: false
  });

  const validatePassword = (pass: string) => {
    setValidations({
      length: pass.length >= 8,
      upper: /[A-Z]/.test(pass),
      lower: /[a-z]/.test(pass),
      number: /\d/.test(pass),
      special: /[@$!%*?&]/.test(pass),
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === "password") validatePassword(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setWarning("");

    if (!Object.values(validations).every(Boolean)) {
      setError("Please ensure password meets all requirements.");
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.post("/auth/register", formData);
      
      // If backend says email failed but account created
      if (data.message && data.message.includes("email failed")) {
         setWarning("Account created, but email failed to send. Please contact support.");
      }
      
      setSuccess(true);
      
      // If we have an OTP in the response (Dev Mode) or just normal flow
      if (data.devOtp) {
        console.log("DEV OTP:", data.devOtp);
      }

      // Don't auto-redirect if there is a warning, let user read it
      if (!data.message.includes("email failed")) {
        // Redirect to OTP Verification page with email query param
        setTimeout(() => router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`), 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const Rule = ({ valid, text }: { valid: boolean; text: string }) => (
    <div className={`flex items-center text-xs ${valid ? "text-green-400" : "text-slate-500"} transition-colors duration-300`}>
      {valid ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
      {text}
    </div>
  );

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center p-8 bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full">
           <h2 className="text-xl font-bold text-white mb-2">Account Created!</h2>
           {warning ? (
             <p className="text-yellow-400 text-sm mb-6">{warning}</p>
           ) : (
             <p className="text-slate-400 text-sm mb-6">Redirecting to verification...</p>
           )}
           <Button onClick={() => router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)} className="w-full bg-indigo-600 hover:bg-indigo-700">Enter Code</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-4">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]" />
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="z-10 w-full max-w-[400px]">
        <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Join CliniqueAI</h1>
            <p className="text-slate-400 text-sm">Create your secure account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300 text-xs uppercase font-bold tracking-wider">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input name="name" onChange={handleChange} className="pl-10 bg-slate-800/50 border-slate-700 text-white" placeholder="John Doe" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300 text-xs uppercase font-bold tracking-wider">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input name="email" type="email" onChange={handleChange} className="pl-10 bg-slate-800/50 border-slate-700 text-white" placeholder="name@example.com" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300 text-xs uppercase font-bold tracking-wider">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input name="password" type="password" onChange={handleChange} className="pl-10 bg-slate-800/50 border-slate-700 text-white" placeholder="••••••••" />
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-2 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                <Rule valid={validations.length} text="8+ Characters" />
                <Rule valid={validations.upper} text="Uppercase (A-Z)" />
                <Rule valid={validations.lower} text="Lowercase (a-z)" />
                <Rule valid={validations.number} text="Number (0-9)" />
                <Rule valid={validations.special} text="Special (@$!%*?&)" />
              </div>
            </div>

            <AnimatePresence>
              {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm bg-red-900/20 p-2 rounded text-center border border-red-900/50">{error}</motion.p>}
            </AnimatePresence>

            <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 font-medium transition-all" disabled={loading}>
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Create Account"}
            </Button>
          </form>
          
           <p className="mt-6 text-center text-slate-500 text-xs">
            Already a member? <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Log in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}