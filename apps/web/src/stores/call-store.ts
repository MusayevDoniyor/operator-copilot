import { create } from 'zustand';
import { Call, TranscriptSegment, AIAnalysis } from '@sadoo/types';

interface CallStore {
  currentCall: Call | null;
  transcript: TranscriptSegment[];
  aiAnalysis: AIAnalysis | null;
  setCurrentCall: (call: Call | null) => void;
  addTranscript: (segment: TranscriptSegment) => void;
  updateTranscript: (segments: TranscriptSegment[]) => void;
  setAIAnalysis: (analysis: AIAnalysis | null) => void;
  resetCall: () => void;
}

export const useCallStore = create<CallStore>((set) => ({
  currentCall: null,
  transcript: [],
  aiAnalysis: null,
  setCurrentCall: (call) => {
    set({
      currentCall: call,
      transcript: call ? call.transcript : [],
      aiAnalysis: call?.aiAnalysis || null,
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
    }),
}));
