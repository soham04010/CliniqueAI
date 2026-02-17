"use client";

import PatientSidebar from "@/components/PatientSidebar";
import React from "react";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <PatientSidebar />
            <div className="md:ml-64 min-h-screen">
                {children}
            </div>
        </div>
    );
}
