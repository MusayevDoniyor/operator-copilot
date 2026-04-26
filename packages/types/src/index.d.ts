export declare const UserRole: {
    readonly ADMIN: "ADMIN";
    readonly OPERATOR: "OPERATOR";
};
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
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
    crmProfile?: CrmClientProfile;
    previousCalls?: Array<{
        date: string;
        intent: string;
        result: string;
    }>;
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
export interface CrmClientProfile {
    clientCode: string;
    name: string;
    type: 'Physical' | 'Legal';
    segment: 'Mass' | 'Premium' | 'VIP';
    hasLoan: boolean;
    hasDeposit: boolean;
    hasCard: boolean;
    monthlyIncome: number;
    riskLevel: 'Low' | 'Medium' | 'High';
    lastTxnDate: string;
    phone?: string;
}
export type ClientProfile = CrmClientProfile;
export interface CallHistory {
    callId: string;
    date: string;
    durationSec: number;
    language: 'UZ' | 'RU';
    intent: string;
    clientCode: string;
    clientName: string;
    operatorId: string;
    branch: string;
    transcript: string;
    kycPassport: boolean;
    kycPinfl: boolean;
    amlPurpose: boolean;
    amlSource: boolean;
    pepCheck: boolean;
    crossSell: boolean;
    checklistScore: number;
    saleResult: 'Completed' | 'Pending' | 'Declined';
}
export interface QueueState {
    customers: Customer[];
    totalWaiting: number;
    averageWaitTime: number;
}
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
export interface ComplianceItem {
    id: string;
    label: string;
    required: boolean;
    detected: boolean;
    keywords: string[];
}
export interface AIAnalysis {
    nextAction: string;
    suggestedScript: string;
    toneAdvice: string;
    objectionDetected?: boolean;
    objectionResponse?: string;
    recommendedProduct?: string;
    crossSellOpportunity?: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    salesStage: 'greeting' | 'discovery' | 'pitch' | 'objection' | 'closing' | 'complete';
    confidence: number;
    compliance: {
        interestRateDisclosed: boolean;
        dataConsentObtained: boolean;
        kycVerified: boolean;
        purposeOfVisitConfirmed: boolean;
    };
    urgencyLevel: 'low' | 'medium' | 'high';
}
export interface PostCallSummary {
    callId: string;
    duration: number;
    customerName: string;
    operatorName: string;
    outcome: 'sale_completed' | 'pending_callback' | 'declined' | 'transferred';
    productSold?: string;
    saleAmount?: number;
    keyTopics: string[];
    customerSentiment: 'positive' | 'neutral' | 'negative';
    complianceScore: number;
    scriptAdherence: number;
    summary: string;
    actionItems: string[];
    crmNote: string;
    qualityScore: number;
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
export interface SocketEvents {
    'operator:join': {
        operatorId: string;
    };
    'customer:join': {
        customerId: string;
        phone: string;
    };
    'call:offer': {
        callId: string;
        sdp: RTCSessionDescriptionInit;
    };
    'call:answer': {
        callId: string;
        sdp: RTCSessionDescriptionInit;
    };
    'call:ice-candidate': {
        callId: string;
        candidate: RTCIceCandidateInit;
    };
    'transcript:segment': {
        callId: string;
        speaker: 'operator' | 'customer';
        text: string;
    };
    'queue:take_next': {
        operatorId: string;
    };
    'call:end': {
        callId: string;
    };
    'operator:status_change': {
        status: 'available' | 'on_call' | 'busy' | 'offline';
    };
    'queue:update': QueueState;
    'call:incoming': Call;
    'call:established': {
        callId: string;
    };
    'call:ended': {
        callId: string;
    };
    'transcript:update': {
        callId: string;
        segments: TranscriptSegment[];
    };
    'ai:analysis': {
        callId: string;
        analysis: AIAnalysis;
    };
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
    isOnline: boolean;
}
export interface PeerConnectionState {
    callId: string;
    localOffer?: RTCSessionDescriptionInit;
    remoteAnswer?: RTCSessionDescriptionInit;
    iceCandidates: RTCIceCandidateInit[];
    state: 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';
}
export interface Analytics {
    totalClients: number;
    totalCalls: number;
    intentDistribution: Record<string, number>;
    scoreDistribution: Record<string, number>;
    saleResults: {
        Completed: number;
        Pending: number;
        Declined: number;
    };
    languageDistribution: {
        UZ: number;
        RU: number;
    };
    segmentDistribution: {
        Mass: number;
        Premium: number;
        VIP: number;
    };
    topOperators: Array<{
        operatorId: string;
        avgScore: number;
        calls: number;
        conversionRate: number;
    }>;
}
