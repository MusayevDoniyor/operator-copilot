// User types
export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR'
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  isOnline: boolean;
  currentCallId?: string;
  status: 'available' | 'on_call' | 'busy' | 'offline';
  createdAt: Date;
}

export interface AuthPayload {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

// Customer types
export interface Customer {
  id: string;
  name: string;
  phone: string;
  reason: string;
  queuePosition: number;
  joinedAt: Date;
  assignedOperatorId?: string;
  status: 'waiting' | 'in_call' | 'completed' | 'cancelled';
  profile?: CustomerProfile;
  sessionId: string;
}

export interface CustomerProfile {
  needs: string[];
  productInterest: string[];
  mood: 'positive' | 'neutral' | 'negative';
  summary: string;
  keywords: string[];
  estimatedValue: number;
  language: 'uz' | 'ru' | 'en';
}

// Queue types
export interface QueueState {
  customers: Customer[];
  totalWaiting: number;
  averageWaitTime: number;
}

// Call types
export interface Call {
  id: string;
  customerId: string;
  operatorId: string;
  status: 'ringing' | 'active' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  transcript: TranscriptSegment[];
  aiAnalysis?: AIAnalysis;
  outcome?: CallOutcome;
}

export interface TranscriptSegment {
  id: string;
  speaker: 'operator' | 'customer';
  text: string;
  timestamp: Date;
  isFinal: boolean;
}

export interface CallOutcome {
  productSold?: string;
  saleAmount?: number;
  success: boolean;
  notes: string;
}

// AI Copilot types
export interface AIAnalysis {
  nextAction: string;
  suggestedScript: string;
  toneAdvice: string;
  objectionDetected?: boolean;
  objectionResponse?: string;
  recommendedProduct?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  salesStage: 'greeting' | 'discovery' | 'pitch' | 'objection' | 'closing' | 'complete';
  confidence: number;
}

export interface Formula {
  id: string;
  name: string;
  category: 'greeting' | 'objection' | 'closing' | 'upsell' | 'retention';
  content: {
    uz: string;
    ru: string;
  };
  successRate: number;
  usageCount: number;
  tags: string[];
}

// Customer Memory
export interface CustomerMemory {
  phoneNumber: string;
  interactions: InteractionRecord[];
  totalCalls: number;
  totalPurchases: number;
  loyaltyScore: number;
  lastCallDate?: Date;
  preferences: string[];
  notes: string;
}

export interface InteractionRecord {
  callId: string;
  date: Date;
  summary: string;
  productsDiscussd: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  outcome: 'sale' | 'no_sale' | 'callback';
}

// Dashboard stats
export interface DashboardStats {
  totalCallsToday: number;
  activeCalls: number;
  queueDepth: number;
  conversionRate: number;
  avgHandleTime: number;
  avgWaitTime: number;
}

export interface OperatorStats {
  userId: string;
  username: string;
  callsToday: number;
  totalCalls: number;
  avgHandleTime: number;
  conversionRate: number;
  satisfactionScore: number;
}

export interface FormulaStats {
  formulaId: string;
  name: string;
  successRate: number;
  usageCount: number;
  category: string;
}

// Socket events
export interface SocketEvents {
  // Client -> Server
  'operator:join': { operatorId: string };
  'customer:join': { customerId: string; phone: string };
  'call:offer': { callId: string; sdp: RTCSessionDescriptionInit };
  'call:answer': { callId: string; sdp: RTCSessionDescriptionInit };
  'call:ice-candidate': { callId: string; candidate: RTCIceCandidateInit };
  'transcript:segment': { callId: string; speaker: 'operator' | 'customer', text: string };
  'queue:take_next': { operatorId: string };
  'call:end': { callId: string };
  'operator:status_change': { status: 'available' | 'on_call' | 'busy' | 'offline' };

  // Server -> Client
  'queue:update': QueueState;
  'call:incoming': Call;
  'call:established': { callId: string };
  'call:ended': { callId: string };
  'transcript:update': { callId: string; segments: TranscriptSegment[] };
  'ai:analysis': { callId: string; analysis: AIAnalysis };
  'operator:stats_update': OperatorStats;
  'admin:dashboard_data': AdminDashboardData;
}

export interface AdminDashboardData {
  operators: OperatorStatus[];
  queueDepth: number;
  activeCalls: number;
  platformStats: DashboardStats;
  formulaLeaderboard: FormulaStats[];
  operatorLeaderboard: OperatorStats[];
}

export interface OperatorStatus {
  userId: string;
  username: string;
  status: 'available' | 'on_call' | 'busy' | 'offline';
  currentCallId?: string;
  callsToday: number;
  lastActivity: Date;
}

// WebRTC
export interface PeerConnectionState {
  callId: string;
  localOffer?: RTCSessionDescriptionInit;
  remoteAnswer?: RTCSessionDescriptionInit;
  iceCandidates: RTCIceCandidateInit[];
  state: 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';
}
