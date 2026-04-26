import { Injectable } from "@nestjs/common";
import { ClientProfile, CallHistory, Analytics } from "@sadoo/types";

@Injectable()
export class CrmService {
  private clients = new Map<string, ClientProfile>();
  private calls = new Map<string, CallHistory>();
  private _isSeeded = false;

  initialize(clients: ClientProfile[], calls: CallHistory[]) {
    this.clients.clear();
    this.calls.clear();

    clients.forEach((client) => {
      this.clients.set(client.clientCode, client);
    });

    calls.forEach((call) => {
      this.calls.set(call.callId, call);
    });

    this._isSeeded = true;
    console.log(
      `✅ CRM initialized: ${clients.length} clients, ${calls.length} calls`,
    );
  }

  getClientByCode(clientCode: string): ClientProfile | undefined {
    return this.clients.get(clientCode);
  }

  getClientByPhone(phone: string): ClientProfile | undefined {
    const normalizedPhone = phone.replace(/\D/g, "");
    for (const client of this.clients.values()) {
      if (client.phone && client.phone.replace(/\D/g, "") === normalizedPhone) {
        return client;
      }
    }
    return undefined;
  }

  getClientCalls(clientCode: string): CallHistory[] {
    const result: CallHistory[] = [];
    this.calls.forEach((call) => {
      if (call.clientCode === clientCode) {
        result.push(call);
      }
    });
    return result.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  getCallHistory(callId: string): CallHistory | undefined {
    return this.calls.get(callId);
  }

  getAllCalls(): CallHistory[] {
    return Array.from(this.calls.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  getAnalytics(): Analytics {
    const clients = Array.from(this.clients.values());
    const calls = Array.from(this.calls.values());

    // Intent distribution
    const intentCounts: Record<string, number> = {};
    calls.forEach((c) => {
      intentCounts[c.intent] = (intentCounts[c.intent] || 0) + 1;
    });

    // Score distribution
    const scoreRanges = { "0-50": 0, "51-70": 0, "71-83": 0, "84-100": 0 };
    calls.forEach((c) => {
      if (c.checklistScore <= 50) scoreRanges["0-50"]++;
      else if (c.checklistScore <= 70) scoreRanges["51-70"]++;
      else if (c.checklistScore <= 83) scoreRanges["71-83"]++;
      else scoreRanges["84-100"]++;
    });

    // Sale result breakdown
    const saleResults = {
      Completed: calls.filter((c) => c.saleResult === "Completed").length,
      Pending: calls.filter((c) => c.saleResult === "Pending").length,
      Declined: calls.filter((c) => c.saleResult === "Declined").length,
    };

    // Language distribution
    const languageDist = {
      UZ: calls.filter((c) => c.language === "UZ").length,
      RU: calls.filter((c) => c.language === "RU").length,
    };

    // Segment distribution
    const segmentDist = {
      Mass: clients.filter((c) => c.segment === "Mass").length,
      Premium: clients.filter((c) => c.segment === "Premium").length,
      VIP: clients.filter((c) => c.segment === "VIP").length,
    };

    // Top operators by average checklist score
    const operatorStats: Record<
      string,
      { total: number; count: number; completed: number }
    > = {};
    calls.forEach((c) => {
      if (!operatorStats[c.operatorId]) {
        operatorStats[c.operatorId] = { total: 0, count: 0, completed: 0 };
      }
      operatorStats[c.operatorId].total += c.checklistScore;
      operatorStats[c.operatorId].count++;
      if (c.saleResult === "Completed") {
        operatorStats[c.operatorId].completed++;
      }
    });

    const topOperators = Object.entries(operatorStats)
      .map(([operatorId, data]) => ({
        operatorId,
        avgScore: Math.round(data.total / data.count),
        calls: data.count,
        conversionRate: Math.round((data.completed / data.count) * 100),
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 10);

    return {
      totalClients: clients.length,
      totalCalls: calls.length,
      intentDistribution: intentCounts,
      scoreDistribution: scoreRanges,
      saleResults,
      languageDistribution: languageDist,
      segmentDistribution: segmentDist,
      topOperators,
    };
  }

  getSegmentStats() {
    const clients = Array.from(this.clients.values());
    return {
      mass: clients.filter((c) => c.segment === "Mass").length,
      premium: clients.filter((c) => c.segment === "Premium").length,
      vip: clients.filter((c) => c.segment === "VIP").length,
    };
  }

  getRiskStats() {
    const clients = Array.from(this.clients.values());
    return {
      low: clients.filter((c) => c.riskLevel === "Low").length,
      medium: clients.filter((c) => c.riskLevel === "Medium").length,
      high: clients.filter((c) => c.riskLevel === "High").length,
    };
  }

  isSeeded(): boolean {
    return this._isSeeded;
  }
}
