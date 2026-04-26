import { Injectable } from "@nestjs/common";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIAnalysis, CustomerProfile, Formula, PostCallSummary } from "@sadoo/types";
import { ConfigService } from "@nestjs/config";
import { PRODUCT_KB, COMPLIANCE_CHECKLIST } from "./product-kb";

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private readonly configService: ConfigService) {
    this.genAI = new GoogleGenerativeAI(
      configService.get<string>("GEMINI_API_KEY") || "",
    );
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  // ── Detect compliance from raw transcript text ────────────────────────────
  detectCompliance(transcriptText: string): AIAnalysis["compliance"] {
    const lower = transcriptText.toLowerCase();
    return {
      interestRateDisclosed: COMPLIANCE_CHECKLIST[0].keywords.some((k) =>
        lower.includes(k.toLowerCase()),
      ),
      dataConsentObtained: COMPLIANCE_CHECKLIST[1].keywords.some((k) =>
        lower.includes(k.toLowerCase()),
      ),
      kycVerified: COMPLIANCE_CHECKLIST[2].keywords.some((k) =>
        lower.includes(k.toLowerCase()),
      ),
      purposeOfVisitConfirmed: COMPLIANCE_CHECKLIST[3].keywords.some((k) =>
        lower.includes(k.toLowerCase()),
      ),
    };
  }

  // ── Main real-time analysis during call ───────────────────────────────────
  async analyzeTranscript(
    transcript: string,
    customerProfile: CustomerProfile,
    formulas: Formula[],
    crmContext?: {
      segment: string;
      riskLevel: string;
      monthlyIncome: number;
      products: { loan: boolean; deposit: boolean; card: boolean };
      previousCalls: string;
    },
  ): Promise<AIAnalysis> {
    const formulasContext = formulas
      .slice(0, 8) // top 8 only to save tokens
      .map(
        (f) =>
          `[${f.category.toUpperCase()}] ${f.content.uz} (Success: ${Math.round(f.successRate * 100)}%)`,
      )
      .join("\n");

    const crmSection = crmContext
      ? `
Customer CRM Profile:
- Segment: ${crmContext.segment}
- Risk: ${crmContext.riskLevel}
- Monthly Income: ${crmContext.monthlyIncome.toLocaleString()} UZS
- Has Loan: ${crmContext.products.loan}, Deposit: ${crmContext.products.deposit}, Card: ${crmContext.products.card}
- Previous Calls: ${crmContext.previousCalls}
`
      : "";

    const complianceStatus = this.detectCompliance(transcript);

    const prompt = `You are a real-time AI sales copilot for a bank call center agent in Uzbekistan.
Analyze the transcript and provide instant guidance.

${crmSection}

BANK PRODUCT KNOWLEDGE BASE:
${PRODUCT_KB}

WINNING FORMULAS:
${formulasContext}

Customer Profile:
- Needs: ${customerProfile.needs.join(", ") || "Unknown"}
- Interests: ${customerProfile.productInterest.join(", ") || "Unknown"}
- Mood: ${customerProfile.mood}
- Language: ${customerProfile.language}

COMPLIANCE STATUS (already detected):
- APR Disclosed: ${complianceStatus.interestRateDisclosed}
- Data Consent: ${complianceStatus.dataConsentObtained}
- KYC Verified: ${complianceStatus.kycVerified}
- Purpose Confirmed: ${complianceStatus.purposeOfVisitConfirmed}

RECENT TRANSCRIPT:
${transcript}

Respond with ONLY valid JSON in this exact format (no markdown):
{
  "nextAction": "string - specific action agent must take RIGHT NOW",
  "suggestedScript": "string - exact words to say in the customer's language",
  "toneAdvice": "string - how to sound",
  "objectionDetected": false,
  "objectionResponse": "string - if objection detected, how to handle it",
  "recommendedProduct": "string or null - most relevant product from KB",
  "crossSellOpportunity": "string or null - cross-sell if relevant",
  "sentiment": "positive|neutral|negative",
  "salesStage": "greeting|discovery|pitch|objection|closing|complete",
  "confidence": 0.85,
  "compliance": {
    "interestRateDisclosed": ${complianceStatus.interestRateDisclosed},
    "dataConsentObtained": ${complianceStatus.dataConsentObtained},
    "kycVerified": ${complianceStatus.kycVerified},
    "purposeOfVisitConfirmed": ${complianceStatus.purposeOfVisitConfirmed}
  },
  "urgencyLevel": "low|medium|high"
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");
      const json = JSON.parse(jsonMatch[0]);
      return json as AIAnalysis;
    } catch (error) {
      console.error("Gemini analysis error:", error);
      return this.getFallbackAnalysis(complianceStatus);
    }
  }

  // ── Customer chat (waiting room) ──────────────────────────────────────────
  async chatWithCustomer(
    messages: { role: "user" | "assistant"; content: string }[],
    customerName: string,
    reason: string,
  ): Promise<string> {
    const history = messages
      .map((m) => `${m.role === "user" ? customerName : "Assistant"}: ${m.content}`)
      .join("\n");

    const prompt = `You are a friendly AI assistant for SADOO Bank's call center.
Customer: "${customerName}" | Reason: "${reason}"

Rules:
- Be warm, professional, 2-3 sentences max
- Gather more detail to help the operator
- Never give specific account info or make banking decisions
- Use the same language as the customer (Uzbek, Russian, or English)

Conversation:
${history}

Reply (just the text, no label):`;

    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text().trim();
    } catch {
      return "Thank you for that information. An operator will assist you shortly.";
    }
  }

  // ── Build customer profile from chat history ──────────────────────────────
  async buildCustomerProfile(
    chatHistory: string,
    customerName: string,
  ): Promise<CustomerProfile> {
    const prompt = `Analyze this bank customer conversation and build a profile.
Customer: ${customerName}
Chat:
${chatHistory}

Respond with ONLY JSON:
{
  "needs": ["string"],
  "productInterest": ["string"],
  "mood": "positive|neutral|negative",
  "summary": "string",
  "keywords": ["string"],
  "estimatedValue": number,
  "language": "uz|ru|en"
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON");
      return JSON.parse(jsonMatch[0]) as CustomerProfile;
    } catch {
      return {
        needs: [],
        productInterest: [],
        mood: "neutral",
        summary: "Unable to analyze profile",
        keywords: [],
        estimatedValue: 0,
        language: "uz",
      };
    }
  }

  // ── Post-call summary ─────────────────────────────────────────────────────
  async generatePostCallSummary(
    transcript: string,
    callDurationSec: number,
    customerName: string,
    operatorName: string,
    crmContext?: { segment: string; riskLevel: string },
  ): Promise<PostCallSummary> {
    const complianceStatus = this.detectCompliance(transcript);
    const complianceScore =
      (Object.values(complianceStatus).filter(Boolean).length / 4) * 100;

    const prompt = `Generate a post-call summary for a bank call center call.

Transcript:
${transcript || "No transcript available"}

Respond with ONLY JSON (no markdown):
{
  "outcome": "sale_completed|pending_callback|declined|transferred",
  "productSold": "string or null",
  "saleAmount": number or null,
  "keyTopics": ["string"],
  "customerSentiment": "positive|neutral|negative",
  "scriptAdherence": number 0-100,
  "summary": "2-3 sentence summary of the call",
  "actionItems": ["string"],
  "crmNote": "one sentence for CRM entry",
  "qualityScore": number 0-100
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON");
      const json = JSON.parse(jsonMatch[0]);

      return {
        callId: "",
        duration: callDurationSec,
        customerName,
        operatorName,
        complianceScore,
        ...json,
      } as PostCallSummary;
    } catch {
      return {
        callId: "",
        duration: callDurationSec,
        customerName,
        operatorName,
        outcome: "pending_callback",
        keyTopics: [],
        customerSentiment: "neutral",
        complianceScore,
        scriptAdherence: 70,
        summary: "Call summary could not be generated.",
        actionItems: ["Follow up with customer"],
        crmNote: "Call completed. Manual review required.",
        qualityScore: 70,
      };
    }
  }

  // ── Training mode: AI plays customer ─────────────────────────────────────
  async trainingCustomerResponse(
    agentMessage: string,
    scenario: string,
    history: string,
  ): Promise<{ reply: string; feedback: string; score: number }> {
    const prompt = `You are simulating a bank customer for agent training.
Scenario: ${scenario}
Conversation so far:
${history}
Agent just said: "${agentMessage}"

Play the customer realistically. After the customer reply, provide feedback to the trainee.

Respond with ONLY JSON:
{
  "reply": "what the customer says next",
  "feedback": "brief coaching tip for the agent (1 sentence)",
  "score": number 0-10 rating of agent's last message
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON");
      return JSON.parse(jsonMatch[0]);
    } catch {
      return {
        reply: "I'm not sure about that. Can you explain more?",
        feedback: "Try to be more specific about the product benefits.",
        score: 5,
      };
    }
  }

  private getFallbackAnalysis(
    compliance: AIAnalysis["compliance"],
  ): AIAnalysis {
    return {
      nextAction: "Continue discovery — ask about customer's primary need",
      suggestedScript: "Sizning asosiy maqsadingizni bilib olsam maylimi?",
      toneAdvice: "Be empathetic and attentive",
      objectionDetected: false,
      objectionResponse: "",
      recommendedProduct: undefined,
      crossSellOpportunity: undefined,
      sentiment: "neutral",
      salesStage: "discovery",
      confidence: 0.5,
      compliance,
      urgencyLevel: "low",
    };
  }
}
