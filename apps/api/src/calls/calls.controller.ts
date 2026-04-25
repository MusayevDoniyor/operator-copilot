import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CallsService } from './calls.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@sadoo/types';

@ApiTags('Calls')
@Controller('calls')
@UseGuards(JwtAuthGuard)
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Get('active')
  @ApiOperation({ summary: 'Get all active calls' })
  getActiveCalls() {
    return this.callsService.getAllActiveCalls();
  }

  @Get('operator/:operatorId')
  @ApiOperation({ summary: 'Get calls for specific operator' })
  getOperatorCalls(@Param('operatorId') operatorId: string) {
    return this.callsService.getOperatorCalls(operatorId);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get calls for specific customer' })
  getCustomerCalls(@Param('customerId') customerId: string) {
    return this.callsService.getCustomerCalls(customerId);
  }

  @Get(':callId')
  @ApiOperation({ summary: 'Get call by ID' })
  getCall(@Param('callId') callId: string) {
    return this.callsService.getCall(callId);
  }

  @Post(':callId/answer')
  @ApiOperation({ summary: 'Answer a ringing call' })
  answerCall(@Param('callId') callId: string) {
    return this.callsService.answerCall(callId);
  }

  @Post(':callId/end')
  @ApiOperation({ summary: 'End an active call' })
  endCall(
    @Param('callId') callId: string,
    @Body() outcome?: Partial<{ saleAmount: number; productSold: string; success: boolean; notes: string }>,
  ) {
    return this.callsService.endCall(callId, outcome);
  }
}
