import { create } from 'zustand';
import { Call, TranscriptSegment, AIAnalysis, CrmClientProfile } from '@sadoo/types';

interface CallStore {
  currentCall: Call | null;
  transcript: TranscriptSegment[];
  aiAnalysis: AIAnalysis | null;
  crmProfile: CrmClientProfile | null;
  previousCalls: Array<{ date: string; intent: string; result: string }>;
  setCurrentCall: (call: Call | null, enriched?: { crmProfile?: CrmClientProfile; previousCalls?: Array<{ date: string; intent: string; result: string }> }) => void;
  addTranscript: (segment: TranscriptSegment) => void;
  updateTranscript: (segments: TranscriptSegment[]) => void;
  setAIAnalysis: (analysis: AIAnalysis | null) => void;
  resetCall: () => void;
}

export const useCallStore = create<CallStore>((set) => ({
  currentCall: null,
  transcript: [],
  aiAnalysis: null,
  crmProfile: null,
  previousCalls: [],
  setCurrentCall: (call, enriched) => {
    set({
      currentCall: call,
      transcript: call ? call.transcript : [],
      aiAnalysis: call?.aiAnalysis || null,
      crmProfile: enriched?.crmProfile || null,
      previousCalls: enriched?.previousCalls || [],
    });
  },
  addTranscript: (segment) =>
    set((state) => ({
      transcript: [...state.transcript, segment],
    })),
  updateTranscript: (segments) => set({ transcript: segments }),
  setAIAnalysis: (analysis) => set({ aiAnalysis: analysis }),
  resetCall: () =>
    set({
      currentCall: null,
      transcript: [],
      aiAnalysis: null,
      crmProfile: null,
      previousCalls: [],
    }),
}));
