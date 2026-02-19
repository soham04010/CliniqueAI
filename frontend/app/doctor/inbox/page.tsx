"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/doctor/Sidebar";
import Header from "@/components/doctor/Header";
import ChatBox from "@/components/ChatBox";
import { MobileNav } from "@/components/shared/MobileNav";
import { Loader2 } from "lucide-react";

// 1. Inner Component: Contains all the original logic that relies on searchParams
function InboxContent() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [doctor, setDoctor] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const searchParams = useSearchParams();
  const chatWithId = searchParams.get('chatWith'); // This caused the error before

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
          // Pass the doctor's image if available, falling back to avatar if needed
          doctorImage={doctor?.profilePicture || doctor?.avatar}
          title="Inbox"
          subtitle="Patient consultations & internal messaging"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* INBOX CONTENT (Real ChatBox) */}
        <div className="flex-1 overflow-hidden p-0 md:p-6">
          <ChatBox searchQuery={searchQuery} initialChatId={chatWithId} />
        </div>
        <MobileNav />
      </main>
    </div>
  );
}

// 2. Default Export: Wraps the logic in Suspense to prevent the Next.js build error
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