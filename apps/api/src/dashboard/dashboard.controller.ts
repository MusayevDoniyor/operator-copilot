import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { DashboardService } from "./dashboard.service";
import { UserRole } from "@sadoo/types";

@ApiTags("Dashboard")
@Controller("dashboard")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("stats")
  @ApiOperation({ summary: "Get platform stats" })
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  getStats() {
    return this.dashboardService.getDashboardStats();
  }

  @Get("operators")
  @ApiOperation({ summary: "Get all operator stats (admin only)" })
  @Roles(UserRole.ADMIN)
  getOperators() {
    return this.dashboardService.getOperatorStats();
  }

  @Get("operators/:id")
  @ApiOperation({ summary: "Get specific operator stats" })
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  getOperatorById(@Param("id") id: string) {
    return this.dashboardService.getOperatorStatsById(id);
  }

  @Get("formulas")
  @ApiOperation({ summary: "Get formula leaderboard (admin only)" })
  @Roles(UserRole.ADMIN)
  getFormulas() {
    return this.dashboardService.getFormulaStats();
  }

  @Get("admin")
  @ApiOperation({ summary: "Get admin dashboard data" })
  @Roles(UserRole.ADMIN)
  getAdminDashboard() {
    return this.dashboardService.getAdminDashboardData();
  }
}
