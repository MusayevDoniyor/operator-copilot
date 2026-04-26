"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useQueueStore } from "@/stores/queue-store";
import { useCallStore } from "@/stores/call-store";
import { useSocket } from "@/stores/socket-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  User,
  Clock,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Zap,
  LogOut,
  ChevronRight,
  Target,
  Sparkles,
  Search,
  Activity,
  Award,
  Loader2,
} from "lucide-react";
import { AIAnalysis, CrmClientProfile, PostCallSummary } from "@sadoo/types";

// Helper components
function SegmentBadge({ segment }: { segment: string }) {
  const colors = {
    Mass: "bg-slate-200 text-slate-600",
    Premium: "bg-blue-100 text-blue-700",
    VIP: "bg-amber-100 text-amber-700",
  };
  return (
    <span
      className={`px-3 py-1 rounded-full text-[10px] font-bold ${colors[segment as keyof typeof colors] || "bg-slate-200 text-slate-600"}`}
    >
      {segment.toUpperCase()}
    </span>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const colors = {
    Low: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Medium: "bg-amber-50 text-amber-600 border-amber-100",
    High: "bg-rose-50 text-rose-600 border-rose-100",
  };
  const style = colors[risk as keyof typeof colors] || "bg-slate-50 text-slate-600 border-slate-100";
  return (
    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${style}`}>
      {risk.toUpperCase()} RISK
    </span>
  );
}

function ProductIcon({ type, label }: { type: string; label: string }) {
  const icons: Record<string, { bg: string; icon: React.ReactNode; color: string }> = {
    loan: { bg: "bg-blue-50", icon: "🏦", color: "text-blue-600" },
    deposit: { bg: "bg-emerald-50", icon: "💰", color: "text-emerald-600" },
    card: { bg: "bg-purple-50", icon: "💳", color: "text-purple-600" },
  };
  const style = icons[type] || icons.loan;
  return (
    <div
      className={`${style.bg} px-2 py-1 rounded-lg border border-slate-100 text-[10px] flex items-center gap-1.5 shadow-sm`}
      title={label}
    >
      <span>{style.icon}</span>
      <span className="font-bold text-slate-700">{label}</span>
    </div>
  );
}

export default function OperatorDashboard() {
  const router = useRouter();
  const { user, logout, token, isHydrated } = useAuthStore();
  const queue = useQueueStore((s: any) => s.queue);
  const setQueue = useQueueStore((s: any) => s.setQueue);
  const {
    socket,
    sendTranscript,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    endCall,
    changeStatus,
  } = useSocket("operator");
  
  const currentCall = useCallStore((s: any) => s.currentCall);
  const transcript = useCallStore((s: any) => s.transcript);
  const aiAnalysis = useCallStore((s: any) => s.aiAnalysis);
  const crmProfile = useCallStore((s: any) => s.crmProfile);
  const previousCalls = useCallStore((s: any) => s.previousCalls);
  const setCurrentCall = useCallStore((s: any) => s.setCurrentCall);
  const resetCall = useCallStore((s: any) => s.resetCall);

  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState<"available" | "on_call" | "busy" | "offline">("available");
  const [isTakingNext, setIsTakingNext] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [postCallSummary, setPostCallSummary] = useState<PostCallSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) {
      router.push("/");
      return;
    }

    fetch("http://localhost:3001/queue", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setQueue(data))
      .catch(() => {});
  }, [user, router, isHydrated, token, setQueue]);

  useEffect(() => {
    if (currentCall) {
      setStatus("on_call");
      setCallDuration(0);
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      callTimerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    } else {
      setStatus("available");
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      setCallDuration(0);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [currentCall]);

  // Speech Recognition with auto-restart logic
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
        if (finalTranscript && currentCall) {
          console.log("[Speech] Emitting transcript:", finalTranscript);
          sendTranscript("operator", finalTranscript, currentCall.id);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("[Speech] Error:", event.error);
      };

      recognition.onend = () => {
        console.log("[Speech] Ended");
        // Restart if call is still active
        if (useCallStore.getState().currentCall) {
          console.log("[Speech] Auto-restarting...");
          try { recognition.start(); } catch {}
        }
      };

      recognitionRef.current = recognition;
    }
  }, [currentCall, sendTranscript]);

  useEffect(() => {
    if (currentCall && recognitionRef.current) {
      console.log("[Speech] Starting recognition for call:", currentCall.id);
      try { recognitionRef.current.start(); } catch {}
    } else if (!currentCall && recognitionRef.current) {
      console.log("[Speech] Stopping recognition");
      try { recognitionRef.current.stop(); } catch {}
    }
  }, [currentCall]);

  useEffect(() => {
    if (!socket) return;
    const handleAnswer = (data: { callId: string; sdp: RTCSessionDescriptionInit }) => {
      if (peerConnectionRef.current && data.callId === currentCall?.id) {
        peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
      }
    };
    socket.on("call:answer", handleAnswer);
    return () => { socket.off("call:answer", handleAnswer); };
  }, [socket, currentCall]);

  const handleTakeNext = async () => {
    if (isTakingNext) return;
    setIsTakingNext(true);
    try {
      const res = await fetch("http://localhost:3001/queue/next", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { alert("No customers in queue"); return; }
      const data = await res.json();
      if (data.customer) {
        setCurrentCall({
          id: data.call.id,
          customerId: data.customer.id,
          operatorId: user?.id,
          status: "ringing",
          startTime: new Date(),
          transcript: [],
        } as any, {
          crmProfile: data.customer.crmProfile || null,
          previousCalls: data.customer.previousCalls || [],
        });
        setStatus("on_call");
        changeStatus("on_call");
      }
    } catch (error) {
      console.error("Error taking next call:", error);
    } finally {
      setIsTakingNext(false);
    }
  };

  const handleEndCall = async () => {
    if (!currentCall) return;
    const callId = currentCall.id;
    try {
      await fetch(`http://localhost:3001/calls/${callId}/end`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      endCall(callId);
      resetCall();
      setStatus("available");
      changeStatus("available");
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;
      setIsLoadingSummary(true);
      fetch(`http://localhost:3001/ai/summary/${callId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((s) => setPostCallSummary(s))
        .catch(() => {})
        .finally(() => setIsLoadingSummary(false));
    } catch (error) {
      console.error("Error ending call:", error);
    }
  };

  const startWebRTC = useCallback(async () => {
    if (!currentCall) return;
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    peerConnectionRef.current = pc;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    } catch (err) { console.error("Failed to get user media:", err); return; }
    pc.onicecandidate = (event) => { if (event.candidate) sendIceCandidate(currentCall.id, event.candidate.toJSON()); };
    pc.ontrack = (event) => {
      const remoteAudio = document.getElementById("remote-audio") as HTMLAudioElement;
      if (remoteAudio && event.streams[0]) remoteAudio.srcObject = event.streams[0];
    };
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendOffer(currentCall.id, offer);
  }, [currentCall, sendIceCandidate, sendOffer]);

  useEffect(() => {
    if (currentCall && currentCall.status === "ringing") {
      startWebRTC();
    }
  }, [currentCall, startWebRTC]);

  const handleToggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) { audioTrack.enabled = isMuted; setIsMuted(!isMuted); }
    }
  };

  const handleStatusChange = (newStatus: typeof status) => { setStatus(newStatus); changeStatus(newStatus); };

  if (!user) return null;

  const ai = aiAnalysis as (AIAnalysis & { compliance?: AIAnalysis["compliance"] }) | null;
  const formatDuration = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-100">
      <audio id="remote-audio" autoPlay />

      {/* ── Post-Call Summary Modal ── */}
      {(postCallSummary || isLoadingSummary) && (
        <div className="fixed inset-0 bg-blue-600/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border-none rounded-[32px] shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col scale-in">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h2 className="text-xl font-black flex items-center gap-3 text-slate-800 tracking-tight">
                <Award className="h-6 w-6 text-blue-600" /> SESSION REPORT
              </h2>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100" onClick={() => setPostCallSummary(null)}>✕</Button>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-8 space-y-8">
                {isLoadingSummary ? (
                  <div className="text-center py-16">
                    <Loader2 className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">Generating Intelligence...</p>
                  </div>
                ) : postCallSummary && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: "Quality", value: postCallSummary.qualityScore, color: "text-blue-600", bg: "bg-blue-50" },
                        { label: "Compliance", value: postCallSummary.complianceScore, color: "text-emerald-600", bg: "bg-emerald-50" },
                        { label: "Script", value: postCallSummary.scriptAdherence, color: "text-indigo-600", bg: "bg-indigo-50" },
                      ].map(({ label, value, color, bg }) => (
                        <div key={label} className={`${bg} rounded-2xl p-5 text-center shadow-sm`}>
                          <p className={`text-3xl font-black ${color}`}>{Math.round(value)}%</p>
                          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">{label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Executive Summary</p>
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-sm leading-relaxed text-slate-600 font-medium italic">"{postCallSummary.summary}"</p>
                      </div>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 mb-4">
                        <Activity className="h-4 w-4 text-blue-600" />
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">CRM Entry</p>
                      </div>
                      <p className="text-sm font-bold text-slate-700 leading-relaxed">{postCallSummary.crmNote}</p>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
            
            <div className="p-8 bg-slate-50 border-t border-slate-100">
              <Button className="w-full h-14 rounded-2xl text-sm font-black shadow-xl shadow-blue-100 bg-blue-600 hover:bg-blue-700 uppercase tracking-widest" onClick={() => setPostCallSummary(null)}>
                Save to CRM & Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Left Sidebar: Queue ── */}
      <div className="w-80 border-r border-slate-200 bg-white flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black shadow-xl shadow-blue-100">
                 {user.username[0].toUpperCase()}
               </div>
               <div>
                 <p className="text-sm font-black text-slate-800">{user.username}</p>
                 <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Officer</p>
               </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-slate-600 hover:text-rose-500 hover:bg-rose-50" onClick={logout}><LogOut className="h-5 w-5" /></Button>
          </div>

          <div className="bg-slate-50 p-1.5 rounded-2xl flex gap-1 border border-slate-100">
            {["available", "busy"].map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s as any)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-[11px] font-black transition-all uppercase tracking-widest ${
                  status === s 
                  ? "bg-white text-blue-600 shadow-sm border border-slate-100" 
                  : "text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all transition-duration-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-8 py-4 flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" /> WAITING QUEUE
            </h3>
            <Badge className="bg-slate-100 text-slate-700 font-black px-2 py-0.5 rounded-lg border-none">{queue.totalWaiting}</Badge>
          </div>
          
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-4 pb-8">
              {queue.customers?.map((customer: any) => (
                <div key={customer.id} className="group p-5 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50/50 transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-black text-sm text-slate-800 tracking-tight">{customer.name}</p>
                      <p className="text-[10px] font-bold text-slate-600 uppercase mt-0.5">{customer.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-black">
                    <span className="flex items-center gap-1.5 text-slate-600"><Clock className="h-3 w-3" /> {Math.floor((Date.now() - new Date(customer.joinedAt).getTime())/60000)}M WAIT</span>
                    <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">#{customer.queuePosition}</span>
                  </div>
                </div>
              ))}
              {(!queue.customers || queue.customers.length === 0) && (
                <div className="text-center py-20 px-8">
                  <Search className="h-10 w-10 text-slate-100 mx-auto mb-4" />
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Queue Empty</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="p-8 border-t border-slate-50 bg-slate-50/30">
          <Button
            onClick={handleTakeNext}
            className="w-full h-14 rounded-2xl text-sm font-black shadow-2xl shadow-blue-100 flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 tracking-widest uppercase"
            disabled={status !== "available" || queue.totalWaiting === 0 || isTakingNext}
          >
            {isTakingNext ? <Loader2 className="h-5 w-5 animate-spin" /> : <Phone className="h-5 w-5" />}
            {isTakingNext ? "CONNECTING" : "TAKE NEXT"}
          </Button>
        </div>
      </div>

      {/* ── Center: Transcript ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {currentCall ? (
          <>
            <header className="h-24 bg-white border-b border-slate-50 px-10 flex items-center justify-between z-10">
              <div className="flex items-center gap-5">
                <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shadow-sm">
                  <User className="h-7 w-7" />
                </div>
                <div>
                   <div className="flex items-center gap-3">
                     <h2 className="font-black text-xl text-slate-800 tracking-tight">{crmProfile?.name || "Live Customer"}</h2>
                     <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                   </div>
                   <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                     ACTIVE SESSION <span className="h-1 w-1 bg-slate-200 rounded-full" /> {formatDuration(callDuration)}
                   </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                 <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-12 w-12 rounded-2xl transition-all ${isMuted ? "text-rose-500 bg-rose-50" : "text-slate-600 bg-slate-50 border border-slate-100"}`} 
                  onClick={handleToggleMute}
                 >
                   {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                 </Button>
                <Button 
                  variant="destructive" 
                  className="rounded-2xl h-12 px-6 text-xs font-black tracking-widest shadow-2xl shadow-rose-100 uppercase" 
                  onClick={handleEndCall}
                >
                  <PhoneOff className="h-4 w-4 mr-3" /> END CALL
                </Button>
              </div>
            </header>

            <ScrollArea className="flex-1 bg-slate-50/30" ref={scrollRef}>
              <div className="max-w-4xl mx-auto py-12 px-10 space-y-8">
                {transcript?.map((segment: any, idx: number) => (
                  <div key={idx} className={`flex items-start gap-5 ${segment.speaker === "operator" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`mt-1 h-9 w-9 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm ${
                      segment.speaker === "operator" ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600"
                    }`}>
                      {segment.speaker === "operator" ? "YOU" : "CLI"}
                    </div>
                    <div className={`max-w-[75%] space-y-2 ${segment.speaker === "operator" ? "items-end text-right" : "items-start"}`}>
                      <div className={`rounded-2xl px-6 py-4 text-sm font-bold leading-relaxed shadow-sm ${
                        segment.speaker === "operator"
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-white border border-slate-200 text-slate-700 rounded-tl-none"
                      }`}>
                        {segment.text}
                      </div>
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                        {new Date(segment.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {ai?.suggestedScript && (
              <div className="p-8 bg-white border-t border-slate-50 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                <div className="max-w-4xl mx-auto">
                   <div className="flex items-center gap-2 mb-3">
                     <Sparkles className="h-4 w-4 text-blue-600" />
                     <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Sadoo AI Suggestion</p>
                   </div>
                   <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl text-sm font-bold text-slate-700 leading-relaxed">
                     {ai.suggestedScript}
                   </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center opacity-40 group">
              <div className="h-24 w-24 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Phone className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-600 uppercase tracking-widest">Ready for next</h3>
            </div>
          </div>
        )}
      </div>

      {/* ── Right Panel: CRM ── */}
      <div className="w-[420px] border-l border-slate-200 bg-white overflow-y-auto z-10 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-10 space-y-10">
          <header className="flex items-center justify-between">
            <h2 className="text-[10px] font-black text-slate-600 tracking-[0.3em] uppercase">COPILOT ASSISTANCE</h2>
            {currentCall && (
              <div className={`h-2.5 w-2.5 rounded-full ${ai?.sentiment === "positive" ? "bg-emerald-500" : "bg-amber-500"} shadow-sm`} />
            )}
          </header>

          {currentCall ? (
            <div className="space-y-10 animate-slide-up">
              {crmProfile && (
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Client Insights</p>
                    <SegmentBadge segment={crmProfile.segment} />
                  </div>
                  
                  <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 space-y-8">
                    <div className="flex items-center gap-5">
                       <div className="h-14 w-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-2xl shadow-sm">👤</div>
                       <div>
                         <p className="text-lg font-black text-slate-800 leading-tight">{crmProfile.name}</p>
                         <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-tighter">{crmProfile.monthlyIncome.toLocaleString()} UZS / MO</p>
                       </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <RiskBadge risk={crmProfile.riskLevel} />
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Portfolio</p>
                      <div className="flex flex-wrap gap-2">
                        {crmProfile.hasLoan && <ProductIcon type="loan" label="Loan" />}
                        {crmProfile.hasDeposit && <ProductIcon type="deposit" label="Deposit" />}
                        {crmProfile.hasCard && <ProductIcon type="card" label="Card" />}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {ai && (
                <section className="space-y-6">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">AI Intelligence</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                       <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Sentiment</p>
                       <p className={`text-xs font-black capitalize ${ai.sentiment === "positive" ? "text-emerald-600" : "text-amber-600"}`}>{ai.sentiment}</p>
                     </div>
                     <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                       <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Sales Stage</p>
                       <p className="text-xs font-black text-blue-600 uppercase tracking-tight">{ai.salesStage.replace("_", " ")}</p>
                     </div>
                  </div>

                  <div className="p-8 bg-blue-600 rounded-[32px] text-white shadow-2xl shadow-blue-100 space-y-4 relative overflow-hidden">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-blue-200" />
                      <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Action Required</p>
                    </div>
                    <p className="text-lg font-black leading-tight tracking-tight">{ai.nextAction}</p>
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="text-center py-20 px-10 border-2 border-dashed border-slate-100 rounded-[40px]">
               <Activity className="h-10 w-10 text-slate-100 mx-auto mb-4" />
               <p className="text-[10px] font-black text-slate-200 uppercase tracking-[0.2em]">Assistant Offline</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
