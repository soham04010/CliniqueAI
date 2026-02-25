"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface BrandedLoadingProps {
    message?: string;
    fullScreen?: boolean;
}

export default function BrandedLoading({ message = "Clinical insight incoming...", fullScreen = true }: BrandedLoadingProps) {
    return (
        <div className={`
            ${fullScreen ? "fixed inset-0 z-[9999]" : "w-full h-full min-h-[400px]"}
            flex flex-col items-center justify-center bg-white overflow-hidden
        `}>
            {/* Background Mesh Gradient */}
            <div className="absolute inset-0 overflow-hidden opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-300/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-300/20 rounded-full blur-[120px] animate-pulse [animation-delay:1s]" />
            </div>

            <div className="relative z-10 flex flex-col items-center">
                {/* Logo Container with Glow */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative"
                >
                    <div className="absolute inset-0 bg-teal-400/20 rounded-full blur-2xl animate-pulse" />
                    <div className="h-24 w-24 bg-slate-950 rounded-3xl flex items-center justify-center border border-white/10 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.3)] relative z-20">
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                opacity: [0.8, 1, 0.8]
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 2,
                                ease: "easeInOut"
                            }}
                        >
                            <Image
                                src="/logo.svg"
                                alt="CliniqueAI"
                                width={48}
                                height={48}
                                className="brightness-125"
                            />
                        </motion.div>
                    </div>
                </motion.div>

                {/* Text Content */}
                <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="mt-8 text-center space-y-2"
                >
                    <h2 className="text-xl font-black text-slate-950 tracking-tight">
                        Clinique<span className="text-teal-500">AI</span>
                    </h2>
                    <div className="flex items-center justify-center gap-3">
                        <span className="h-1 w-1 rounded-full bg-teal-500 animate-bounce" />
                        <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">{message}</p>
                        <span className="h-1 w-1 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]" />
                    </div>
                </motion.div>

                {/* Progress Bar (Visual Only for feel) */}
                <div className="mt-10 w-48 h-1 bg-slate-100 rounded-full overflow-hidden relative">
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{
                            repeat: Infinity,
                            duration: 1.5,
                            ease: "easeInOut"
                        }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-500 to-transparent"
                    />
                </div>
            </div>
        </div>
    );
}
