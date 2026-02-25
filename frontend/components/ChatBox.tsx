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
    <div className="flex h-full bg-white overflow-hidden relative border border-slate-200/60 rounded-lg">
      <TooltipProvider>
        {/* 1. LEFT CONTACT LIST */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-slate-100 bg-white flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 px-6 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Clinical Archive</h2>
            <div className="px-2 py-0.5 bg-slate-50 rounded text-slate-400 text-[9px] font-black border border-slate-100 uppercase tracking-tighter">
              Synchronized
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-0 space-y-0">
            {filteredContacts.map((contact) => (
              <div
                key={contact._id}
                onClick={() => setActiveChat(contact)}
                className={`w-full relative px-6 py-4 flex items-center gap-3.5 cursor-pointer transition-all duration-200 border-b border-slate-50/50 group ${activeChat?._id === contact._id
                  ? "bg-slate-50/80"
                  : "hover:bg-slate-50/50"
                  }`}
              >
                {activeChat?._id === contact._id && (
                  <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-slate-900 rounded-r-full" />
                )}
                <div className="relative">
                  <Avatar className="h-10 w-10 border border-slate-200 rounded-md">
                    <AvatarImage src={contact.profilePicture || contact.avatar} className="object-cover" />
                    <AvatarFallback className={`font-black text-xs rounded-md ${activeChat?._id === contact._id ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-400"}`}>
                      {contact.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm"></span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className={`text-xs font-bold truncate tracking-tight uppercase ${activeChat?._id === contact._id ? "text-slate-900" : "text-slate-600"}`}>
                      {contact.name}
                    </p>
                    <span className="text-[9px] text-slate-400 font-bold tabular-nums uppercase">
                      {contact.lastMessage?.timestamp ? new Date(contact.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-[10px] truncate flex-1 mr-4 font-bold uppercase tracking-tight ${contact.unreadCount > 0 ? "text-slate-900" : "text-slate-400"}`}>
                      {contact.lastMessage?.message || (currentUser?.role === 'patient' && contact.role === 'doctor' ? 'Clinical Channel' :
                        currentUser?.role === 'doctor' && contact.role === 'patient' ? 'Patient Channel' : 'Clinique Hub')}
                    </p>
                    {contact.unreadCount > 0 && (
                      <div className="flex items-center gap-1 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                        <div className="h-1 w-1 rounded-full bg-rose-500 animate-pulse"></div>
                        <span className="text-rose-600 text-[8px] font-black uppercase">{contact.unreadCount} Unread</span>
                      </div>
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
              <div className="h-20 border-b border-slate-100 bg-white px-4 md:px-8 flex items-center justify-between z-20">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-8 w-8 text-slate-400 hover:bg-slate-50 rounded-md"
                    onClick={() => setActiveChat(null)}
                  >
                    <ArrowLeft size={16} />
                  </Button>

                  <div className="relative">
                    <Avatar className="h-10 w-10 border border-slate-200 rounded-md">
                      <AvatarImage src={activeChat.profilePicture || activeChat.avatar} className="object-cover" />
                      <AvatarFallback className="bg-slate-50 text-slate-400 font-black text-xs rounded-md">{activeChat.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-[13px] uppercase tracking-tight">
                        {activeChat.name}
                      </h3>
                      <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Session</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                      <div className="flex items-center gap-1">
                        <UserIcon size={10} className="text-slate-300" /> {activeChat.role || 'Clinician'}
                      </div>
                      <div className="h-3 w-[1px] bg-slate-100"></div>
                      <div className="flex items-center gap-1 text-emerald-600">
                        <span className="text-[11px]">🔒</span> Secure End-to-End Channel
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {currentUser?.role === 'doctor' && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleViewPatientInfo}
                          variant="outline"
                          className="hidden sm:flex h-8 border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest rounded-md px-4 gap-2 shadow-none transition-none"
                        >
                          <LayoutDashboard size={12} className="text-slate-400" /> Patient Chart
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Open Patient Chart</TooltipContent>
                    </Tooltip>
                  )}

                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={deleteChat}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Purge Clinical History</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {/* MESSAGING CANVAS */}
              <div className="flex-1 overflow-y-auto p-6 space-y-2 bg-[#FBFDFF] custom-scrollbar-hide">
                <div className="flex items-center justify-center py-4 mb-4">
                  <div className="px-4 py-1.5 rounded-full border border-slate-100 bg-white text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 shadow-sm">
                    <span className="text-emerald-500">🔒</span> Secure Channel • Retained in Medical Record
                  </div>
                </div>

                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-[60%] opacity-40 select-none">
                    <div className="h-16 w-16 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center mb-4">
                      <MessageSquare size={32} className="text-slate-200" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Validated Diagnostic Channel</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"} animate-in fade-in duration-300 mb-2`}>
                    <div className={`max-w-[75%] sm:max-w-[60%] p-3.5 px-4 rounded-lg text-sm relative border ${msg.isMe
                      ? "bg-white text-slate-900 border-slate-200 shadow-sm"
                      : "bg-slate-50/50 text-slate-900 border-slate-100 shadow-none"
                      }`}>
                      <p className="leading-snug font-medium tracking-tight whitespace-pre-wrap">{msg.message}</p>
                    </div>
                    <div className={`flex items-center gap-2 mt-1 px-1 text-[9px] font-bold tabular-nums uppercase tracking-tighter text-slate-400 ${msg.isMe ? "flex-row-reverse" : "flex-row"}`}>
                      <span>{new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                      <div className="h-1 w-1 rounded-full bg-slate-200"></div>
                      <span className="opacity-70">{msg.isMe ? "● Seen" : "● Read"}</span>
                    </div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>

              {/* INPUT HUB */}
              <div className="p-4 bg-white border-t border-slate-100">
                <div className="max-w-5xl mx-auto space-y-3">
                  <div className="flex gap-3 items-end w-full">
                    <div className="flex-1 relative bg-white rounded-lg border border-slate-200 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100 transition-all duration-200">
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
                        placeholder="Type secure clinical message..."
                        rows={1}
                        className="w-full bg-transparent border-none focus:outline-none px-4 py-3.5 text-sm text-slate-800 font-medium placeholder:text-slate-400 resize-none max-h-[180px] min-h-[48px] block custom-scrollbar"
                      />
                    </div>
                    <Button
                      onClick={sendMessage}
                      disabled={!message.trim()}
                      className="h-12 w-12 p-0 rounded-lg bg-slate-900 hover:bg-black text-white shadow-sm flex-none mb-0.5 active:scale-95 transition-all"
                    >
                      <Send size={18} />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      <span className="text-emerald-500">🔒</span> Messages are encrypted and stored in medical record.
                    </div>
                    <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                      Audit ID: {activeChat._id?.slice(-8).toUpperCase()}
                    </div>
                  </div>
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