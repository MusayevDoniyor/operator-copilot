import { Injectable } from "@nestjs/common";
import { CrmService } from "./crm.service";

@Injectable()
export class AnalyticsService {
  constructor(private readonly crmService: CrmService) {}

  getDashboardAnalytics() {
    return this.crmService.getAnalytics();
  }

  getSegmentStats() {
    return this.crmService.getSegmentStats();
  }

  getRiskStats() {
    return this.crmService.getRiskStats();
  }

  getCallHistory(limit = 50) {
    const calls = this.crmService.getAllCalls();
    return calls.slice(0, limit);
  }

  getClientHistory(clientCode: string) {
    return this.crmService.getClientCalls(clientCode);
  }

  getTopIntentCategories(limit = 10) {
    const analytics = this.crmService.getAnalytics();
    return Object.entries(analytics.intentDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([intent, count]) => ({ intent, count }));
  }

  getConversionFunnel() {
    const analytics = this.crmService.getAnalytics();
    const total = analytics.totalCalls;
    return {
      totalCalls: total,
      connected: Math.round(total * 0.85),
      qualified: Math.round(total * 0.65),
      converted: analytics.saleResults.Completed,
      declined: analytics.saleResults.Declined,
    };
  }
}
