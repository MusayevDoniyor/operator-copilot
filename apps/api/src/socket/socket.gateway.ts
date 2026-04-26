import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { UseGuards, Inject, forwardRef } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import {
  SocketEvents,
  TranscriptSegment,
  QueueState,
  AIAnalysis,
  OperatorStatus,
  AdminDashboardData,
} from "@sadoo/types";
import { AuthService } from "../auth/auth.service";
import { QueueService } from "../queue/queue.service";
import { CallsService } from "../calls/calls.service";
import { AiService } from "../ai/ai.service";
import { CustomerService } from "../customers/customer.service";
import { DashboardService } from "../dashboard/dashboard.service";
import { FormulasService } from "../formulas/formulas.service";
import { CrmService } from "../seed/crm.service";

@WebSocketGateway({
  cors: {
    origin: "*",
    credentials: true,
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private operatorConnections: Map<string, Socket> = new Map();
  private customerConnections: Map<string, Socket> = new Map();
  private callConnections: Map<
    string,
    { operator: Socket; customer?: Socket }
  > = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    @Inject(forwardRef(() => QueueService))
    private readonly queueService: QueueService,
    private readonly callsService: CallsService,
    private readonly aiService: AiService,
    private readonly customerService: CustomerService,
    private readonly dashboardService: DashboardService,
    private readonly formulasService: FormulasService,
    private readonly crmService: CrmService,
  ) {}

  async handleConnection(client: Socket) {
    console.log("Client connected:", client.id);
  }

  handleDisconnect(client: Socket) {
    // Clean up connections
    for (const [operatorId, socket] of this.operatorConnections.entries()) {
      if (socket.id === client.id) {
        this.operatorConnections.delete(operatorId);
        this.broadcastOperatorStatus(operatorId, {
          status: "offline",
          isOnline: false,
        });
        break;
      }
    }

    for (const [customerId, socket] of this.customerConnections.entries()) {
      if (socket.id === client.id) {
        this.customerConnections.delete(customerId);
        break;
      }
    }

    // Handle call disconnection
    for (const [callId, connections] of this.callConnections.entries()) {
      if (connections.operator?.id === client.id) {
        console.log(`Operator disconnected from call ${callId}`);
        this.terminateCall(callId);
        this.callConnections.delete(callId);
        break;
      }
      if (connections.customer?.id === client.id) {
        console.log(`Customer disconnected from call ${callId}`);
        this.terminateCall(callId);
        this.callConnections.delete(callId);
        break;
      }
    }
  }

  @SubscribeMessage("operator:join")
  handleOperatorJoin(client: Socket, data: { operatorId: string }) {
    this.operatorConnections.set(data.operatorId, client);
    const user = this.authService.getUserById(data.operatorId);
    if (user) {
      user.isOnline = true;
      this.broadcastOperatorStatus(data.operatorId, {
        status: user.status,
        isOnline: true,
      });
    }
    console.log(`Operator ${data.operatorId} joined`);
  }

  @SubscribeMessage("customer:join")
  handleCustomerJoin(
    client: Socket,
    data: { customerId: string; phone: string },
  ) {
    this.customerConnections.set(data.customerId, client);
    console.log(`Customer ${data.customerId} joined`);

    // Send welcome message if customer was waiting with AI chat
    const customer = this.queueService.getCustomer(data.customerId);
    if (customer?.profile) {
      client.emit("customer:profile", customer.profile);
    }
  }

  @SubscribeMessage("call:offer")
  handleCallOffer(client: Socket, data: { callId: string; sdp: any }) {
    const call = this.callsService.getCall(data.callId);
    if (!call) return;

    // Find customer socket and forward offer
    const customerSocket = this.customerConnections.get(call.customerId);
    if (customerSocket) {
      customerSocket.emit("call:offer", data);
      this.callConnections.set(data.callId, {
        operator: client,
        customer: customerSocket,
      });
    }
  }

  @SubscribeMessage("call:answer")
  handleCallAnswer(client: Socket, data: { callId: string; sdp: any }) {
    const call = this.callsService.getCall(data.callId);
    if (!call) return;

    // Find operator socket and forward answer
    const operatorSocket = this.operatorConnections.get(call.operatorId);
    if (operatorSocket) {
      operatorSocket.emit("call:answer", data);
    }

    // Ensure callConnections tracks both sockets (customer may be the answerer)
    const existing = this.callConnections.get(data.callId);
    const resolvedOperatorSocket = operatorSocket ?? existing?.operator;
    if (resolvedOperatorSocket) {
      this.callConnections.set(data.callId, {
        operator: resolvedOperatorSocket,
        customer: client,
      });
    }

    // Mark call as active
    this.callsService.answerCall(data.callId);

    // Notify both parties call is established
    const customerSocket = this.customerConnections.get(call.customerId);
    const establishedEvent = { callId: data.callId };
    operatorSocket?.emit("call:established", establishedEvent);
    customerSocket?.emit("call:established", establishedEvent);

    this.broadcastCallStatus(data.callId);
  }

  @SubscribeMessage("call:ice-candidate")
  handleIceCandidate(client: Socket, data: { callId: string; candidate: any }) {
    const call = this.callsService.getCall(data.callId);
    if (!call) return;

    // Forward ICE candidate to other party
    const connections = this.callConnections.get(data.callId);
    if (connections) {
      const target =
        connections.operator?.id === client.id
          ? connections.customer
          : connections.operator;
      if (target) {
        target.emit("call:ice-candidate", data);
      }
    }
  }

  @SubscribeMessage("transcript:segment")
  handleTranscriptSegment(
    client: Socket,
    data: { callId: string; speaker: "operator" | "customer"; text: string },
  ) {
    // Save segment
    const segment = this.callsService.addTranscriptSegment(data.callId, {
      ...data,
      isFinal: true,
    });

    // Broadcast to all relevant parties (operator + any monitoring admins)
    const call = this.callsService.getCall(data.callId);
    if (call) {
      // Only broadcast to operator (customer should not see the transcript as per Cluely-style UX)
      const operatorSocket = this.operatorConnections.get(call.operatorId);
      if (operatorSocket) {
        operatorSocket.emit("transcript:update", {
          callId: data.callId,
          segments: this.callsService.getTranscript(data.callId),
        });
      }
    }

    // Trigger AI analysis (debounced at service level)
    this.triggerAIAnalysis(data.callId);
  }

  @SubscribeMessage("call:end")
  handleCallEndMessage(client: Socket, data: { callId: string }) {
    this.terminateCall(data.callId);
  }

  private terminateCall(callId: string) {
    const call = this.callsService.getCall(callId);
    if (!call) return;

    this.callsService.endCall(callId, {
      success: false,
    });

    // Update operator status
    const user = this.authService.getUserById(call.operatorId);
    if (user) {
      user.status = "available";
      user.currentCallId = undefined;
      this.broadcastOperatorStatus(call.operatorId, {
        status: "available",
      });
    }

    // Notify both parties
    const operatorSocket = this.operatorConnections.get(call.operatorId);
    if (operatorSocket) {
      operatorSocket.emit("call:ended", { callId });
    }

    const customerSocket = this.customerConnections.get(call.customerId);
    if (customerSocket) {
      customerSocket.emit("call:ended", { callId });
    }

    this.callConnections.delete(callId);
    this.callsService.getCall(callId); // Cleanup

    // Broadcast updates
    this.broadcastQueueUpdate();
    this.broadcastOperatorStats(call.operatorId);
  }

  @SubscribeMessage("operator:status_change")
  handleOperatorStatusChange(
    client: Socket,
    data: { status: "available" | "on_call" | "busy" | "offline" },
  ) {
    // Find operator by socket
    let operatorId: string | undefined;
    for (const [id, socket] of this.operatorConnections.entries()) {
      if (socket.id === client.id) {
        operatorId = id;
        break;
      }
    }

    if (operatorId) {
      const user = this.authService.getUserById(operatorId);
      if (user) {
        user.status = data.status;
        this.broadcastOperatorStatus(operatorId, {
          status: data.status,
        });
      }
    }
  }

  private async triggerAIAnalysis(callId: string) {
    const transcript = this.callsService.getTranscript(callId);
    if (transcript.length === 0) return;

    const call = this.callsService.getCall(callId);
    if (!call) return;

    const customer = this.customerService.getCustomer(call.customerId);
    const formulas = this.formulasService.getAllFormulas();

    const transcriptText = transcript
      .map((s) => `${s.speaker}: ${s.text}`)
      .join("\n");

    // Get CRM context if available
    let crmContext;
    if (customer?.phone) {
      const crmClient = this.crmService.getClientByPhone(customer.phone);
      if (crmClient) {
        const previousCalls = this.crmService
          .getClientCalls(crmClient.clientCode)
          .slice(0, 3)
          .map((c) => `[${c.date}] ${c.intent} → ${c.saleResult}`)
          .join("; ");
        crmContext = {
          segment: crmClient.segment,
          riskLevel: crmClient.riskLevel,
          monthlyIncome: crmClient.monthlyIncome,
          products: {
            loan: crmClient.hasLoan,
            deposit: crmClient.hasDeposit,
            card: crmClient.hasCard,
          },
          previousCalls,
        };
      }
    }

    try {
      const analysis = await this.aiService.analyzeTranscript(
        transcriptText,
        customer?.profile || {
          needs: [],
          productInterest: [],
          mood: "neutral",
          summary: "",
          keywords: [],
          estimatedValue: 0,
          language: "uz",
        },
        formulas,
        crmContext,
      );

      this.callsService.setAIAnalysis(callId, analysis);

      const operatorSocket = this.operatorConnections.get(call.operatorId);
      if (operatorSocket) {
        operatorSocket.emit("ai:analysis", { callId, analysis });
      }
    } catch (error) {
      console.error("AI analysis error:", error);
    }
  }

  public broadcastOperatorStatus(
    operatorId: string,
    status: Partial<OperatorStatus>,
  ) {
    const user = this.authService.getUserById(operatorId);
    if (!user) return;

    const statusUpdate: OperatorStatus = {
      userId: user.id,
      username: user.username,
      status: (status as any).status || user.status,
      currentCallId: user.currentCallId,
      callsToday: 0,
      lastActivity: new Date(),
      isOnline: status.isOnline ?? user.isOnline,
    };

    // Broadcast to all connected operators (for admin view)
    for (const [id, socket] of this.operatorConnections.entries()) {
      if (id !== operatorId) {
        socket.emit("operator:status_update", statusUpdate);
      }
    }
  }

  public broadcastQueueUpdate() {
    const queueState = this.queueService.getQueueState();
    for (const [id, socket] of this.operatorConnections.entries()) {
      socket.emit("queue:update", queueState);
    }
  }

  public broadcastOperatorStats(operatorId: string) {
    const stats = this.dashboardService.getOperatorStatsById(operatorId);
    if (stats) {
      const operatorSocket = this.operatorConnections.get(operatorId);
      if (operatorSocket) {
        operatorSocket.emit("operator:stats_update", stats);
      }
    }
  }

  public notifyCustomerCallStarted(
    customerId: string,
    callId: string,
    operatorId: string,
  ) {
    const customerSocket = this.customerConnections.get(customerId);
    if (customerSocket) {
      customerSocket.emit("call:incoming", { callId, customerId, operatorId });
    }
  }

  private broadcastCallStatus(callId: string) {
    const call = this.callsService.getCall(callId);
    if (!call) return;

    // Broadcast to relevant parties
    const callData = { callId, ...call };
    for (const [id, socket] of this.operatorConnections.entries()) {
      socket.emit("call:status_update", callData);
    }
  }
}
