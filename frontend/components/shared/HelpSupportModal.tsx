"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion";
import {
    Mail,
    Phone,
    LifeBuoy,
    FileText,
    ShieldCheck,
    Zap,
    HelpCircle,
    ArrowUpRight,
    Search,
    ChevronLeft,
    BookOpen,
    ArrowRight,
    Activity,
    Lock,
    Stethoscope
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface HelpSupportModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

type ModalView = "home" | "docs";

export default function HelpSupportModal({ isOpen, onOpenChange }: HelpSupportModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [view, setView] = useState<ModalView>("home");

    const faqs = [
        {
            icon: Zap,
            question: "How is my patient's risk score calculated?",
            answer: "CliniqueAI uses a proprietary multi-factor risk engine that analyzes real-time vital signs, longitudinal lab trends, and demographic factors. Our methodology is based on clinical guidelines and provides a statistical confidence interval for every assessment."
        },
        {
            icon: ShieldCheck,
            question: "Is clinical data encrypted?",
            answer: "Security is built into our core. All data is protected with AES-256 encryption at rest and TLS 1.3 in transit. We are fully HIPAA-compliant and perform regular third-party security audits."
        },
        {
            icon: FileText,
            question: "How do I generate a clinical report?",
            answer: "From the Patient details view, simply click the 'Report' button in the header. Our system will immediately compile a hospital-grade PDF featuring institution branding, QR verification, and comprehensive clinical findings."
        },
        {
            icon: HelpCircle,
            question: "What should I do if the AI misinterprets data?",
            answer: "Our AI serves as a first-line diagnostic support tool. If you notice discrepancies, you can flag the assessment for review. We recommend always correlating AI insights with raw laboratory findings and patient history."
        }
    ];

    const filteredFaqs = useMemo(() => {
        if (!searchQuery) return faqs;
        return faqs.filter(faq =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    const copyEmail = () => {
        navigator.clipboard.writeText("support@cliniqueai.com");
        toast.success("Support email copied to clipboard!");
    };

    const docs = [
        {
            title: "Clinical Methodology",
            icon: Stethoscope,
            description: "Deep dive into our predictive risk algorithms and datasets.",
            topics: ["Risk Scoring Mechanics", "Data Correlation", "Confidence Intervals"]
        },
        {
            title: "Security & Compliance",
            icon: Lock,
            description: "Technical overview of encryption, HIPAA protocols, and data logs.",
            topics: ["Encryption Standards", "Access Control (RBAC)", "Audit Logs"]
        },
        {
            title: "Workflow Integration",
            icon: Activity,
            description: "How to integrate CliniqueAI into your existing clinical hospital workflow.",
            topics: ["Patient Onboarding", "Report Distribution", "AI Co-pilot Tips"]
        }
    ];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            onOpenChange(open);
            if (!open) setTimeout(() => setView("home"), 300);
        }}>
            <DialogContent className="sm:max-w-[600px] border-none shadow-[0_0_50px_-12px_rgba(0,0,0,0.25)] rounded-[20px] p-0 overflow-hidden bg-white/95 backdrop-blur-xl transition-all duration-300">
                {/* Ultra-Compact Header */}
                <DialogHeader className={cn(
                    "p-6 pb-5 bg-slate-950 relative overflow-hidden transition-all duration-500",
                    view === "docs" ? "bg-teal-950" : "bg-slate-950"
                )}>
                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-[100px] -mr-40 -mt-20 animate-pulse" />

                    <div className="relative z-10">
                        {view === "docs" && (
                            <button
                                onClick={() => setView("home")}
                                className="mb-4 flex items-center gap-1.5 text-teal-400 hover:text-teal-300 transition-colors text-[10px] font-black uppercase tracking-widest"
                            >
                                <ChevronLeft size={14} /> Back to Support
                            </button>
                        )}

                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1.5">
                                <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20">
                                    <span className="h-1 w-1 rounded-full bg-teal-500 animate-pulse" />
                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-teal-400">
                                        {view === "home" ? "System Support Hub" : "Documentation Center"}
                                    </span>
                                </div>
                                <DialogTitle className="text-xl sm:text-2xl font-black text-white tracking-tight leading-[1.2]">
                                    {view === "home" ? (
                                        <>How can we <span className="text-teal-400">help you?</span></>
                                    ) : (
                                        <>Clinical <span className="text-teal-400">Documentation</span></>
                                    )}
                                </DialogTitle>
                                <DialogDescription className="text-slate-400 text-[12px] font-medium max-w-[280px] leading-snug">
                                    {view === "home"
                                        ? "Find answers or contact our specialized support."
                                        : "Deep technical and clinical resources for professionals."
                                    }
                                </DialogDescription>
                            </div>
                            <div className="flex h-12 w-12 bg-white/5 rounded-xl items-center justify-center border border-white/10 backdrop-blur-md">
                                {view === "home" ? <LifeBuoy className="h-6 w-6 text-teal-500" /> : <BookOpen className="h-6 w-6 text-teal-400" />}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 pt-5 space-y-6 max-h-[55vh] overflow-y-auto custom-scrollbar-hide">
                    {view === "home" ? (
                        <>
                            {/* Search & FAQ Section */}
                            <section className="space-y-4">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                                    <Input
                                        placeholder="Search help articles..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 h-10 bg-slate-50 border-slate-100 rounded-xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500/30 transition-all font-medium text-slate-800 placeholder:text-slate-400 text-xs shadow-none"
                                    />
                                </div>

                                <Accordion type="single" collapsible className="space-y-2">
                                    {filteredFaqs.length > 0 ? (
                                        filteredFaqs.map((faq, index) => (
                                            <AccordionItem
                                                key={index}
                                                value={`item-${index}`}
                                                className="border border-slate-100 rounded-xl px-4 bg-white hover:border-slate-200 transition-all"
                                            >
                                                <AccordionTrigger className="text-[13px] font-bold text-slate-800 hover:no-underline py-3.5 group text-left">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-7 w-7 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-teal-50 transition-colors">
                                                            <faq.icon className="h-3.5 w-3.5 text-slate-400 group-hover:text-teal-600 transition-colors" />
                                                        </div>
                                                        {faq.question}
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="text-slate-500 text-[12px] leading-relaxed pb-4 pl-10 font-medium">
                                                    {faq.answer}
                                                    <div
                                                        onClick={() => setView("docs")}
                                                        className="mt-3 flex items-center gap-1.5 text-teal-600 cursor-pointer hover:underline transition-all"
                                                    >
                                                        <span className="text-[10px] font-black uppercase tracking-wider">View Documentation</span>
                                                        <ArrowRight size={10} />
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))
                                    ) : (
                                        <div className="p-6 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                            <p className="text-xs font-bold text-slate-400">No results found for "{searchQuery}"</p>
                                        </div>
                                    )}
                                </Accordion>
                            </section>

                            {/* Human Support Compact Grid */}
                            <section className="space-y-3">
                                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                    <span className="h-px w-5 bg-slate-100" /> Human Support
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => {
                                            window.location.href = "mailto:support@cliniqueai.com";
                                            copyEmail();
                                        }}
                                        className="p-3 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-teal-500/30 hover:shadow-sm transition-all text-left"
                                    >
                                        <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center border border-slate-100 shadow-sm text-slate-600">
                                            <Mail size={16} />
                                        </div>
                                        <div>
                                            <span className="block font-bold text-slate-900 text-xs">Email</span>
                                            <span className="text-[10px] text-teal-600 font-extrabold">Instant Copy</span>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => window.location.href = "tel:+18002546478"}
                                        className="p-3 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-teal-500/30 hover:shadow-sm transition-all text-left"
                                    >
                                        <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center border border-slate-100 shadow-sm text-slate-600">
                                            <Phone size={16} />
                                        </div>
                                        <div>
                                            <span className="block font-bold text-slate-900 text-xs">Call 24/7</span>
                                            <span className="text-[10px] text-teal-600 font-extrabold">+1 (800) CLIN</span>
                                        </div>
                                    </button>
                                </div>
                            </section>
                        </>
                    ) : (
                        /* Documentation View Content */
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {docs.map((doc, idx) => (
                                <div key={idx} className="group p-5 rounded-2xl border border-slate-100 bg-white hover:border-teal-500/20 hover:shadow-[0_8px_30px_-12px_rgba(13,148,136,0.1)] transition-all duration-300">
                                    <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-teal-500 transition-all duration-300">
                                            <doc.icon className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <h4 className="text-[15px] font-black text-slate-900 tracking-tight">{doc.title}</h4>
                                            <p className="text-[12px] text-slate-500 font-medium leading-relaxed">{doc.description}</p>

                                            <div className="pt-3 flex flex-wrap gap-2">
                                                {doc.topics.map((topic, i) => (
                                                    <span key={i} className="px-2 py-0.5 rounded-lg bg-slate-50 text-[10px] font-bold text-slate-600 border border-slate-100">
                                                        {topic}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <ArrowUpRight size={16} className="text-slate-300 group-hover:text-teal-500 transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Glassmorphic Compact Footer */}
                <div className="p-4 px-6 border-t border-slate-100 bg-white/50 flex items-center justify-between">
                    <p className="text-[9px] font-bold text-slate-400 flex items-center gap-1.5">
                        <ShieldCheck size={12} className="text-emerald-500" /> Platform Security Active
                    </p>
                    <Button
                        onClick={() => onOpenChange(false)}
                        className="bg-slate-950 hover:bg-black text-white px-6 h-8 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-950/20 active:scale-95 transition-all"
                    >
                        Dismiss
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
