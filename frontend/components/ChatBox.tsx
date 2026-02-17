"use client";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { Send, MessageSquare, Loader2, User as UserIcon, ExternalLink, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import api from "@/lib/api";

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace('/api', '');
const socket = io(SOCKET_URL);

interface ChatBoxProps {
  senderId?: string;
  senderName?: string;
  receiverId?: string;
  receiverName?: string;
  searchQuery?: string; // New Prop
}

export default function ChatBox({ senderId, receiverId, receiverName, searchQuery = "" }: ChatBoxProps) {
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
      } catch (e) { console.error("Failed to load contacts", e); }
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

  // Filter Contacts
  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-50 rounded-2xl">
      <Loader2 className="animate-spin text-teal-600 mb-2" />
      <p className="text-slate-500 text-xs uppercase font-bold">Syncing Secure Inbox...</p>
    </div>
  );

  return (
    <div className="flex h-full bg-white overflow-hidden shadow-none">
      {/* 1. LEFT CONTACT LIST (Light Theme) */}
      <div className="w-80 lg:w-96 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Messages</h2>
          <div className="h-6 w-6 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 text-xs font-bold">
            {filteredContacts.length}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {filteredContacts.map((contact) => (
            <div
              key={contact._id}
              onClick={() => setActiveChat(contact)}
              className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all border border-transparent ${activeChat?._id === contact._id ? "bg-teal-50 border-teal-100" : "hover:bg-slate-50"}`}
            >
              <div className="relative">
                <Avatar className="h-10 w-10 border border-slate-100 shadow-sm">
                  <AvatarFallback className={`font-bold ${activeChat?._id === contact._id ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-500"}`}>
                    {contact.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {/* Mock Online Status for Demo */}
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <p className={`text-sm font-bold truncate ${activeChat?._id === contact._id ? "text-teal-900" : "text-slate-700"}`}>{contact.name}</p>
                  <span className="text-[10px] text-slate-400 font-medium">10:30 AM</span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">{contact.role === 'doctor' ? 'Clinical Colleague' : 'Patient Inquiry'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. RICHT CHAT AREA (Light Theme) */}
      <div className="flex-1 flex flex-col bg-slate-50/50 relative">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur px-6 flex items-center justify-between z-10 sticky top-0">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-slate-100">
                  <AvatarFallback className="bg-teal-100 text-teal-700 font-bold">{activeChat.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{activeChat.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-xs text-slate-500 font-medium">Online now</span>
                  </div>
                </div>
              </div>

              {currentUser?.role === 'doctor' && (
                <Button onClick={handleViewPatientInfo} size="sm" variant="outline" className="h-8 border-slate-200 text-slate-600 hover:text-teal-600 hover:border-teal-200 hover:bg-teal-50 text-[10px] font-bold uppercase tracking-wider rounded-lg gap-1.5">
                  <ExternalLink size={12} /> Patient Chart
                </Button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#F0F2F5] min-h-0">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] sm:max-w-[70%] p-3 px-4 rounded-2xl text-[15px] shadow-sm relative group transition-all duration-200 ${msg.isMe
                    ? "bg-[#005C4B] text-white rounded-tr-none shadow-md"
                    : "bg-white text-slate-800 rounded-tl-none shadow-sm"
                    }`}>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    <p className={`text-[10px] mt-1 font-medium ${msg.isMe ? "text-white/70 text-right" : "text-slate-400 text-left"}`}>
                      {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-[#F0F2F5] border-t border-slate-200">
              <div className="flex gap-2 items-end max-w-4xl mx-auto w-full">
                <div className="flex-1 relative bg-white rounded-2xl shadow-sm border border-slate-200 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition-all duration-200">
                  <textarea
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                      }
                    }}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full bg-transparent border-none focus:outline-none px-4 py-3 text-slate-800 placeholder:text-slate-400 resize-none max-h-[150px] min-h-[44px] block"
                    style={{ height: 'auto', overflowY: message.split('\n').length > 5 ? 'auto' : 'hidden' }}
                  />
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!message.trim()}
                  className="h-11 w-11 p-0 rounded-full bg-[#005C4B] hover:bg-[#004a3c] text-white shadow-lg shadow-teal-900/10 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none flex-none mb-0.5"
                >
                  <Send className="h-5 w-5 ml-0.5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-12">
            <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <MessageSquare className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-slate-800 font-bold text-lg">Your Inbox</h3>
            <p className="text-slate-500 max-w-xs mt-2 text-sm">Select a conversation from the left to view messages or start a new consultation.</p>
          </div>
        )}
      </div>
    </div>
  );
}