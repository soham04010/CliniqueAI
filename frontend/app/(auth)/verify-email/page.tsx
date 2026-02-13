"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");
  
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleVerify = async () => {
    setStatus("loading");
    setMessage("");
    try {
      const { data } = await api.post("/auth/verify-otp", { email: emailParam, otp });
      
      // Auto Login on Success
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("uid", data._id);
      localStorage.setItem("user", JSON.stringify(data));

      setStatus("success");
      setMessage("Verification Successful! Redirecting...");
      
      setTimeout(() => {
         router.push("/patient/dashboard");
      }, 1500);

    } catch (err: any) {
      setMessage(err.response?.data?.message || "Verification failed");
      setStatus("error");
    }
  };

  return (
    <Card className="w-[400px] bg-slate-900 border-slate-800 text-white">
      <CardHeader>
        <CardTitle className="text-center">
          {status === "success" ? "🎉 Verified!" : "Verify Email"}
        </CardTitle>
        <CardDescription className="text-slate-400 text-center">
          {status === "success" 
            ? "Redirecting you to dashboard..." 
            : `Enter the code sent to ${emailParam}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === "success" ? (
           <div className="flex justify-center">
             <Loader2 className="animate-spin h-8 w-8 text-green-500" />
           </div>
        ) : (
          <div className="space-y-4">
            <Input 
              placeholder="6-Digit Code" 
              className="bg-slate-800 border-slate-700 text-white text-center tracking-[0.5em] text-xl h-12"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            
            {status === "error" && (
              <p className="text-red-400 text-sm text-center">{message}</p>
            )}

            <Button 
              onClick={handleVerify} 
              className="w-full bg-green-600 hover:bg-green-700" 
              disabled={status === "loading" || otp.length < 6}
            >
              {status === "loading" ? <Loader2 className="animate-spin" /> : "Verify Code"}
            </Button>
            
            <div className="text-center mt-4">
               <Link href="/register">
                 <Button variant="link" className="text-slate-500 btn-sm h-auto p-0">Wrong email? Register Again</Button>
               </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}