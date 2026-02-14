"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrainCircuit, X, Send, Sparkles, Loader2, ChevronRight, Activity, TrendingUp, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import api from "@/lib/api";

interface CoPilotProps {
    patientContext?: any; // Pass current patient data if available
}

export default function ClinicalCoPilot({ patientContext }: CoPilotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<any[]>([
        { role: 'system', content: "Hello Dr. I am your AI Clinical Co-Pilot. I can explain risk factors, summarize trends, or suggest interventions based on the active patient context." }
    ]);
    const [loading, setLoading] = useState(false);
    const pathname = usePathname();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Only show on Doctor pages
    if (!pathname.includes("/doctor")) return null;

    const handleSend = async (text: string = input) => {
        if (!text.trim()) return;

        const userMsg = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            // Construct Context from Props or LocalStorage if active patient
            // For now, we rely on patientContext passed from parent or try to grab from URL/Storage if needed
            // Simpler: Just send what we have.

            const payload = {
                message: text,
                context: patientContext || {} // Send current patient data
            };

            const { data } = await api.post('/patients/copilot', payload);

            let replyText = data.reply;
            // distinct percentage formatting
            replyText = replyText.replace(/(\d+\.\d{2,})%/g, (match: string, p1: string) => `${parseFloat(p1).toFixed(1)}%`);

            const aiMsg = { role: 'assistant', content: replyText };
            setMessages(prev => [...prev, aiMsg]);

        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "⚠️ I encountered an error connecting to the clinical knowledge base. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // FETCH HISTORY ON MOUNT
    useEffect(() => {
        const fetchHistory = async () => {
            if (!patientContext || (!patientContext._id && !patientContext.id)) return;
            try {
                const pid = patientContext._id || patientContext.id;
                const { data } = await api.get(`/patients/copilot/history/${pid}`);
                if (data && data.length > 0) {
                    // Prepend history to current messages (keeping system msg)
                    setMessages(prev => [prev[0], ...data]);
                }
            } catch (e) {
                console.error("Failed to load Co-Pilot history");
            }
        };
        fetchHistory();
    }, [patientContext]);

    const QuickAction = ({ icon: Icon, label, query }: any) => (
        <Button
            variant="ghost"
            className="h-8 px-3 flex items-center gap-2 bg-slate-800/80 hover:bg-blue-600 border border-slate-700 hover:border-blue-500 rounded-full text-[10px] text-slate-300 hover:text-white transition-all whitespace-nowrap"
            onClick={() => handleSend(query)}
        >
            <Icon className="h-3 w-3" />
            <span>{label}</span>
        </Button>
    );

    return (
        <>
            {/* Floating Toggle Button */}
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 left-6 h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-teal-500 shadow-2xl shadow-blue-500/40 hover:scale-110 transition-transform z-50 flex items-center justify-center border-2 border-white/20"
                >
                    <BrainCircuit className="h-7 w-7 text-white" />
                </Button>
            )}

            {/* Sliding Panel */}
            <div className={`fixed top-0 left-0 h-full w-[400px] bg-slate-950 border-r border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>

                {/* Header */}
                <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-500/10 p-2 rounded-lg"><BrainCircuit className="h-5 w-5 text-blue-400" /></div>
                        <div>
                            <h3 className="font-bold text-white text-sm">Clinical Co-Pilot</h3>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Decision Support</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden relative flex flex-col">

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                        {messages.map((m, i) => (
                            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {m.role === 'assistant' && (
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center border border-teal-500/20 mt-1">
                                        <Sparkles className="h-4 w-4 text-teal-400" />
                                    </div>
                                )}
                                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${m.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-bl-none'
                                    }`}>
                                    {/* Markdown-ish formatting for AI */}
                                    {m.role === 'assistant' ? (
                                        <div className="space-y-2">
                                            {m.content.split('\n').map((line: string, idx: number) => {
                                                // Check for list items
                                                const trimmed = line.trim();
                                                const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ');
                                                const isNumbered = /^\d+\./.test(trimmed);

                                                let className = "text-slate-200";
                                                if (isBullet || isNumbered) className += " pl-4";

                                                // Parse bold text
                                                const parts = line.split(/(\*\*.*?\*\*)/g);
                                                return (
                                                    <p key={idx} className={className}>
                                                        {parts.map((part, i) => {
                                                            if (part.startsWith('**') && part.endsWith('**')) {
                                                                return <strong key={i} className="text-teal-400 font-bold">{part.slice(2, -2)}</strong>;
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
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center border border-teal-500/20 animate-pulse mt-1">
                                    <BrainCircuit className="h-4 w-4 text-teal-400" />
                                </div>
                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2 text-slate-400 text-xs shadow-sm">
                                    <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
                                </div>
                            </div>
                        )}

                        {/* Disclaimer for first message */}
                        {messages.length === 1 && (
                            <div className="mt-8 px-4 text-center">
                                <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-full mb-4">
                                    <Sparkles className="h-6 w-6 text-blue-400" />
                                </div>
                                <h3 className="text-white font-medium mb-2">How can I help you?</h3>
                                <p className="text-xs text-slate-400 max-w-[250px] mx-auto">
                                    I analyze patient data to identify risks, trends, and personalized interventions.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Persistent Suggestions (Horizontal Scroll) */}
                    <div className="px-4 py-2 bg-slate-900/50 border-t border-slate-800/50">
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            <QuickAction icon={Activity} label="Risk Factors" query="Explain the key risk factors for this patient in detail." />
                            <QuickAction icon={TrendingUp} label="Trends" query="Summarize the patient's risk trend over time." />
                            <QuickAction icon={ShieldCheck} label="Interventions" query="Suggest preventive interventions and next steps." />
                            <QuickAction icon={Sparkles} label="Simulate" query="What happens if we lower BMI to 25?" />
                        </div>
                    </div>

                    {/* Footer Input */}
                    <div className="p-4 bg-slate-950 border-t border-slate-800">
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="relative"
                        >
                            <input
                                className="w-full bg-slate-900 border border-slate-700 rounded-full pl-5 pr-12 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-500 shadow-inner"
                                placeholder="Ask a clinical question..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={loading}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                className="absolute right-1.5 top-1.5 h-9 w-9 bg-blue-600 hover:bg-blue-500 rounded-full transition-colors shadow-lg shadow-blue-500/20"
                                disabled={loading || !input.trim()}
                            >
                                <Send className="h-4 w-4 text-white" />
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
