"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Activity, Mail, Lock, User, Check, X, ShieldCheck } from "lucide-react";
import api from "@/lib/api";
import { GoogleLogin } from "@react-oauth/google";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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

  const handleAuthSuccess = (data: any) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("uid", data._id);
    localStorage.setItem("user", JSON.stringify(data));
    router.push("/patient/dashboard"); // New users default to Patient
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      const { data } = await api.post("/auth/google", {
        token: credentialResponse.credential,
      });
      handleAuthSuccess(data);
    } catch (err: any) {
      console.error("Google Signup Error:", err);
      setError(err.response?.data?.message || "Google Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!Object.values(validations).every(Boolean)) {
      setError("Please satisfy all password requirements");
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.post("/auth/register", formData);
      setSuccess(true);
      setTimeout(() => router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const Rule = ({ valid, text }: { valid: boolean; text: string }) => (
    <div className={`flex items-center text-xs font-medium ${valid ? "text-emerald-600" : "text-slate-400"} transition-colors duration-300`}>
      {valid ? <Check className="w-3 h-3 mr-1.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-200 mr-2" />}
      {text}
    </div>
  );

  return (
    <div className="min-h-screen w-full flex bg-white selection:bg-indigo-100 selection:text-indigo-900">

      {/* LEFT COLUMN: Cinematic Visuals (60%) */}
      <div className="hidden lg:flex lg:w-[60%] relative bg-slate-900 overflow-hidden flex-col justify-end p-16">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=2080&auto=format&fit=crop"
            alt="Futuristic DNA Lab"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-transparent" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 max-w-xl"
        >
          <div className="bg-white/10 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-2xl">
            <div className="flex gap-2 mb-4 text-indigo-400">
              <ShieldCheck className="h-6 w-6" />
              <span className="text-white font-bold tracking-wide text-sm uppercase">Secure & Private</span>
            </div>
            <blockquote className="text-2xl font-medium text-white leading-relaxed tracking-tight mb-6">
              "Joining CliniqueAI was the best decision for my family's health. The predictive insights gave us peace of mind we couldn't find anywhere else."
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                <span className="text-indigo-300 font-bold text-xs">MK</span>
              </div>
              <div>
                <div className="text-white font-bold">Michael Klein</div>
                <div className="text-slate-400 text-sm">Patient since 2024</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* RIGHT COLUMN: Register Form (40%) */}
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
              <div className="h-9 w-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">CliniqueAI</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Create account</h1>
            <p className="text-slate-500">Start your journey to predictive health.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">

              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold text-sm">Full Name</Label>
                <Input
                  name="name"
                  onChange={handleChange}
                  className="h-11 bg-white border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all rounded-lg shadow-sm placeholder:text-slate-400"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold text-sm">Email Address</Label>
                <Input
                  name="email"
                  type="email"
                  onChange={handleChange}
                  className="h-11 bg-white border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all rounded-lg shadow-sm placeholder:text-slate-400"
                  placeholder="name@company.com"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-slate-700 font-semibold text-sm">Password</Label>
                <Input
                  name="password"
                  type="password"
                  onChange={handleChange}
                  className="h-11 bg-white border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all rounded-lg shadow-sm placeholder:text-slate-400"
                  placeholder="Create a strong password"
                />
                {/* Password Strength Grid */}
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <Rule valid={validations.length} text="8+ Characters" />
                  <Rule valid={validations.upper} text="Uppercase (A-Z)" />
                  <Rule valid={validations.lower} text="Lowercase (a-z)" />
                  <Rule valid={validations.number} text="Number (0-9)" />
                  <Rule valid={validations.special} text="Special (@#$%)" />
                </div>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2">
                  <X className="h-4 w-4 text-red-600" /> {error}
                </motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="text-emerald-600 text-sm bg-emerald-50 p-3 rounded-lg border border-emerald-100 flex items-center gap-2">
                  <Check className="h-4 w-4" /> Account created! Redirecting...
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold shadow-lg shadow-indigo-900/5 hover:translate-y-[-1px] transition-all rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={loading || success}
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Create Account"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">Or join with</span></div>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => console.log('Signup Failed')}
                theme="outline"
                size="large"
                width="100%"
                text="signup_with"
                shape="circle"
              />
            </div>
          </form>

          <p className="text-center text-sm text-slate-500">
            Already have an account? <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}