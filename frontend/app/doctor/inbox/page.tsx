"use client";
import ChatBox from "@/components/ChatBox";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DoctorInboxPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/doctor/dashboard')} 
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
          <h1 className="text-xl font-bold text-white">Patient Consultation Inbox</h1>
        </div>
        
        {/* Full-screen Chat Interface */}
        <div className="h-[700px]">
          <ChatBox />
        </div>
      </div>
    </div>
  );
}