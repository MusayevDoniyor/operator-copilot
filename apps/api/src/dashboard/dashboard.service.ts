import { Injectable } from '@nestjs/common';
import { DashboardStats, OperatorStats, FormulaStats, AdminDashboardData, OperatorStatus, User } from '@sadoo/types';
import { CallsService } from '../calls/calls.service';
import { QueueService } from '../queue/queue.service';
import { CustomersService } from '../customers/customer.service';
import { FormulasService } from '../formulas/formulas.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly callsService: CallsService,
    private readonly queueService: QueueService,
    private readonly customerService: CustomersService,
    private readonly formulasService: FormulasService,
    private readonly authService: AuthService,
  ) {}

  getDashboardStats(): DashboardStats {
    const allCalls = this.callsService.getAllCalls();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCalls = allCalls.filter(
      (c) => new Date(c.startTime) >= today && c.status === 'completed',
    );
    const activeCalls = allCalls.filter((c) => c.status === 'active');
    const queue = this.queueService.getQueueState();

    const completedCalls = allCalls.filter((c) => c.status === 'completed');
    const conversionRate =
      completedCalls.length > 0
        ? completedCalls.filter((c) => c.outcome?.success).length /
          completedCalls.length
        : 0;

    const avgHandleTime =
      completedCalls.length > 0
        ? completedCalls.reduce((acc, c) => acc + (c.duration || 0), 0) /
          completedCalls.length
        : 0;

    return {
      totalCallsToday: todayCalls.length,
      activeCalls: activeCalls.length,
      queueDepth: queue.totalWaiting,
      conversionRate,
      avgHandleTime,
      avgWaitTime: queue.averageWaitTime,
    };
  }

  getOperatorStats(): OperatorStats[] {
    const users = this.authService.getAllOperators();
    const allCalls = this.callsService.getAllCalls();

    return users.map((user) => {
      const operatorCalls = allCalls.filter(
        (c) => c.operatorId === user.id && c.status === 'completed',
      );
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCalls = operatorCalls.filter(
        (c) => new Date(c.startTime) >= today,
      );

      const totalHandleTime = operatorCalls.reduce(
        (acc, c) => acc + (c.duration || 0),
        0,
      );

      return {
        userId: user.id,
        username: user.username,
        callsToday: todayCalls.length,
        totalCalls: operatorCalls.length,
        avgHandleTime:
          operatorCalls.length > 0 ? totalHandleTime / operatorCalls.length : 0,
        conversionRate:
          operatorCalls.length > 0
            ? operatorCalls.filter((c) => c.outcome?.success).length /
              operatorCalls.length
            : 0,
        satisfactionScore: 4.5,
      };
    });
  }

  getFormulaStats(): FormulaStats[] {
    const formulas = this.formulasService.getAllFormulas();
    return formulas.map((f) => ({
      formulaId: f.id,
      name: f.name,
      successRate: f.successRate,
      usageCount: f.usageCount,
      category: f.category,
    }));
  }

  getAdminDashboardData(): AdminDashboardData {
    const operators = this.authService.getAllOperators();
    const allCalls = this.callsService.getAllCalls();

    const operatorStatuses: OperatorStatus[] = operators.map((user) => {
      const activeCall = allCalls.find(
        (c) => c.operatorId === user.id && c.status === 'active',
      );

      return {
        userId: user.id,
        username: user.username,
        status: user.status,
        currentCallId: activeCall?.id,
        callsToday: 0,
        lastActivity: new Date(),
      };
    });

    return {
      operators: operatorStatuses,
      queueDepth: this.queueService.getQueueState().totalWaiting,
      activeCalls: allCalls.filter((c) => c.status === 'active').length,
      platformStats: this.getDashboardStats(),
      formulaLeaderboard: this.getFormulaStats().sort(
        (a, b) => b.successRate - a.successRate,
      ),
      operatorLeaderboard: this.getOperatorStats().sort(
        (a, b) => b.conversionRate - a.conversionRate,
      ),
    };
  }

  getOperatorStatsById(operatorId: string): OperatorStats | undefined {
    return this.getOperatorStats().find((o) => o.userId === operatorId);
  }
}
