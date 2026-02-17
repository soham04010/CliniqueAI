"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/doctor/Sidebar";
import Header from "@/components/doctor/Header";
import ChatBox from "@/components/ChatBox";

export default function DoctorInboxPage() {
  const [doctor, setDoctor] = useState<any>(null); // Changed to full object
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setDoctor(user);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 font-sans flex text-sm selection:bg-teal-100 selection:text-teal-900">

      {/* 1. SIDEBAR */}
      <Sidebar />

      {/* 2. MAIN AREA */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* HEADER */}
        <Header
          doctorName={doctor?.name || ""}
          // You can now add doctorImage={doctor?.profilePicture} here if you update your Header component!
          title="Inbox"
          subtitle="Patient consultations & internal messaging"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* INBOX CONTENT (Real ChatBox) */}
        <div className="flex-1 overflow-hidden p-6">
          <ChatBox searchQuery={searchQuery} />
        </div>
      </main>
    </div>
  );
}