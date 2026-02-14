"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Activity, ShieldCheck, Brain } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-teal-500/30">
      
      {/* Navbar */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="bg-gradient-to-tr from-teal-500 to-blue-500 p-2 rounded-lg">
            <Activity className="h-5 w-5 text-white" />
          </div>
          CliniqueAI
        </div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-slate-300 hover:text-white">Login</Button>
          </Link>
          <Link href="/register">
            <Button className="bg-white text-slate-950 hover:bg-slate-200">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          
          <div className="lg:w-1/2 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-teal-400 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              Live AI Prediction Engine
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight">
              Predict Disease. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
                Prevent Crisis.
              </span>
            </h1>
            
            <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
              An intelligent clinical decision support system that transforms raw patient data into actionable risk insights, enabling early intervention for chronic diseases.
            </p>
            
            <div className="flex gap-4">
              <Link href="/register">
                <Button className="h-12 px-8 text-lg bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/20">
                  Start Analysis <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="h-12 px-8 text-lg border-slate-700 hover:bg-slate-800 text-white">
                  Doctor Login
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="lg:w-1/2 relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] -z-10" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] -z-10" />
            
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-semibold">Risk Analysis</h3>
                  <p className="text-xs text-slate-500">Real-time inference</p>
                </div>
                <div className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded">98% Accuracy</div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Diabetes Risk Probability</span>
                    <span className="text-red-400 font-bold">87.4%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-[87%] bg-gradient-to-r from-orange-500 to-red-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <Activity className="h-5 w-5 text-blue-500 mb-2" />
                    <p className="text-2xl font-bold">248</p>
                    <p className="text-xs text-slate-500">Avg Glucose</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <Brain className="h-5 w-5 text-purple-500 mb-2" />
                    <p className="text-2xl font-bold">High</p>
                    <p className="text-xs text-slate-500">AI Confidence</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="border-t border-slate-900 bg-slate-950/50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="h-12 w-12 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800">
                <Brain className="h-6 w-6 text-teal-500" />
              </div>
              <h3 className="text-xl font-bold">AI-Powered Prediction</h3>
              <p className="text-slate-400 leading-relaxed">
                Utilizes advanced machine learning algorithms to analyze vitals and historical data to predict disease risk with high precision.
              </p>
            </div>
            <div className="space-y-4">
              <div className="h-12 w-12 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800">
                <Activity className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold">What-If Simulation</h3>
              <p className="text-slate-400 leading-relaxed">
                Empowers doctors to simulate lifestyle changes (e.g., lowering BMI) to visualize potential risk reduction for patients.
              </p>
            </div>
            <div className="space-y-4">
              <div className="h-12 w-12 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800">
                <ShieldCheck className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold">Secure & Private</h3>
              <p className="text-slate-400 leading-relaxed">
                Built with robust role-based authentication and secure data encryption to ensure patient confidentiality.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}