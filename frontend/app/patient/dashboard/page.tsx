"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Heart, Activity } from "lucide-react";

export default function PatientDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    
    if (!token || !userStr) {
      router.push("/login");
      return;
    }
    setUserName(JSON.parse(userStr).name);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
           <h1 className="text-3xl font-bold text-white">My Health Portal</h1>
           <Button variant="ghost" onClick={handleLogout} className="text-slate-400 hover:text-white">
             <LogOut className="mr-2 h-4 w-4" /> Logout
           </Button>
        </div>

        {/* Welcome Card */}
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Card className="bg-gradient-to-br from-indigo-900 to-slate-900 border-indigo-500/30 mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-2">Hello, {userName} 👋</h2>
              <p className="text-indigo-200">Your latest health analysis is ready. Keep up the good work!</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Vitals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Card className="bg-slate-900 border-slate-800">
             <CardHeader>
               <CardTitle className="flex items-center text-slate-300">
                 <Heart className="mr-2 h-5 w-5 text-red-500" /> Heart Health
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-4xl font-bold text-green-400">Normal</div>
               <p className="text-sm text-slate-500 mt-2">Last check: 2 days ago</p>
             </CardContent>
           </Card>

           <Card className="bg-slate-900 border-slate-800">
             <CardHeader>
               <CardTitle className="flex items-center text-slate-300">
                 <Activity className="mr-2 h-5 w-5 text-blue-500" /> Risk Score
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-4xl font-bold text-blue-400">12%</div>
               <p className="text-sm text-slate-500 mt-2">Low Risk Level</p>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}