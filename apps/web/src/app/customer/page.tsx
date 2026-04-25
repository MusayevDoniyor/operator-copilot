'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueueStore } from '@/stores/queue-store';
import { useSocket } from '@/stores/socket-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Phone, Loader2 } from 'lucide-react';

export default function CustomerPage() {
  const router = useRouter();
  const { socket } = useSocket('customer');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [step, setStep] = useState<'form' | 'waiting' | 'chat' | 'incall'>('form');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  // Socket connection for customer
  useEffect(() => {
    if (!socket || !customerId) return;

    // Join as customer
    socket.emit('customer:join', { customerId, phone });

    // Listen for incoming call
    const handleIncoming = (data: { callId: string; operatorId: string }) => {
      if (data.customerId === customerId) {
        // Transition to in-call
        setStep('incall');
      }
    };

    socket.on('call:incoming', handleIncoming);
    return () => {
      socket.off('call:incoming', handleIncoming);
    };
  }, [socket, customerId]);

  const handleJoinQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/queue/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, reason }),
      });
      if (res.ok) {
        const customer = await res.json();
        setCustomerId(customer.id);
        setStep('waiting');
      }
    } catch (error) {
      console.error('Error joining queue:', error);
    }
  };

  const callOperator = async () => {
    setIsConnecting(true);
    // Simulate call connection via WebRTC; for demo we'd establish media and socket signalling
    setTimeout(() => {
      setIsConnecting(false);
      setStep('incall');
    }, 2000);
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage;
    setChatHistory((prev) => [...prev, { role: 'user', content: userMsg }]);
    setChatMessage('');

    try {
      const token = ''; // no auth needed for customer chat? We'll have a separate endpoint later; for now mock
      // In real app, there would be an endpoint for AI chat during wait
      // For demo, just echo
      setTimeout(() => {
        setChatHistory((prev) => [
          ...prev,
          { role: 'assistant', content: 'Thank you for that information. An operator will be with you shortly.' },
        ]);
      }, 800);
    } catch (error) {
      console.error('Chat error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Phone className="h-6 w-6" />
          </div>
          <CardTitle>SADOO Call Center</CardTitle>
          <p className="text-sm text-muted-foreground">
            {step === 'form' && 'Enter your details to join the queue'}
            {step === 'waiting' && 'You are in the queue. An operator will join shortly.'}
            {step === 'chat' && 'Chat with our AI while you wait'}
            {step === 'incall' && 'Your call is now connected!'}
          </p>
        </CardHeader>
        <CardContent>
          {step === 'form' && (
            <form onSubmit={handleJoinQueue} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for calling</Label>
                <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full">Join Queue</Button>
            </form>
          )}

          {step === 'waiting' && (
            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="inline-block h-16 w-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="mt-4 text-muted-foreground">Waiting for an operator...</p>
                <p className="text-2xl font-bold mt-2">Position: 1</p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setStep('chat')}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat with AI while waiting
              </Button>
            </div>
          )}

          {step === 'chat' && (
            <div className="space-y-4">
              <div className="h-64 overflow-y-auto border border-background-border rounded-lg p-3 space-y-2">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`rounded-lg px-3 py-2 max-w-[80%] ${
                      msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background-secondary border border-background-border'
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                />
                <Button onClick={sendChatMessage}>Send</Button>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep('waiting')}>
                Back to waiting
              </Button>
            </div>
          )}

          {step === 'incall' && (
            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="inline-block h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Phone className="h-8 w-8 text-emerald-500" />
                </div>
                <p className="mt-4 font-medium">Your call is now connected</p>
                <p className="text-sm text-muted-foreground">Speak with your operator</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
