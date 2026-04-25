import { Injectable } from '@nestjs/common';
import { Call, TranscriptSegment, CallOutcome } from '@sadoo/types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CallsService {
  private calls: Map<string, Call> = new Map();

  createCall(customerId: string, operatorId: string): Call {
    const call: Call = {
      id: uuidv4(),
      customerId,
      operatorId,
      status: 'ringing',
      startTime: new Date(),
      transcript: [],
    };

    this.calls.set(call.id, call);
    return call;
  }

  getCall(id: string): Call | undefined {
    return this.calls.get(id);
  }

  getAllCalls(): Call[] {
    return Array.from(this.calls.values());
  }

  getAllActiveCalls(): Call[] {
    return Array.from(this.calls.values()).filter(
      (c) => c.status === 'active' || c.status === 'ringing',
    );
  }

  getOperatorCalls(operatorId: string): Call[] {
    return Array.from(this.calls.values()).filter(
      (c) => c.operatorId === operatorId,
    );
  }

  getCustomerCalls(customerId: string): Call[] {
    return Array.from(this.calls.values()).filter(
      (c) => c.customerId === customerId,
    );
  }

  answerCall(callId: string): Call {
    const call = this.calls.get(callId);
    if (!call) throw new Error('Call not found');
    call.status = 'active';
    this.calls.set(callId, call);
    return call;
  }

  endCall(
    callId: string,
    outcome: Partial<CallOutcome>,
  ): { call: Call; duration: number } {
    const call = this.calls.get(callId);
    if (!call) throw new Error('Call not found');

    call.status = 'completed';
    call.endTime = new Date();
    call.duration = call.endTime.getTime() - call.startTime.getTime();
    if (outcome) {
      call.outcome = outcome as CallOutcome;
    }

    this.calls.set(callId, call);
    return { call, duration: call.duration };
  }

  addTranscriptSegment(
    callId: string,
    segment: Omit<TranscriptSegment, 'id' | 'timestamp'>,
  ): TranscriptSegment {
    const call = this.calls.get(callId);
    if (!call) throw new Error('Call not found');

    const newSegment: TranscriptSegment = {
      ...segment,
      id: uuidv4(),
      timestamp: new Date(),
    };

    call.transcript.push(newSegment);
    this.calls.set(callId, call);
    return newSegment;
  }

  updateTranscriptSegment(
    callId: string,
    segmentId: string,
    updates: Partial<TranscriptSegment>,
  ) {
    const call = this.calls.get(callId);
    if (!call) return;

    const segment = call.transcript.find((s) => s.id === segmentId);
    if (segment) {
      Object.assign(segment, updates);
      this.calls.set(callId, call);
    }
  }

  getTranscript(callId: string): TranscriptSegment[] {
    const call = this.calls.get(callId);
    return call ? call.transcript : [];
  }

  setAIAnalysis(callId: string, analysis: Call['aiAnalysis']) {
    const call = this.calls.get(callId);
    if (call) {
      call.aiAnalysis = analysis;
      this.calls.set(callId, call);
    }
  }
}
