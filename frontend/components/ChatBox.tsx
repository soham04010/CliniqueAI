"use client";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { Send, MessageSquare, Loader2, User as UserIcon, ExternalLink, Trash2, ArrowLeft, MoreVertical, LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import api from "@/lib/api";
import { toast } from "sonner";

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace('/api', '');
const socket = io(SOCKET_URL);

interface ChatBoxProps {
  senderId?: string;
  senderName?: string;
  receiverId?: string;
  receiverName?: string;
  searchQuery?: string;
  initialChatId?: string | null;
}

export default function ChatBox({ senderId, receiverId, receiverName, searchQuery = "", initialChatId }: ChatBoxProps) {
  const router = useRouter();
  const [activeChat, setActiveChat] = useState<any>(receiverId ? { _id: receiverId, name: receiverName } : null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. INIT EFFECT (User & Contacts)
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      socket.emit("join_room", user.id || user._id);
    }

    const fetchContacts = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/contacts");
        setContacts(data);

        // AUTO-SELECT CHAT if initialChatId is present
        if (initialChatId) {
          const targetContact = data.find((c: any) => c._id === initialChatId);
          if (targetContact) {
            setActiveChat(targetContact);
          }
        }
      } catch (e: any) {
        console.error("❌ Failed to load contacts:", e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, [initialChatId]);

  // 2. SOCKET CONNECTION & HANDLERS
  useEffect(() => {
    const handleConnect = () => {
      if (currentUser) {
        const userId = currentUser.id || currentUser._id;
        socket.emit("join_room", userId);
      }
    };

    const handleReceiveMessage = (data: any) => {
      const msgSenderId = String(data.senderId);
      const activeChatId = activeChat ? String(activeChat._id) : null;
      const currentUserId = currentUser ? String(currentUser.id || currentUser._id) : null;

      if (activeChatId && msgSenderId === activeChatId) {
        setMessages((prev) => [...prev, { ...data, isMe: msgSenderId === currentUserId }]);
        api.put(`/chat/mark-read/${msgSenderId}`).catch(() => { });
      }

      setContacts(prev => {
        return prev.map(c => {
          if (c._id === msgSenderId) {
            return {
              ...c,
              lastMessage: { message: data.message, timestamp: data.timestamp },
              unreadCount: activeChatId === msgSenderId ? 0 : (c.unreadCount || 0) + 1
            };
          }
          if (c._id === data.receiverId && msgSenderId === currentUserId) {
            return { ...c, lastMessage: { message: data.message, timestamp: data.timestamp } };
          }
          return c;
        });
      });
    };

    socket.on("connect", handleConnect);
    socket.on("receive_message", handleReceiveMessage);

    if (socket.connected && currentUser) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [activeChat, currentUser]);

  // 3. HISTORY EFFECT
  useEffect(() => {
    if (activeChat && currentUser) {
      const fetchHistory = async () => {
        try {
          const cid = currentUser.id || currentUser._id;
          const { data } = await api.get(`/chat/${cid}/${activeChat._id}`);
          setMessages(data.map((m: any) => ({ ...m, isMe: String(m.senderId) === String(cid) })));

          await api.put(`/chat/mark-read/${activeChat._id}`);
          setContacts(prev => prev.map(c =>
            c._id === activeChat._id ? { ...c, unreadCount: 0 } : c
          ));
        } catch (e) { console.error("History failed"); }
      };
      fetchHistory();
    }
  }, [activeChat, currentUser]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = () => {
    if (!message.trim() || !activeChat || !currentUser) return;
    const cid = currentUser.id || currentUser._id;
    const timestamp = new Date();
    const data = { senderId: cid, receiverId: activeChat._id, message, senderName: currentUser.name, timestamp };

    socket.emit("send_message", data);
    setMessages((prev) => [...prev, { ...data, isMe: true }]);

    setContacts(prev => prev.map(c =>
      c._id === activeChat._id ? { ...c, lastMessage: { message, timestamp } } : c
    ));

    setMessage("");
  };

  const handleViewPatientInfo = async () => {
    try {
      const { data } = await api.get(`/patients`);
      const patientRecord = data.find((p: any) => p.patient_id === activeChat._id || p.name === activeChat.name);
      if (patientRecord) { router.push(`/doctor/patients/${patientRecord._id}`); }
      else { toast.error("Clinical record not found for this patient."); }
    } catch (err) { console.error("Navigation error"); }
  };

  const deleteChat = async () => {
    if (!activeChat || !currentUser) return;
    try {
      const cid = currentUser.id || currentUser._id;
      await api.delete(`/chat/${cid}/${activeChat._id}`);
      setMessages([]);

      // IMMEDIATE UI FIX: Clear lastMessage in contacts list
      setContacts(prev => prev.map(c =>
        c._id === activeChat._id ? { ...c, lastMessage: null } : c
      ));

      toast.success("Conversation cleared.");
    } catch (e) {
      toast.error("Failed to clear chat history.");
    }
  };

  const filteredContacts = contacts
    .filter(c => (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const timeA = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
      const timeB = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
      return timeB - timeA;
    });

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-50/50">
      <Loader2 className="animate-spin text-teal-600 mb-2 h-8 w-8" />
      <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest animate-pulse">Initializing Command Hub...</p>
    </div>
  );

  return (
    <div className="flex h-full bg-white overflow-hidden relative border border-slate-200/60 rounded-xl">
      <TooltipProvider>
        {/* 1. LEFT CONTACT LIST */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-slate-100 bg-white flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-5 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Messaging</h2>
            <div className="h-6 w-6 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 text-[10px] font-black ring-1 ring-teal-100/50">
              {filteredContacts.length}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
            {filteredContacts.map((contact) => (
              <div
                key={contact._id}
                onClick={() => setActiveChat(contact)}
                className={`p-3.5 rounded-2xl flex items-center gap-3.5 cursor-pointer transition-all duration-300 border mb-1 ${activeChat?._id === contact._id
                  ? "bg-teal-50/50 border-teal-100/50 shadow-sm"
                  : "border-transparent hover:bg-slate-50/80 hover:border-slate-100/50"
                  }`}
              >
                <div className="relative">
                  <Avatar className="h-11 w-11 ring-2 ring-white shadow-sm border border-slate-100">
                    <AvatarImage src={contact.profilePicture || contact.avatar} className="object-cover" />
                    <AvatarFallback className={`font-black text-xs ${activeChat?._id === contact._id ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                      {contact.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className={`text-[13px] font-black truncate leading-tight ${activeChat?._id === contact._id ? "text-teal-950" : "text-slate-800"}`}>
                      {contact.name}
                    </p>
                    <span className="text-[10px] text-slate-400 font-bold tabular-nums">
                      {contact.lastMessage?.timestamp ? new Date(contact.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-[11px] truncate flex-1 mr-2 ${contact.unreadCount > 0 ? "text-slate-900 font-bold" : "text-slate-500 font-medium"}`}>
                      {contact.lastMessage?.message || (currentUser?.role === 'patient' && contact.role === 'doctor' ? 'Consulting Physician' :
                        currentUser?.role === 'doctor' && contact.role === 'patient' ? 'Patient' : 'Clinique User')}
                    </p>
                    {contact.unreadCount > 0 && (
                      <span className="h-4.5 min-w-[18px] px-1 bg-[#00A884] text-white text-[9px] font-black rounded-full flex items-center justify-center animate-in zoom-in-50 duration-300 shadow-sm shadow-emerald-200">
                        {contact.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. RIGHT CHAT AREA */}
        <div className={`flex-1 flex flex-col bg-white/50 relative ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
          {activeChat ? (
            <>
              {/* PROFESSIONAL HEADER REDESIGN */}
              <div className="h-18 border-b border-slate-100 bg-white px-4 md:px-6 flex items-center justify-between z-20 shadow-sm shadow-slate-100/20">
                <div className="flex items-center gap-3 md:gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-9 w-9 text-slate-400 hover:bg-slate-50 rounded-2xl"
                    onClick={() => setActiveChat(null)}
                  >
                    <ArrowLeft size={18} />
                  </Button>

                  <div className="relative">
                    <Avatar className="h-10 w-10 ring-1 ring-slate-100">
                      <AvatarImage src={activeChat.profilePicture || activeChat.avatar} className="object-cover" />
                      <AvatarFallback className="bg-teal-50 text-teal-600 font-black text-xs">{activeChat.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                  </div>

                  <div>
                    <h3 className="font-black text-slate-900 text-[14px] leading-tight flex items-center gap-1.5">
                      {activeChat.name}
                    </h3>
                    <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mt-0.5">Active Session</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {currentUser?.role === 'doctor' && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleViewPatientInfo}
                          variant="outline"
                          className="hidden sm:flex h-9 border-slate-300 bg-white text-slate-900 hover:bg-slate-50 text-sm font-bold rounded-xl px-4 gap-2 shadow-none transition-none"
                        >
                          <LayoutDashboard size={14} className="text-teal-600" /> Patient Chart
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Open Patient Chart</TooltipContent>
                    </Tooltip>
                  )}

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={deleteChat}
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-none"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Clear Chat</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* MESSAGING CANVAS */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 bg-slate-50/70 custom-scrollbar-hide">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full opacity-30 select-none">
                    <MessageSquare size={48} className="text-slate-300 mb-2" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">End-to-End Encrypted</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.isMe ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`max-w-[75%] sm:max-w-[65%] p-3.5 px-4.5 rounded-2xl text-[14px] relative ring-1 ${msg.isMe
                      ? "bg-teal-950 text-white rounded-tr-none ring-teal-900/50 shadow-md shadow-teal-950/20"
                      : "bg-white text-slate-800 rounded-tl-none ring-slate-100 shadow-sm"
                      }`}>
                      <p className="leading-relaxed font-medium tracking-tight whitespace-pre-wrap">{msg.message}</p>
                      <div className={`text-[9px] mt-1.5 font-bold tabular-nums opacity-60 flex items-center gap-1 ${msg.isMe ? "justify-end text-white" : "justify-start text-slate-400"}`}>
                        {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>

              {/* INPUT HUB */}
              <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
                <div className="flex gap-3 items-end max-w-5xl mx-auto w-full">
                  <div className="flex-1 relative bg-slate-50/50 rounded-2xl border border-slate-100/80 focus-within:border-teal-500/50 focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-500/5 transition-all duration-300">
                    <textarea
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 180) + 'px';
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                        }
                      }}
                      placeholder="Type a clinical instruction..."
                      rows={1}
                      className="w-full bg-transparent border-none focus:outline-none px-5 py-4 text-[14px] text-slate-800 font-medium placeholder:text-slate-400/80 resize-none max-h-[180px] min-h-[52px] block custom-scrollbar"
                    />
                  </div>
                  <Button
                    onClick={sendMessage}
                    disabled={!message.trim()}
                    className="h-13 w-13 p-0 rounded-2xl bg-teal-950 hover:bg-black text-white shadow-xl shadow-teal-950/20 active:scale-95 transition-all flex-none mb-0.5 group"
                  >
                    <Send className="h-5 w-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 text-center p-12 bg-slate-50/30">
              <div className="h-24 w-24 bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 flex items-center justify-center mb-8 border border-slate-100 animate-in zoom-in-75 duration-500">
                <MessageSquare className="h-10 w-10 text-teal-600/20" />
              </div>
              <h3 className="text-slate-900 font-black text-xl tracking-tight">Clinical Messenger</h3>
              <p className="text-slate-500 max-w-xs mt-3 text-xs font-semibold leading-relaxed tracking-wide uppercase">
                Securely encrypted communication hub for diagnostic excellence.
              </p>
            </div>
          )}
        </div>
      </TooltipProvider>
    </div>
  );
}