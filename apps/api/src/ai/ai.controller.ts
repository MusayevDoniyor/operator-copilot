import { Controller, Post, Get, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Public } from "../auth/decorators/public.decorator";
import { AiService } from "./ai.service";
import { CustomerService } from "../customers/customer.service";
import { FormulasService } from "../formulas/formulas.service";
import { CrmService } from "../seed/crm.service";
import { CallsService } from "../calls/calls.service";
import { AuthService } from "../auth/auth.service";

@ApiTags("AI")
@Controller("ai")
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly customerService: CustomerService,
    private readonly formulasService: FormulasService,
    private readonly crmService: CrmService,
    private readonly callsService: CallsService,
    private readonly authService: AuthService,
  ) {}

  // ── Public: customer waiting room AI chat ─────────────────────────────────
  @Public()
  @Post("chat")
  @ApiOperation({ summary: "AI chat for customer in waiting room" })
  async customerChat(
    @Body()
    body: {
      messages: { role: "user" | "assistant"; content: string }[];
      customerName: string;
      reason: string;
    },
  ) {
    const reply = await this.aiService.chatWithCustomer(
      body.messages,
      body.customerName,
      body.reason,
    );
    return { reply };
  }

  // ── Analyze transcript (called by socket gateway, but also exposed) ───────
  @Post("analyze")
  @ApiOperation({ summary: "Analyze transcript in real-time" })
  async analyze(
    @Body()
    body: {
      callId: string;
      transcript: string;
      customerId: string;
      crmContext?: {
        segment: string;
        riskLevel: string;
        monthlyIncome: number;
        products: { loan: boolean; deposit: boolean; card: boolean };
        previousCalls: string;
      };
    },
  ) {
    const customer = this.customerService.getCustomer(body.customerId);
    const formulas = this.formulasService.getAllFormulas();

    let crmContext = body.crmContext;
    if (!crmContext && customer) {
      const crmProfile = this.crmService.getClientByPhone(customer.phone || "");
      if (crmProfile) {
        const previousCalls = this.crmService
          .getClientCalls(crmProfile.clientCode)
          .slice(0, 3)
          .map((c) => `[${c.date}] ${c.intent} - ${c.saleResult}`)
          .join("; ");
        crmContext = {
          segment: crmProfile.segment,
          riskLevel: crmProfile.riskLevel,
          monthlyIncome: crmProfile.monthlyIncome,
          products: {
            loan: crmProfile.hasLoan,
            deposit: crmProfile.hasDeposit,
            card: crmProfile.hasCard,
          },
          previousCalls,
        };
      }
    }

    return this.aiService.analyzeTranscript(
      body.transcript,
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
  }

  // ── Post-call summary ─────────────────────────────────────────────────────
  @Post("summary/:callId")
  @ApiOperation({ summary: "Generate post-call summary" })
  async generateSummary(@Param("callId") callId: string) {
    const call = this.callsService.getCall(callId);
    if (!call) return { error: "Call not found" };

    const customer = this.customerService.getCustomer(call.customerId);
    const operator = this.authService.getUserById(call.operatorId);

    const transcriptText = call.transcript
      .map((s) => `[${s.speaker.toUpperCase()}]: ${s.text}`)
      .join("\n");

    const durationSec = call.endTime
      ? Math.round((call.endTime.getTime() - call.startTime.getTime()) / 1000)
      : 0;

    const summary = await this.aiService.generatePostCallSummary(
      transcriptText,
      durationSec,
      customer?.name || "Unknown Customer",
      operator?.username || "Unknown Operator",
    );

    summary.callId = callId;
    return summary;
  }

  // ── Training mode: AI plays customer ─────────────────────────────────────
  @Post("training/respond")
  @ApiOperation({ summary: "Training mode — AI plays customer" })
  async trainingRespond(
    @Body()
    body: {
      agentMessage: string;
      scenario: string;
      history: string;
    },
  ) {
    return this.aiService.trainingCustomerResponse(
      body.agentMessage,
      body.scenario,
      body.history,
    );
  }

  // ── Build customer profile from chat ──────────────────────────────────────
  @Post("profile")
  @ApiOperation({ summary: "Build customer profile from chat history" })
  async buildProfile(
    @Body() body: { chatHistory: string; customerName: string },
  ) {
    return this.aiService.buildCustomerProfile(
      body.chatHistory,
      body.customerName,
    );
  }
}
