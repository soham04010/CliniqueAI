"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Activity, ShieldCheck, Brain } from "lucide-react";

export default function LandingPage() {
  return (
<<<<<<< Updated upstream
    <div className="min-h-screen bg-slate-950 text-white selection:bg-teal-500/30">
      
      {/* Navbar */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="bg-gradient-to-tr from-teal-500 to-blue-500 p-2 rounded-lg">
            <Activity className="h-5 w-5 text-white" />
=======
    <div ref={containerRef} className="min-h-screen bg-[#0a0f0e] text-slate-200 selection:bg-teal-500/30 selection:text-teal-200 overflow-x-hidden font-sans">

      {/* --- Mesh Gradients & Particle Noise (Inspiration Merge) --- */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
        <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-br from-teal-500/[0.07] via-transparent to-transparent blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-full h-[800px] bg-gradient-to-tl from-teal-500/[0.05] via-transparent to-transparent blur-[120px]" />
      </div>

      {/* --- Lifeline --- */}
      <div className="fixed left-8 top-0 bottom-0 w-px bg-white/5 z-40 hidden lg:block">
        <motion.div
          style={{ height: useTransform(lifelineHeight, [0, 1], ["0%", "100%"]) }}
          className="w-full bg-gradient-to-b from-teal-400 via-emerald-400 to-transparent shadow-[0_0_15px_rgba(45,212,191,0.4)]"
        />
      </div>


      {/* --- Navigation --- */}
      <nav className="fixed top-8 left-1/2 -translate-x-1/2 w-full max-w-5xl z-50 px-6">
        <div className="h-14 bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-full px-4 md:px-8 flex justify-between items-center shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-12">
            <Link href="/" className="flex items-center gap-2 md:gap-3 font-black text-white group">
              <div className="size-7 md:size-8 bg-teal-500/10 rounded-lg flex items-center justify-center border border-teal-500/20 group-hover:scale-110 group-hover:bg-teal-500/30 transition-all duration-500 shadow-[0_0_15px_rgba(43,212,189,0.1)]">
                <Activity className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#2bd4bd] group-hover:rotate-[360deg] transition-all duration-700" />
              </div>
              <span className="text-lg md:text-xl tracking-tighter group-hover:text-[#2bd4bd] transition-colors">CliniqueAI</span>
            </Link>
            <div className="hidden lg:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-white/50 border-white/5 pl-12">
              <Link href="#product" className="hover:text-white hover:drop-shadow-[0_0_15px_rgba(43,212,189,0.6)] transition-all duration-300">Forecasting</Link>
              <Link href="#showcase" className="hover:text-white hover:drop-shadow-[0_0_15px_rgba(43,212,189,0.6)] transition-all duration-300">Visualizer</Link>
              <Link href="#impact" className="hover:text-white hover:drop-shadow-[0_0_15px_rgba(43,212,189,0.6)] transition-all duration-300">PS-1 Objective</Link>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-6">
            <Magnetic>
              <Link
                href="/login"
                className="hidden md:block text-[10px] font-black uppercase tracking-[0.3em] text-white/40 px-4 hover:text-[#2bd4bd] hover:drop-shadow-[0_0_10px_rgba(43,212,189,0.4)] transition-all"
              >
                Sign In
              </Link>
            </Magnetic>
            <Link href="/register">
              <Button className="shimmer glow-btn bg-[#2bd4bd] hover:bg-[#2bd4bd]/90 text-[#0a0f0e] font-black h-9 px-4 md:px-6 rounded-xl transition-all text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(43,212,189,0.4)] border-none">
                Launch Suite
              </Button>
            </Link>
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
            
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
=======
            <Sparkline color="#10b981" />
          </div>
          <div className="mt-1 text-[9px] text-slate-500 uppercase font-black tracking-[0.2em]">Processing Matrix...</div>
        </motion.div>

        <NeuralMesh />

        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-teal-500/20 bg-teal-500/5 text-[#2bd4bd] text-[10px] font-bold uppercase tracking-[0.3em] mb-6 shadow-[0_0_20px_rgba(43,212,189,0.1)]">
            <div className="size-2 rounded-full bg-teal-500 animate-ping" /> Next-Gen Preventive Clinical AI
          </motion.div>

          <h1 className="text-4xl md:text-7xl lg:text-[76px] font-black tracking-[-0.05em] leading-[1] md:leading-[0.9] mb-6 text-white group">
            Transforming Medicine <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">What happened?</span> <br className="hidden md:block" />
            <span className="relative inline-block mt-2 md:mt-0">
              What&apos;s Next.
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.5, delay: 0.5 }}
                className="absolute -bottom-1 md:-bottom-2 left-0 w-full h-2 md:h-4 bg-[#2bd4bd]/20 origin-left"
              />
              <motion.div
                animate={{ x: ["0%", "100%", "0%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-1 md:-bottom-2 left-0 w-1/4 h-2 md:h-4 bg-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.6)]"
              />
            </span>
          </h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-lg md:text-xl text-slate-400/80 max-w-2xl leading-relaxed mb-8 mx-auto font-medium tracking-tight">
            Identify the silent signals of chronic disease years before symptoms emerge. Designed for PS-1 Clinical Decision Support excellence.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="flex flex-col sm:flex-row gap-6 justify-center">
            <Magnetic><Link href="/register"><Button className="shimmer h-14 px-10 text-sm font-black uppercase tracking-[0.2em] bg-gradient-to-r from-teal-400 to-teal-500 hover:to-teal-600 text-[#0a0f0e] rounded-xl shadow-[0_0_30px_rgba(43,212,189,0.3)] transition-all glow-btn border-none">Launch Clinical Suite</Button></Link></Magnetic>
            <Magnetic><Button variant="ghost" className="h-14 px-10 text-sm font-bold uppercase tracking-widest text-white border border-white/10 bg-white/5 backdrop-blur-md rounded-xl gap-3 transition-all hover:bg-white/10 hover:border-teal-500/30">Watch Outcomes Demo</Button></Magnetic>
          </motion.div>
        </div>
      </section>

      {/* --- Showcase: The Overlapping Dashboards (Inspiration Merge) --- */}
      <section id="showcase" className="py-32 px-6 overflow-hidden bg-white/5 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 md:mb-28">
            <h2 className="text-4xl md:text-7xl font-black text-white tracking-[-0.05em] italic mb-4">The Command Centers.</h2>
            <p className="text-slate-500 font-bold text-sm md:text-lg tracking-tight px-4">Visualizing the intersection of artificial intelligence and human clinical expertise.</p>
          </div>

          <div className="relative h-[600px] flex items-center justify-center">
            {/* Doctor Hub (Background Layer) */}
            <motion.div
              initial={{ x: -100, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ duration: 1 }}
              className="absolute left-0 w-3/5 hidden lg:block"
            >
              <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl skew-y-3">
                <div className="h-8 bg-white/5 border-b border-white/10 flex items-center px-4 gap-1.5 grayscale">
                  <div className="size-2 rounded-full bg-red-400/30" /> <div className="size-2 rounded-full bg-yellow-400/30" /> <div className="size-2 rounded-full bg-green-400/30" />
                  <span className="ml-4 text-[9px] font-mono text-slate-500 uppercase tracking-widest">DR_DASHBOARD: CENTRAL_COMMAND</span>
                </div>
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="h-24 bg-teal-500/10 rounded-xl border border-teal-500/20 p-4 flex flex-col justify-center">
                      <span className="text-[9px] font-bold text-teal-400 uppercase tracking-widest">Patients at Risk</span>
                      <span className="text-4xl font-black text-white italic">14</span>
                    </div>
                    <div className="h-24 bg-white/5 rounded-xl border border-white/10" />
                    <div className="h-24 bg-white/5 rounded-xl border border-white/10" />
                  </div>
                  <div className="h-48 w-full bg-white/5 rounded-2xl border border-white/10 flex items-end p-4 gap-2">
                    {[40, 70, 45, 90, 65, 80, 50, 85, 95].map((h, i) => (
                      <div key={i} className="flex-1 rounded-sm bg-teal-500/20 border border-teal-500/30" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Patient Health Matrix (Foreground Layer) */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }} whileInView={{ scale: 1, opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
              className="relative lg:z-10 w-full lg:w-2/5 lg:translate-x-1/2"
            >
              <div className="bg-[#0a0f0e]/95 backdrop-blur-3xl border border-teal-500/40 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_0_80px_rgba(43,212,189,0.15)] p-6 md:p-10 space-y-8 md:space-y-10 group hover:border-teal-400 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Composite Health Matrix</div>
                    <div className="text-5xl md:text-6xl font-black text-white tracking-tighter">92<span className="text-[#2bd4bd]">.4</span></div>
                  </div>
                  <div className="size-12 md:size-16 rounded-full bg-teal-500/20 flex items-center justify-center text-[#2bd4bd] shadow-inner">
                    <TrendingUp className="h-6 w-6 md:h-8 md:w-8" />
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-bold"><span className="text-slate-400 uppercase">Metabolic Status</span> <span className="text-[#2bd4bd]">OPTIMAL</span></div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} whileInView={{ width: "88%" }} className="h-full bg-[#2bd4bd]" /></div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-bold"><span className="text-slate-400 uppercase">Cardiac Load</span> <span className="text-emerald-400">NORMAL</span></div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} whileInView={{ width: "42%" }} className="h-full bg-emerald-400" /></div>
                  </div>
                </div>
                <div className="pt-8 border-t border-white/10">
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">AI NEXT STEP_INFERENCE</div>
                  <div className="p-5 bg-teal-500/5 rounded-2xl border border-teal-500/20 italic text-sm text-teal-100 font-medium">
                    &quot;Suggesting 12% increase in hydration based on upcoming diabetic metabolic spike...&quot;
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- Product: The Risk Trajectory Core (Bespoke SVG) --- */}
      <section id="product" ref={riskSectionRef} className="py-24 md:py-64 max-w-7xl mx-auto px-6 overflow-hidden">
        <div className="text-center mb-16 md:mb-36">
          <p className="text-[10px] md:text-[11px] font-black text-[#2bd4bd] uppercase tracking-[0.4em] md:tracking-[0.6em] mb-6 md:mb-8">Probability & Uncertainty</p>
          <h2 className="text-3xl sm:text-4xl md:text-[120px] font-black text-white tracking-[-0.06em] leading-none mb-4 lowercase break-words">risk_trajectory.</h2>
        </div>

        <SpotlightCard className="md:col-span-12 min-h-[500px] md:min-h-[600px] flex flex-col justify-between overflow-hidden px-5 py-8 md:px-8 md:py-10">
          <div className="flex flex-col md:flex-row justify-between items-start mb-10 md:mb-12 gap-8 md:gap-0">
            <div className="space-y-3">
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight">The Probabilistic Core.</h3>
              <p className="text-slate-500 font-medium max-w-lg text-sm md:text-base leading-relaxed">Transforming routine structured data into health estimates with explicit ±uncertainty boundaries.</p>
            </div>
            <div className="shrink-0 bg-teal-500/10 px-4 md:px-6 py-2 rounded-full border border-teal-500/20 flex items-center gap-3">
              <div className="size-1.5 md:size-2 rounded-full bg-teal-500 animate-pulse" />
              <span className="text-[9px] md:text-[10px] font-black text-teal-400 uppercase tracking-widest font-mono whitespace-nowrap">Inference_Engine_v4</span>
            </div>
          </div>
          <div className="flex-1 bg-[#0a0f0e]/50 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 shadow-inner p-4 md:p-12 relative min-h-[300px] md:min-h-[400px]">
            <RiskTrajectorySVG pathProgress={pathProgress} />
            <div className="absolute bottom-6 right-6 md:bottom-12 md:right-12 text-right">
              <p className="text-[9px] md:text-[10px] font-bold text-slate-600 uppercase mb-1 md:mb-2">Confidence Level Level</p>
              <p className="text-3xl md:text-4xl font-black text-white">0.96</p>
              <p className="text-[8px] md:text-[9px] font-bold text-teal-500 uppercase">Validated_OPD</p>
            </div>
          </div>
        </SpotlightCard>
      </section>

      {/* --- PS-1: The Challenge Section (Hackathon Focus) --- */}
      <section id="impact" className="py-24 md:py-40 bg-[#0a0f0e]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 md:gap-32">
          <div className="lg:sticky lg:top-64 self-start space-y-8 md:space-y-12">
            <div className="size-14 md:size-16 bg-teal-500 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(43,212,189,0.4)]">
              <ShieldAlert className="h-7 w-7 md:h-8 md:w-8 text-[#0a0f0e]" />
            </div>
            <h2 className="text-5xl md:text-6xl lg:text-[80px] font-black text-white tracking-[-0.05em] leading-[1] md:leading-[0.8] mb-8">PS-1: <br className="hidden md:block" /> Preventive <br className="hidden md:block" /> Decision Core.</h2>
            <p className="text-xl text-slate-500 font-bold leading-relaxed max-w-sm tracking-tight px-1">The Praxis 2.0 Challenge: Transforming noisy routine data into definitive clinical intervention.</p>
          </div>

          <div className="space-y-24 md:space-y-40 pb-20 md:pb-40">
            {[
              { time: "Objective 01", title: "Silent Signal Scoping.", desc: "Surfacing early risk signals from routine patient data months before clinical threshold. Designed for high-sensitivity detection in chronic drift.", icon: Zap, col: "text-teal-400 border-teal-500/20" },
              { time: "Objective 02", title: "Probabilistic Risk Stratification.", desc: "Transforming structured patient data into health estimates with explicit ±uncertainty boundaries. No more guesswork in clinical forecasting.", icon: Brain, col: "text-emerald-400 border-emerald-500/20" },
              { time: "Objective 03", title: "Counterfactual Reasoning.", desc: "Identifying modifiable drivers of risk through 'What-If' clinical simulation. Enabling hyper-personalized lifestyle and pharmacological interventions.", icon: Cpu, col: "text-red-400 border-red-500/20" },
              { time: "Objective 04", title: "Bias & Trust Auditing.", desc: "Rigorous longitudinal tracking and algorithmic bias detection to ensure clinical trust across diverse patient demographics.", icon: Lock, col: "text-slate-400 border-slate-500/20" }
            ].map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 1 }} className="group">
                <span className="text-[10px] font-black text-[#2bd4bd] uppercase tracking-[0.4em] mb-6 md:mb-8 block">{step.time}</span>
                <div className={`border-l-4 ${step.col} pl-8 md:pl-12 space-y-4 md:space-y-6 group-hover:pl-10 md:group-hover:pl-16 transition-all`}>
                  <h3 className="text-3xl md:text-4xl font-black text-white">{step.title}</h3>
                  <p className="text-slate-500 text-base md:text-lg font-medium leading-relaxed">{step.desc}</p>
                  <div className="flex items-center gap-4 py-4"><div className="size-9 md:size-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 grayscale"><step.icon className="h-4 w-4 md:h-5 md:w-5" /></div> <span className="text-[8px] md:text-[9px] font-bold text-slate-600 uppercase">HACKATHON_SPEC_v4.0_PS1</span></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Tech Stack (Bento Style) --- */}
      <section className="py-32 max-w-7xl mx-auto px-6 border-t border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 md:gap-12 mb-20 md:mb-24">
          <div className="max-w-xl space-y-6">
            <h2 className="text-4xl md:text-7xl font-black text-white tracking-[-0.05em] leading-tight">PS-1 Engine.</h2>
            <p className="text-slate-500 font-bold text-base md:text-lg tracking-tight leading-relaxed">Engineered for high-fidelity preventive risk modeling and scalable biomarker ingestion. Built for PS-1 performance benchmarks.</p>
          </div>
          <div className="shrink-0 px-5 py-3 md:px-6 md:py-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/10 flex items-center gap-4 group cursor-pointer hover:border-teal-500/30 transition-colors">
            <ShieldCheck className="h-5 w-5 md:h-6 md:w-6 text-[#2bd4bd] group-hover:scale-110 transition-transform" /> <span className="text-[9px] md:text-xs font-black uppercase tracking-widest text-[#2bd4bd] whitespace-nowrap">PRAXIS 2.0_PS1 READY</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { title: "Next.js 14", sub: "Frontend", desc: "React Server Components for instant clinical visualization and high-stakes SEO security.", icon: Globe },
            { title: "PyTorch/TF", sub: "Intelligence", desc: "Advanced ML models optimized for medical risk stratification and counterfactual reasoning.", icon: Brain },
            { title: "Node.js Core", sub: "Processing", desc: "High-concurrency data streaming for real-time patient biomarker syncing across billions of data points.", icon: Cpu },
            { title: "FHIR/HL7", sub: "Integration", desc: "Standardized clinical data interoperability for seamless EHR and hospital system connects.", icon: Server }
          ].map((tech, i) => (
            <div key={i} className="bg-white/[0.03] p-8 rounded-[2rem] border border-white/5 hover:bg-white/[0.05] transition-all group">
              <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-4 font-mono">{tech.sub}</p>
              <h4 className="text-2xl font-black text-white mb-4 italic tracking-tighter">{tech.title}</h4>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">{tech.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 md:mt-32 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 pt-16 md:pt-24 border-t border-white/5">
          {[
            { val: "1.2y", lbl: "Silent Lead Time" },
            { val: "±2.2%", lbl: "Inference Confidence" },
            { val: "0.98", lbl: "ROC-AUC Precision" },
            { val: "12ms", lbl: "Decision Latency" }
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl md:text-[64px] lg:text-7xl font-black text-white italic mb-2 tracking-[-0.08em]">{stat.val}</div>
              <div className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] md:tracking-[0.3em]">{stat.lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* --- CTA --- */}
      <section className="py-24 md:py-60 px-6 relative flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute w-[800px] h-[800px] bg-teal-500/10 blur-[150px] rounded-full z-0" />
        <div className="relative z-10 p-8 md:p-32 rounded-[2rem] md:rounded-[4rem] bg-white/[0.02] backdrop-blur-3xl border border-teal-500/20 text-center max-w-5xl shadow-2xl hover:border-teal-400 transition-all overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-500 to-transparent shadow-[0_0_20px_rgba(43,212,189,0.5)]" />
          <h2 className="text-3xl sm:text-4xl md:text-[100px] font-black text-white leading-[1.1] md:leading-[0.85] mb-8 md:mb-12 tracking-[-0.06em] italic break-words">Ready for the <br className="hidden md:block" /> <span className="text-[#2bd4bd]">Preventive Era?</span></h2>
          <p className="text-base md:text-2xl text-slate-400/90 font-bold max-w-2xl mx-auto mb-10 md:mb-16 tracking-tight px-4">Join 500+ clinical hubs worldwide redefining medical forecasting with CliniqueAI.</p>
          <div className="flex flex-col sm:flex-row gap-8 md:gap-12 justify-center items-center">
            <Magnetic>
              <Link href="/register" className="w-full sm:w-auto">
                <Button className="shimmer w-full sm:w-auto h-16 md:h-20 px-10 md:px-16 text-xs md:text-sm font-black uppercase tracking-[0.3em] bg-gradient-to-r from-teal-400 to-teal-500 hover:to-teal-600 text-[#0a0f0e] rounded-xl md:rounded-2xl shadow-[0_0_50px_rgba(43,212,189,0.4)] transition-all glow-btn border-none">
                  Execute Onboarding
                </Button>
              </Link>
            </Magnetic>
            <Magnetic>
              <Link href="/specialist" className="flex items-center gap-4 text-[10px] md:text-xs font-bold tracking-[0.3em] md:tracking-[0.4em] text-slate-500 py-4 uppercase hover:text-white hover:drop-shadow-[0_0_10px_rgba(43,212,189,0.5)] transition-all group">
                Talk to a Specialist <ArrowRight className="h-3 w-3 md:h-4 md:w-4 group-hover:translate-x-2 transition-transform" />
>>>>>>> Stashed changes
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