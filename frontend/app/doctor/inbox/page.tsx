"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/doctor/Sidebar";
import Header from "@/components/doctor/Header";
import ChatBox from "@/components/ChatBox";
import { Loader2 } from "lucide-react";

// 1. Move all your original logic into this Inner Component
function InboxContent() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [doctor, setDoctor] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const searchParams = useSearchParams();
  const chatWithId = searchParams.get('chatWith');

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setDoctor(user);
      } catch (e) {
        console.error("Error parsing user data", e);
      }
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
          // Pass the doctor's image if available
          doctorImage={doctor?.profilePicture || doctor?.avatar} 
          title="Inbox"
          subtitle="Patient consultations & internal messaging"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* INBOX CONTENT (Real ChatBox) */}
        <div className="flex-1 overflow-hidden p-6">
          <ChatBox searchQuery={searchQuery} initialChatId={chatWithId} />
        </div>
      </main>
    </div>
  );
}

// 2. Export the Main Page wrapped in Suspense to fix the build error
export default function DoctorInboxPage() {
  return (
    <Suspense 
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-slate-50">
          <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
        </div>
      }
    >
      <InboxContent />
    </Suspense>
  );
}