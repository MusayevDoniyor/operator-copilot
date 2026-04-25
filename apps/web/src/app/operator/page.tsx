'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useQueueStore } from '@/stores/queue-store';
import { useCallStore } from '@/stores/call-store';
import { useSocket } from '@/stores/socket-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
} from 'lucide-react';
import { Customer, AIAnalysis } from '@sadoo/types';

export default function OperatorDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const queue = useQueueStore((s) => s.queue);
  const { socket, sendTranscript, sendOffer, sendAnswer, sendIceCandidate, endCall, changeStatus } = useSocket('operator');
  const currentCall = useCallStore((s) => s.currentCall);
  const transcript = useCallStore((s) => s.transcript);
  const aiAnalysis = useCallStore((s) => s.aiAnalysis);
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState<'available' | 'on_call' | 'busy' | 'offline'>('available');
  const [customerProfile, setCustomerProfile] = useState<Customer | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    // For demo: get queue updates from socket
  }, [user]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US'; // Could switch based on customer language

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript && currentCall) {
          sendTranscript('operator', finalTranscript, currentCall.id);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [currentCall, sendTranscript]);

  // Stop recognition when call ends
  useEffect(() => {
    if (!currentCall && recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [currentCall, isListening]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Listen for call:answer (customer accepted offer)
  useEffect(() => {
    if (!socket) return;

    const handleAnswer = (data: { callId: string; sdp: RTCSessionDescriptionInit }) => {
      if (peerConnectionRef.current && data.callId === currentCall?.id) {
        peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
      }
    };

    socket.on('call:answer', handleAnswer);
    return () => {
      socket.off('call:answer', handleAnswer);
    };
  }, [socket, currentCall]);

  const handleTakeNext = async () => {
    try {
      const res = await fetch('http://localhost:3001/queue/next', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!res.ok) {
        alert('No customers in queue');
        return;
      }
      const data = await res.json();
      // The call is created server-side but we already set via socket events
      // Just ensure local state is set via socket 'call:incoming' event which will fire automatically.
    } catch (error) {
      console.error('Error taking next call:', error);
    }
  };

  const handleEndCall = async () => {
    if (!currentCall) return;
    try {
      await fetch(`http://localhost:3001/calls/${currentCall.id}/end`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      endCall(currentCall.id);
      // Also stop tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  const startWebRTC = async () => {
    if (!currentCall) return;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    peerConnectionRef.current = pc;

    // Get local media
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    } catch (err) {
      console.error('Failed to get user media:', err);
      return;
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendIceCandidate(currentCall.id, event.candidate.toJSON());
      }
    };

    pc.ontrack = (event) => {
      // Play remote audio
      const remoteAudio = document.getElementById('remote-audio') as HTMLAudioElement;
      if (remoteAudio && event.streams[0]) {
        remoteAudio.srcObject = event.streams[0];
      }
    };

    // Create offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendOffer(currentCall.id, offer);
  };

  useEffect(() => {
    if (currentCall && currentCall.status === 'ringing') {
      // Auto-answer for demo? For simplicity, automatically start WebRTC handshake when call is ringing
      startWebRTC();
    }
  }, [currentCall]);

  const handleToggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const handleStatusChange = (newStatus: typeof status) => {
    setStatus(newStatus);
    changeStatus(newStatus);
  };

  const handleSimulateCustomer = () => {
    setIsDemoMode(!isDemoMode);
  };

  if (!user) return null;

  const ai = aiAnalysis;

  return (
    <div className="flex h-screen bg-background">
      {/* Hidden audio element for remote stream */}
      <audio id="remote-audio" autoPlay />

      {/* Left Panel */}
      <div className="w-80 border-r border-background-border bg-background-secondary flex flex-col">
        <div className="p-4 border-b border-background-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm text-muted-foreground">Welcome back</h2>
              <p className="font-semibold">{user.username}</p>
            </div>
            <Badge variant={status === 'available' ? 'success' : status === 'on_call' ? 'warning' : 'secondary'}>
              {status.replace('_', ' ')}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={status === 'available' ? 'default' : 'outline'}
              onClick={() => handleStatusChange('available')}
              className="flex-1"
            >
              Available
            </Button>
            <Button
              size="sm"
              variant={status === 'busy' ? 'default' : 'outline'}
              onClick={() => handleStatusChange('busy')}
              className="flex-1"
            >
              Busy
            </Button>
          </div>
        </div>

        {/* Queue List */}
        <div className="flex-1 overflow-hidden">
          <div className="p-4">
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Queue ({queue.totalWaiting})
            </h3>
          </div>
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="px-4 space-y-2">
              {queue.customers.map((customer) => (
                <Card key={customer.id} className="bg-background border-background-border">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.reason}</p>
                        <p className="text-xs text-muted-foreground">Wait: {Math.floor((Date.now() - new Date(customer.joinedAt).getTime())/60000)}m</p>
                      </div>
                      <Badge variant="outline">#{customer.queuePosition}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {queue.customers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Queue is empty</p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Take Next & Demo */}
        <div className="p-4 space-y-2 border-t border-background-border">
          <Button onClick={handleTakeNext} className="w-full" disabled={status !== 'available' || queue.totalWaiting === 0}>
            <Phone className="h-4 w-4 mr-2" />
            Take Next Call
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSimulateCustomer}
            className="w-full"
          >
            {isDemoMode ? 'Hide' : 'Show'} Customer View
          </Button>
        </div>
      </div>

      {/* Center Panel: Transcript */}
      <div className="flex-1 flex flex-col">
        {currentCall ? (
          <>
            <div className="p-4 border-b border-background-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{customerProfile?.name || 'Customer'}</p>
                  <p className="text-sm text-muted-foreground">{currentCall.status}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handleToggleMute}>
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button variant="destructive" size="icon" onClick={handleEndCall}>
                  <PhoneOff className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-3xl mx-auto">
                {transcript.map((segment) => (
                  <div
                    key={segment.id}
                    className={`flex ${segment.speaker === 'operator' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        segment.speaker === 'operator'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background-secondary border border-background-border'
                      }`}
                    >
                      <p className="text-sm">{segment.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(segment.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Quick Replies */}
            {ai?.suggestedScript && (
              <div className="p-4 border-t border-background-border bg-background-secondary">
                <div className="max-w-3xl mx-auto">
                  <p className="text-xs text-muted-foreground mb-2">SUGGESTED SCRIPT</p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className="flex-1 text-left justify-start h-auto py-2"
                      onClick={() => {
                        // Insert script into transcript as operator message (will send via socket)
                        // Simplified: Just log for now
                        console.log('Quick reply:', ai.suggestedScript);
                      }}
                    >
                      {ai.suggestedScript}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Phone className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No active call</p>
              <p className="text-sm">Take a call from the queue to begin</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel: AI Copilot */}
      <div className="w-96 border-l border-background-border bg-background-secondary p-4 overflow-y-auto">
        <h2 className="font-semibold mb-4">AI Copilot</h2>

        {currentCall ? (
          <div className="space-y-4">
            {ai ? (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-success" />
                      Next Action
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{ai.nextAction}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Suggested Script
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm italic">"{ai.suggestedScript}"</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Tone Advice</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{ai.toneAdvice}</p>
                  </CardContent>
                </Card>

                {ai.objectionDetected && (
                  <Card className="border-warning">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-warning">
                        <AlertTriangle className="h-4 w-4" />
                        Objection Detected
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{ai.objectionResponse}</p>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Card>
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground">Sentiment</p>
                      <p className="text-sm font-medium capitalize">{ai.sentiment}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground">Stage</p>
                      <p className="text-sm font-medium capitalize">{ai.salesStage.replace('_', ' ')}</p>
                    </CardContent>
                  </Card>
                </div>

                {ai.recommendedProduct && (
                  <Card className="border-primary">
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground">Recommended Product</p>
                      <p className="text-sm font-medium">{ai.recommendedProduct}</p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>AI analysis will appear here...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Start a call to see AI recommendations</p>
          </div>
        )}
      </div>

      {/* Demo Mode Customer Simulator */}
      {isDemoMode && (
        <div className="fixed bottom-0 right-0 w-96 h-96 bg-background-secondary border-t border-l border-background-border shadow-xl z-50 flex flex-col">
          <div className="p-3 border-b border-background-border flex items-center justify-between">
            <h3 className="font-medium">Customer Simulator</h3>
            <Button variant="ghost" size="icon" onClick={() => setIsDemoMode(false)}>
              <PhoneOff className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            <div className="text-xs text-muted-foreground">
              <p>Simulates customer waiting and call.</p>
              <p>Uses AI chat to build profile.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={async () => {
                // Simulate customer joining queue
                await fetch('http://localhost:3001/queue/join', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: 'Demo Customer',
                    phone: '+998901234567',
                    reason: 'Credit card inquiry',
                  }),
                });
                alert('Customer joined queue');
              }}
            >
              Join Queue
            </Button>
            <p className="text-xs text-muted-foreground">After operator takes call, you'll see incoming call UI.</p>
          </div>
        </div>
      )}
    </div>
  );
}
