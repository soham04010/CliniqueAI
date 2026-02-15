"use client";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { Send, MessageSquare, Loader2, User as UserIcon, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace('/api', '');
const socket = io(SOCKET_URL);

interface ChatBoxProps {
  senderId?: string;
  senderName?: string;
  receiverId?: string;
  receiverName?: string;
}

export default function ChatBox({ senderId, receiverId, receiverName }: ChatBoxProps) {
  const router = useRouter();
  const [activeChat, setActiveChat] = useState<any>(receiverId ? { _id: receiverId, name: receiverName } : null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      socket.emit("join_room", user.id || user._id);
    }

    const fetchContacts = async () => {
      try {
        const { data } = await api.get("/auth/contacts");
        setContacts(data);
      } catch (e) { console.error("Failed to load contacts"); }
      finally { setLoading(false); }
    };
    fetchContacts();

    socket.on("receive_message", (data) => {
      if (activeChat && data.senderId === activeChat._id) {
        setMessages((prev) => [...prev, data]);
      }
    });
    return () => { socket.off("receive_message"); };
  }, [activeChat]);

  useEffect(() => {
    if (activeChat && currentUser) {
      const fetchHistory = async () => {
        try {
          const cid = currentUser.id || currentUser._id;
          const { data } = await api.get(`/chat/${cid}/${activeChat._id}`);
          setMessages(data.map((m: any) => ({ ...m, isMe: m.senderId === cid })));
        } catch (e) { console.error("History failed"); }
      };
      fetchHistory();
    }
  }, [activeChat, currentUser]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = () => {
    if (!message.trim() || !activeChat || !currentUser) return;
    const cid = currentUser.id || currentUser._id;
    const data = { senderId: cid, receiverId: activeChat._id, message, senderName: currentUser.name };
    socket.emit("send_message", data);
    setMessages((prev) => [...prev, { ...data, isMe: true, timestamp: new Date() }]);
    setMessage("");
  };

  const handleViewPatientInfo = async () => {
    try {
      const { data } = await api.get(`/patients`);
      const patientRecord = data.find((p: any) => p.patient_id === activeChat._id || p.name === activeChat.name);
      if (patientRecord) { router.push(`/doctor/patients/${patientRecord._id}`); }
      else { alert("No clinical records found for this patient."); }
    } catch (err) { console.error("Navigation error"); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[500px] bg-slate-950 border border-slate-800 rounded-2xl">
      <Loader2 className="animate-spin text-teal-500 mb-2" />
      <p className="text-slate-500 text-xs uppercase font-bold">Syncing Secure Inbox...</p>
    </div>
  );

  return (
    <div className="flex h-[650px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      <div className="w-1/3 border-r border-slate-800 bg-slate-900/30 flex flex-col">
        <div className="p-6 border-b border-slate-800"><h2 className="text-lg font-bold text-white flex items-center gap-2"><MessageSquare className="h-5 w-5 text-teal-500" /> Inbox</h2></div>
        <div className="flex-1 overflow-y-auto">
          {contacts.map((contact) => (
            <div key={contact._id} onClick={() => setActiveChat(contact)} className={`p-4 flex items-center gap-3 cursor-pointer transition-all border-b border-slate-800/50 ${activeChat?._id === contact._id ? "bg-teal-500/10 border-l-4 border-l-teal-500" : "hover:bg-slate-800/50"}`}>
              <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700"><UserIcon className="h-5 w-5 text-slate-500" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{contact.name}</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold">{contact.role === 'doctor' ? 'Clinical Doctor' : 'Patient'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-slate-900/10 relative">
        {activeChat ? (
          <>
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-teal-500/20 flex items-center justify-center border border-teal-500/30"><UserIcon className="h-4 w-4 text-teal-400" /></div>
                <span className="font-bold text-sm text-white">{activeChat.name}</span>
              </div>
              {currentUser?.role === 'doctor' && (
                <Button onClick={handleViewPatientInfo} size="sm" className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 border border-blue-600/30 text-[10px] font-black uppercase tracking-tighter">
                  <ExternalLink size={12} className="mr-1" /> View Patient Info
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] p-3 rounded-2xl text-xs shadow-md ${msg.isMe ? "bg-teal-600 text-white rounded-tr-none" : "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700"}`}>
                    {msg.message}
                    <p className={`text-[8px] mt-1 opacity-50 ${msg.isMe ? "text-right" : "text-left"}`}>{new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex gap-3">
              <input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Type inquiry..." className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 text-sm text-white outline-none" />
              <button onClick={sendMessage} className="bg-teal-600 p-3 rounded-xl hover:bg-teal-500 active:scale-95 transition-all shadow-lg shadow-teal-500/20"><Send className="h-4 w-4 text-white" /></button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-700 text-center p-12"><MessageSquare className="h-16 w-16 opacity-10 mb-4" /><h3 className="text-white font-black uppercase tracking-tighter text-xl">Select a Secure Channel</h3></div>
        )}
      </div>
    </div>
  );
}