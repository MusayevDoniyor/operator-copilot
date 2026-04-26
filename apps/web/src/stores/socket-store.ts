"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "./auth-store";
import { useQueueStore } from "./queue-store";
import { useCallStore } from "./call-store";
import {
  SocketEvents,
  TranscriptSegment,
  AIAnalysis,
  QueueState,
  OperatorStatus,
  AdminDashboardData,
  CustomerProfile,
} from "@sadoo/types";

export const useSocket = (role: "operator" | "customer" | "admin") => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { token, user } = useAuthStore();
  const setQueue = useQueueStore((s) => s.setQueue);
  const setCurrentCall = useCallStore((s) => s.setCurrentCall);
  const updateTranscript = useCallStore((s) => s.updateTranscript);
  const setAIAnalysis = useCallStore((s) => s.setAIAnalysis);

  useEffect(() => {
    if (!token || !user) return;

    const s = io("http://localhost:3001", {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
    });

    s.on("connect", () => {
      console.log(`[Socket] ${role} connected:`, s.id);
      if (role === "operator") {
        s.emit("operator:join", { operatorId: user.id });
      }
      setSocket(s);
    });

    s.on("queue:update", (queueState: QueueState) => {
      setQueue(queueState);
    });

    if (role === "operator") {
      s.on("call:established", ({ callId }: { callId: string }) => {
        const prev = useCallStore.getState().currentCall;
        if (prev && prev.id === callId) {
          setCurrentCall({ ...prev, status: "active" });
        }
      });

      s.on("call:ended", () => {
        setCurrentCall(null);
      });
    }

    s.on("transcript:update", ({ callId, segments }: { callId: string; segments: TranscriptSegment[] }) => {
      updateTranscript(segments);
    });

    s.on("ai:analysis", ({ callId, analysis }: { callId: string; analysis: AIAnalysis }) => {
      setAIAnalysis(analysis);
    });

    s.on("disconnect", (reason) => {
      console.log(`[Socket] ${role} disconnected:`, reason);
      setSocket(null);
    });

    return () => {
      s.off("connect");
      s.off("queue:update");
      s.off("call:established");
      s.off("call:ended");
      s.off("transcript:update");
      s.off("ai:analysis");
      s.disconnect();
    };
  }, [token, user, role, setQueue, setCurrentCall, updateTranscript, setAIAnalysis]);

  const sendTranscript = useCallback((speaker: "operator" | "customer", text: string, callId: string) => {
    socket?.emit("transcript:segment", { callId, speaker, text });
  }, [socket]);

  const sendOffer = useCallback((callId: string, sdp: RTCSessionDescriptionInit) => {
    console.log(`[Socket] Sending offer for call ${callId}`);
    socket?.emit("call:offer", { callId, sdp });
  }, [socket]);

  const sendAnswer = useCallback((callId: string, sdp: RTCSessionDescriptionInit) => {
    console.log(`[Socket] Sending answer for call ${callId}`);
    socket?.emit("call:answer", { callId, sdp });
  }, [socket]);

  const sendIceCandidate = useCallback((callId: string, candidate: RTCIceCandidateInit) => {
    socket?.emit("call:ice-candidate", { callId, candidate });
  }, [socket]);

  const endCall = useCallback((callId: string) => {
    socket?.emit("call:end", { callId });
  }, [socket]);

  const changeStatus = useCallback((status: "available" | "on_call" | "busy" | "offline") => {
    socket?.emit("operator:status_change", { status });
  }, [socket]);

  const joinAsCustomer = useCallback((customerId: string, phone: string) => {
    console.log(`[Socket] Customer ${customerId} joining`);
    socket?.emit("customer:join", { customerId, phone });
  }, [socket]);

  return {
    socket,
    sendTranscript,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    endCall,
    changeStatus,
    joinAsCustomer,
  };
};
