import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CrmService } from "./crm.service";
import { AnalyticsService } from "./analytics.service";

@ApiTags("CRM")
@Controller("crm")
@UseGuards(JwtAuthGuard)
export class CrmController {
  constructor(
    private readonly crmService: CrmService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get("client/:code")
  @ApiOperation({ summary: "Get client by client code" })
  getClient(@Param("code") code: string) {
    return this.crmService.getClientByCode(code);
  }

  @Get("client-by-phone")
  @ApiOperation({ summary: "Get client by phone number" })
  getClientByPhone(@Query("phone") phone: string) {
    return this.crmService.getClientByPhone(phone);
  }

  @Get("client/:code/calls")
  @ApiOperation({ summary: "Get call history for a client" })
  getClientCalls(@Param("code") code: string) {
    return this.crmService.getClientCalls(code);
  }

  @Get("client/:code/profile")
  @ApiOperation({ summary: "Get compact client profile for AI context" })
  getClientProfile(@Param("code") code: string) {
    const client = this.crmService.getClientByCode(code);
    if (!client) return null;
    return {
      name: client.name,
      segment: client.segment,
      riskLevel: client.riskLevel,
      monthlyIncome: client.monthlyIncome,
      products: {
        loan: client.hasLoan,
        deposit: client.hasDeposit,
        card: client.hasCard,
      },
      lastTxnDate: client.lastTxnDate,
    };
  }

  @Get("call/:callId")
  @ApiOperation({ summary: "Get detailed call record" })
  getCall(@Param("callId") callId: string) {
    return this.crmService.getCallHistory(callId);
  }

  @Get("analytics")
  @ApiOperation({ summary: "Get comprehensive CRM analytics" })
  getAnalytics() {
    return this.analyticsService.getDashboardAnalytics();
  }

  @Get("analytics/funnel")
  @ApiOperation({ summary: "Get conversion funnel data" })
  getFunnel() {
    return this.analyticsService.getConversionFunnel();
  }

  @Get("analytics/top-intents")
  @ApiOperation({ summary: "Top call intents" })
  getTopIntents(@Query("limit") limit?: string) {
    return this.analyticsService.getTopIntentCategories(
      parseInt(limit || "10"),
    );
  }

  @Get("analytics/operators")
  @ApiOperation({ summary: "Top operators by performance" })
  getTopOperators() {
    return this.analyticsService.getDashboardAnalytics().topOperators;
  }
}
