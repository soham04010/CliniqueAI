"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BrainCircuit, X, Send, Sparkles, Loader2, Activity, TrendingUp, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import api from "@/lib/api";

interface CoPilotProps {
    patientContext?: any;
}

export default function ClinicalCoPilot({ patientContext }: CoPilotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<any[]>([
        { role: 'system', content: "Hello. I am your AI Clinical Co-Pilot. I can explain risk factors, summarize trends, or suggest interventions based on the active patient context." }
    ]);
    const [loading, setLoading] = useState(false);
    const [hasMounted, setHasMounted] = useState(false); // Controls visibility (hidden -> flex)
    const [canAnimate, setCanAnimate] = useState(false); // Controls transition (none -> active)
    const pathname = usePathname();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setHasMounted(true);
        // Delay enabling transitions to prevent initial slide-in/out flash
        const timer = setTimeout(() => setCanAnimate(true), 1000);
        return () => clearTimeout(timer);
    }, []);

    if (!pathname.includes("/doctor") && !pathname.includes("/patient")) return null;

    const handleSend = async (text: string = input) => {
        if (!text.trim()) return;
        const userMsg = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const payload = { message: text, context: patientContext || {} };
            const { data } = await api.post('/patients/copilot', payload);
            let replyText = data.reply.replace(/(\d+\.\d{2,})%/g, (_: string, p1: string) => `${parseFloat(p1).toFixed(1)}%`);
            setMessages(prev => [...prev, { role: 'assistant', content: replyText }]);
        } catch (err: any) {
            console.error("Co-Pilot API Error:", err);
            // Check for specific error types if possible (e.g. 404, 500)
            const errorMessage = err.response?.data?.message || err.message || "Connection error";
            setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${errorMessage}. Please check console.` }]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!patientContext || (!patientContext._id && !patientContext.id)) return;
            try {
                const pid = patientContext._id || patientContext.id;
                const { data } = await api.get(`/patients/copilot/history/${pid}`);
                if (data && data.length > 0) setMessages(prev => [prev[0], ...data]);
            } catch (e) {
                console.error("Co-Pilot history error");
            }
        };
        fetchHistory();
    }, [patientContext]);

    const QuickAction = ({ icon: Icon, label, query }: any) => (
        <Button
            variant="ghost"
            className="h-7 px-3 flex items-center gap-1.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-200 rounded-full text-[10px] text-slate-600 hover:text-teal-700 transition-all whitespace-nowrap shadow-sm"
            onClick={() => handleSend(query)}
        >
            <Icon className="h-3 w-3" />
            <span>{label}</span>
        </Button>
    );

    return (
        <>
            {/* FLOATING TRIGGER BUTTON (Bottom Right - Fixed) */}
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-slate-900 hover:bg-slate-800 shadow-2xl shadow-slate-900/40 hover:scale-105 transition-all z-50 flex items-center justify-center border-4 border-white"
                >
                    <BrainCircuit className="h-6 w-6 text-white" />
                </Button>
            )}

            {/* SLIDING PANEL (Light Theme) */}
            {hasMounted && (
                <div
                    className={`fixed top-0 right-0 h-full w-full md:w-[420px] bg-white border-l z-50 border-slate-200 shadow-2xl flex-col ${!isOpen && !canAnimate ? "hidden" : "flex"} ${canAnimate ? "transition-transform duration-300 ease-out" : ""}`}
                    style={{ transform: isOpen ? 'translateX(0%)' : 'translateX(100%)' }}
                >


                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 bg-white/80 flex justify-between items-center backdrop-blur-md sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center">
                                <BrainCircuit className="h-5 w-5 text-slate-900" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">Clinical Co-Pilot</h3>
                                <p className="text-[10px] text-slate-500 font-medium">AI Decision Support</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50/50" ref={scrollRef}>
                        {messages.map((m, i) => (
                            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {m.role === 'assistant' && (
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm mt-1">
                                        <Sparkles className="h-4 w-4 text-teal-500" />
                                    </div>
                                )}
                                <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${m.role === 'user'
                                    ? 'bg-slate-900 text-white rounded-br-none'
                                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
                                    }`}>
                                    {m.role === 'assistant' ? (
                                        <div className="space-y-2">
                                            {m.content.split('\n').map((line: string, idx: number) => {
                                                const trimmed = line.trim();
                                                const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ');
                                                const isNumbered = /^\d+\./.test(trimmed);
                                                let className = "text-slate-700";
                                                if (isBullet || isNumbered) className += " pl-4";
                                                // Bold parsing
                                                const parts = line.split(/(\*\*.*?\*\*)/g);
                                                return (
                                                    <p key={idx} className={className}>
                                                        {parts.map((part, i) => {
                                                            if (part.startsWith('**') && part.endsWith('**')) {
                                                                return <strong key={i} className="text-slate-900 font-bold">{part.slice(2, -2)}</strong>;
                                                            }
                                                            return part;
                                                        })}
                                                    </p>
                                                );
                                            })}
                                        </div>
                                    ) : m.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                    <BrainCircuit className="h-4 w-4 text-teal-500 animate-pulse" />
                                </div>
                                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2 text-slate-500 text-xs shadow-sm">
                                    <Loader2 className="h-3 w-3 animate-spin" /> Analyzing...
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Suggestions */}
                    <div className="px-4 py-3 bg-white border-t border-slate-100">
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            <QuickAction icon={Activity} label="Risk Factors" query="Explain the key risk factors for this patient in detail." />
                            <QuickAction icon={TrendingUp} label="Trends" query="Summarize the patient's risk trend over time." />
                            <QuickAction icon={ShieldCheck} label="Interventions" query="Suggest preventive interventions and next steps." />
                            <QuickAction icon={Sparkles} label="Simulate" query="What happens if we lower BMI to 25?" />
                        </div>
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white border-t border-slate-100">
                        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative">
                            <input
                                className="w-full bg-slate-50 border border-slate-200 rounded-full pl-5 pr-12 py-3 text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-slate-400"
                                placeholder="Ask a clinical question..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={loading}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                className="absolute right-1.5 top-1.5 h-9 w-9 bg-slate-900 hover:bg-slate-800 rounded-full transition-colors shadow-sm"
                                disabled={loading || !input.trim()}
                            >
                                <Send className="h-4 w-4 text-white" />
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
