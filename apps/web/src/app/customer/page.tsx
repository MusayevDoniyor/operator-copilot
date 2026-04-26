"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/stores/socket-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageSquare, 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  ShieldCheck, 
  User, 
  Clock, 
  Sparkles,
  Send,
  ChevronLeft,
  Loader2
} from "lucide-react";

export default function CustomerPage() {
  const { socket, joinAsCustomer, sendAnswer, sendIceCandidate, sendTranscript } = useSocket("customer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [step, setStep] = useState<"form" | "waiting" | "chat" | "incall">("form");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // WebRTC & Speech refs
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "uz-UZ";

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript && currentCallId) {
          sendTranscript("customer", finalTranscript, currentCallId);
        }
      };
      recognitionRef.current = recognition;
    }
  }, [currentCallId, sendTranscript]);

  // Start/Stop recognition based on call state
  useEffect(() => {
    if (step === "incall" && recognitionRef.current) {
      try { recognitionRef.current.start(); } catch {}
    } else if (step !== "incall" && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    return () => { try { recognitionRef.current?.stop(); } catch {} };
  }, [step]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory, isAiTyping]);

  // Handle customer join signaling
  useEffect(() => {
    if (socket && customerId) {
      joinAsCustomer(customerId, phone);
    }
  }, [socket, customerId, phone, joinAsCustomer]);

  // Setup WebRTC function
  const setupWebRTC = useCallback(async (callId: string) => {
    console.log("[WebRTC] Setting up for call:", callId);
    if (pcRef.current) pcRef.current.close();
    
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pcRef.current = pc;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    } catch (err) {
      console.error("[WebRTC] Mic access denied:", err);
    }

    pc.onicecandidate = (e) => {
      if (e.candidate && socket) {
        sendIceCandidate(callId, e.candidate.toJSON());
      }
    };

    pc.ontrack = (e) => {
      console.log("[WebRTC] Received remote track");
      if (remoteAudioRef.current && e.streams[0]) {
        remoteAudioRef.current.srcObject = e.streams[0];
      }
    };

    if (callTimerRef.current) clearInterval(callTimerRef.current);
    callTimerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);

    return pc;
  }, [socket, sendIceCandidate]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !customerId) return;

    const handleIncoming = async (data: { callId: string; operatorId: string; customerId: string }) => {
      console.log("[Socket] Incoming call event received:", data);
      if (data.customerId !== customerId) return;
      setCurrentCallId(data.callId);
      setStep("incall");
      await setupWebRTC(data.callId);
    };

    const handleOffer = async (data: { callId: string; sdp: RTCSessionDescriptionInit }) => {
      console.log("[Socket] Offer received:", data.callId);
      if (!pcRef.current) {
        console.warn("[Socket] Received offer but PeerConnection not ready, initializing now...");
        await setupWebRTC(data.callId);
      }
      
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        sendAnswer(data.callId, answer);
      }
    };

    const handleIce = (data: { callId: string; candidate: RTCIceCandidateInit }) => {
      pcRef.current?.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(e => console.error("[WebRTC] ICE error:", e));
    };

    const handleCallEnded = () => {
      console.log("[Socket] Call ended event");
      cleanupWebRTC();
      setStep("waiting");
      setCurrentCallId(null);
    };

    socket.on("call:incoming", handleIncoming);
    socket.on("call:offer", handleOffer);
    socket.on("call:ice-candidate", handleIce);
    socket.on("call:ended", handleCallEnded);

    return () => {
      socket.off("call:incoming", handleIncoming);
      socket.off("call:offer", handleOffer);
      socket.off("call:ice-candidate", handleIce);
      socket.off("call:ended", handleCallEnded);
    };
  }, [socket, customerId, setupWebRTC, sendAnswer]);

  const cleanupWebRTC = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    setCallDuration(0);
  };

  const handleEndCall = () => {
    if (socket && currentCallId) {
      socket.emit("call:end", { callId: currentCallId });
    }
    cleanupWebRTC();
    setStep("waiting");
    setCurrentCallId(null);
  };

  const handleToggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleJoinQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3001/queue/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, reason }),
      });
      if (res.ok) {
        const customer = await res.json();
        setCustomerId(customer.id);
        setStep("waiting");
      }
    } catch (error) {
      console.error("Failed to join queue:", error);
    }
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim() || isAiTyping) return;
    const userMsg = chatMessage;
    const updated = [...chatHistory, { role: "user" as const, content: userMsg }];
    setChatHistory(updated);
    setChatMessage("");
    setIsAiTyping(true);
    try {
      const res = await fetch("http://localhost:3001/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated, customerName: name || "Customer", reason: reason || "General inquiry" }),
      });
      const data = await res.json();
      setChatHistory((h) => [...h, { role: "assistant", content: data.reply }]);
    } catch {
      setChatHistory((h) => [...h, { role: "assistant", content: "An operator will assist you shortly." }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-100 flex flex-col items-center justify-center p-6">
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <Card className="w-full max-w-lg border-none shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-[40px] overflow-hidden bg-white">
        <CardHeader className="p-10 pb-6 text-center">
          <div className="mx-auto mb-6 h-20 w-20 rounded-[28px] bg-blue-600 flex items-center justify-center text-white shadow-2xl shadow-blue-200">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">SADOO <span className="text-blue-600 font-medium tracking-normal">CONNECT</span></CardTitle>
          <p className="text-[11px] font-bold text-slate-600 mt-4 uppercase tracking-[0.2em] leading-relaxed">
            {step === "form" && "Secure Direct Access to Banking Experts"}
            {step === "waiting" && "Secure Queue Active"}
            {step === "chat" && "AI Assistant Connected"}
            {step === "incall" && "End-to-End Encrypted Session"}
          </p>
        </CardHeader>

        <CardContent className="p-10 pt-0">
          {/* ── STEP: form ── */}
          {step === "form" && (
            <form onSubmit={handleJoinQueue} className="space-y-6 animate-slide-up">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest px-2">Full Name</Label>
                  <Input 
                    id="name" 
                    className="h-14 bg-slate-50 border-slate-100 rounded-2xl px-5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 transition-all outline-none" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Enter your name" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest px-2">Phone Number</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    className="h-14 bg-slate-50 border-slate-100 rounded-2xl px-5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 transition-all outline-none" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="+998..." 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason" className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest px-2">Inquiry Topic</Label>
                  <Textarea 
                    id="reason" 
                    className="bg-slate-50 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 transition-all outline-none resize-none min-h-[120px]" 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)} 
                    placeholder="Describe your inquiry briefly..." 
                    required 
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-3xl shadow-2xl shadow-blue-100 transition-all text-sm tracking-widest uppercase">
                JOIN SECURE QUEUE
              </Button>
            </form>
          )}

          {/* ── STEP: waiting ── */}
          {step === "waiting" && (
            <div className="space-y-10 animate-slide-up py-4">
              <div className="text-center relative">
                 <div className="relative h-32 w-32 mx-auto mb-8">
                    <div className="absolute inset-0 border-[6px] border-blue-50 rounded-[40px]" />
                    <div className="absolute inset-0 border-[6px] border-blue-600 border-t-transparent rounded-[40px] animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Clock className="h-10 w-10 text-blue-600 animate-pulse" />
                    </div>
                 </div>
                 <h3 className="text-2xl font-black text-slate-800">Assigning Expert</h3>
                 <p className="text-sm text-slate-700 font-bold mt-3 leading-relaxed max-w-[280px] mx-auto">Please remain on this page. Your priority session is being established.</p>
              </div>
              <div className="p-1 bg-slate-50 rounded-2xl border border-slate-100">
                <Button variant="ghost" className="w-full h-14 rounded-xl text-blue-600 font-black hover:bg-white hover:shadow-sm flex items-center justify-center gap-2 tracking-widest uppercase text-xs" onClick={() => setStep("chat")}>
                  <MessageSquare className="h-4 w-4" />
                  PRE-CALL AI CHAT
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP: AI chat ── */}
          {step === "chat" && (
            <div className="space-y-6 animate-slide-up">
              <div className="flex items-center gap-2 mb-2">
                 <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-slate-100" onClick={() => setStep("waiting")}>
                   <ChevronLeft className="h-6 w-6 text-slate-600" />
                 </Button>
                 <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">SADOO AI ASSISTANT</span>
              </div>
              
              <div ref={chatScrollRef} className="h-96 overflow-y-auto bg-slate-50 rounded-[32px] p-8 space-y-6 scrollbar-hide border border-slate-100 shadow-inner">
                {chatHistory.length === 0 && (
                  <div className="text-center py-16 space-y-4">
                    <div className="h-16 w-16 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                      <Sparkles className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest leading-relaxed">
                      Hello {name.split(' ')[0] || 'Customer'}! <br/> I am your AI concierge. <br/> Ask me anything while you wait.
                    </p>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`rounded-3xl px-5 py-3.5 max-w-[85%] text-sm font-bold leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isAiTyping && (
                  <div className="flex justify-start">
                    <div className="rounded-3xl px-5 py-4 bg-white border border-slate-200 rounded-tl-none flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0ms]" />
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:150ms]" />
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-200 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-4">
                <Input
                  className="h-16 bg-white border-slate-200 rounded-3xl px-6 text-sm font-bold text-slate-800 shadow-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  placeholder="Type your question..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                  disabled={isAiTyping}
                />
                <Button 
                  onClick={sendChatMessage} 
                  disabled={isAiTyping || !chatMessage.trim()}
                  className="h-16 w-16 rounded-3xl bg-blue-600 hover:bg-blue-700 text-white shadow-2xl flex items-center justify-center shrink-0 transition-transform active:scale-95"
                >
                  <Send className="h-6 w-6" />
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP: in-call (WebRTC active) ── */}
          {step === "incall" && (
            <div className="space-y-12 py-10 animate-slide-up">
              <div className="text-center">
                <div className="relative mx-auto w-40 h-40 mb-10">
                  <div className="absolute inset-0 rounded-[50px] bg-blue-100 animate-ping opacity-20" />
                  <div className="absolute inset-0 rounded-[50px] bg-white border-2 border-blue-600 flex items-center justify-center shadow-2xl shadow-blue-100">
                    <Phone className="h-16 w-16 text-blue-600 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Active Session</h3>
                <div className="flex items-center justify-center gap-3 mt-4">
                   <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                   <p className="text-base font-black text-slate-600 tracking-widest">
                     {formatDuration(callDuration)}
                   </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-8">
                <div className="flex gap-8">
                  <Button
                    variant="outline"
                    className={`h-20 w-20 rounded-[32px] transition-all shadow-xl border-2 ${isMuted ? "bg-rose-50 border-rose-200 text-rose-500" : "bg-white border-slate-100 text-slate-600 hover:border-blue-200 hover:text-blue-600"}`}
                    onClick={handleToggleMute}
                  >
                    {isMuted ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                  </Button>
                  <Button
                    variant="destructive"
                    className="h-20 w-20 rounded-[32px] shadow-2xl shadow-rose-200 bg-rose-500 hover:bg-rose-600 transition-all border-none"
                    onClick={handleEndCall}
                  >
                    <PhoneOff className="h-8 w-8 text-white" />
                  </Button>
                </div>
                
                <div className="px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                   <div className="h-2 w-2 rounded-full bg-emerald-500" />
                   <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Officer Online · Secure Link</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-12 text-center opacity-30">
         <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">SADOO DIGITAL BANKING INFRASTRUCTURE</p>
      </div>
    </div>
  );
}
