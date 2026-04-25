'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './auth-store';
import { useQueueStore } from './queue-store';
import { useCallStore } from './call-store';
import {
  SocketEvents,
  TranscriptSegment,
  AIAnalysis,
  QueueState,
  OperatorStatus,
  AdminDashboardData,
  CustomerProfile,
} from '@sadoo/types';

export const useSocket = (role: 'operator' | 'customer' | 'admin') => {
  const socketRef = useRef<Socket | null>(null);
  const { token, user } = useAuthStore();
  const setQueue = useQueueStore((s) => s.setQueue);
  const setCurrentCall = useCallStore((s) => s.setCurrentCall);
  const addTranscript = useCallStore((s) => s.addTranscript);
  const updateTranscript = useCallStore((s) => s.updateTranscript);
  const setAIAnalysis = useCallStore((s) => s.setAIAnalysis);

  useEffect(() => {
    if (!token || !user) return;

    // Connect to socket server with auth token
    const socket = io('http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      if (role === 'operator') {
        socket.emit('operator:join', { operatorId: user.id });
      } else if (role === 'customer') {
        // We need customerId; in a real app would be known. For now, we can emit after page sets it via function.
        // We'll handle separately via a method.
      }
    });

    // Queue updates
    socket.on('queue:update', (queueState: QueueState) => {
      setQueue(queueState);
    });

    // Operator status updates
    socket.on('operator:status_update', (status: OperatorStatus) => {
      // Could update a global operator store if needed
    });

    // Incoming call
    socket.on('call:incoming', (data: { callId: string; customerId: string; name: string; phone: string; reason: string; operatorId: string }) => {
      // For operator: set current call
      if (role === 'operator') {
        const call = {
          id: data.callId,
          customerId: data.customerId,
          operatorId: data.operatorId,
          status: 'ringing' as const,
          startTime: new Date(),
          transcript: [],
        };
        setCurrentCall(call);
      }
    });

    // Call established
    socket.on('call:established', ({ callId }: { callId: string }) => {
      if (role === 'operator') {
        setCurrentCall((prev) =>
          prev ? { ...prev, status: 'active' } : null,
        );
      }
    });

    // Call ended
    socket.on('call:ended', ({ callId }: { callId: string }) => {
      if (role === 'operator') {
        setCurrentCall(null);
      }
    });

    // Transcript updates
    socket.on('transcript:update', ({ callId, segments }: { callId: string; segments: TranscriptSegment[] }) => {
      updateTranscript(segments);
    });

    // AI analysis
    socket.on('ai:analysis', ({ callId, analysis }: { callId: string; analysis: AIAnalysis }) => {
      setAIAnalysis(analysis);
    });

    // Admin dashboard data
    socket.on('admin:dashboard_data', (data: AdminDashboardData) => {
      // Update admin store if needed
    });

    // Customer profile
    socket.on('customer:profile', (profile: CustomerProfile) => {
      // Could update customer store
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user, role]);

  // Helper: send transcript segment
  const sendTranscript = (speaker: 'operator' | 'customer', text: string, callId: string) => {
    socketRef.current?.emit('transcript:segment', { callId, speaker, text });
  };

  // Helper: send WebRTC offer
  const sendOffer = (callId: string, sdp: RTCSessionDescriptionInit) => {
    socketRef.current?.emit('call:offer', { callId, sdp });
  };

  // Helper: send answer
  const sendAnswer = (callId: string, sdp: RTCSessionDescriptionInit) => {
    socketRef.current?.emit('call:answer', { callId, sdp });
  };

  // Helper: send ICE candidate
  const sendIceCandidate = (callId: string, candidate: RTCIceCandidateInit) => {
    socketRef.current?.emit('call:ice-candidate', { callId, candidate });
  };

  // Helper: end call
  const endCall = (callId: string) => {
    socketRef.current?.emit('call:end', { callId });
  };

  // Helper: change operator status
  const changeStatus = (status: 'available' | 'on_call' | 'busy' | 'offline') => {
    socketRef.current?.emit('operator:status_change', { status });
  };

  return {
    socket: socketRef.current,
    sendTranscript,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    endCall,
    changeStatus,
  };
};
