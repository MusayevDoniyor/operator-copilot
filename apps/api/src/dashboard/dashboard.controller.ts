import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get platform stats' })
  @Roles('ADMIN', 'OPERATOR')
  getStats() {
    return this.dashboardService.getDashboardStats();
  }

  @Get('operators')
  @ApiOperation({ summary: 'Get all operator stats (admin only)' })
  @Roles('ADMIN')
  getOperators() {
    return this.dashboardService.getOperatorStats();
  }

  @Get('operators/:id')
  @ApiOperation({ summary: 'Get specific operator stats' })
  @Roles('ADMIN', 'OPERATOR')
  getOperatorById(@Param('id') id: string) {
    return this.dashboardService.getOperatorStatsById(id);
  }

  @Get('formulas')
  @ApiOperation({ summary: 'Get formula leaderboard (admin only)' })
  @Roles('ADMIN')
  getFormulas() {
    return this.dashboardService.getFormulaStats();
  }

  @Get('admin')
  @ApiOperation({ summary: 'Get admin dashboard data' })
  @Roles('ADMIN')
  getAdminDashboard() {
    return this.dashboardService.getAdminDashboardData();
  }
}
