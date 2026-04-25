import { Controller, Get, Post, Body, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';
import { QueueService } from './queue.service';
import { CallsService } from '../calls/calls.service';
import { SocketGateway } from '../socket/socket.gateway';

@ApiTags('Queue')
@Controller('queue')
export class QueueController {
  constructor(
    private readonly queueService: QueueService,
    private readonly callsService: CallsService,
    private readonly socketGateway: SocketGateway,
    private readonly authService: AuthService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get current queue state' })
  getQueue() {
    return this.queueService.getQueueState();
  }

  @Public()
  @Post('join')
  @ApiOperation({ summary: 'Customer joins the queue' })
  joinQueue(@Body() body: { name: string; phone: string; reason: string }) {
    return this.queueService.addCustomer(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('next')
  @ApiOperation({ summary: 'Get next customer in queue (operator action)' })
  takeNext(@Request() req) {
    const operatorId = req.user.id;
    const customer = this.queueService.getNextCustomer();

    if (!customer) {
      return { customer: null, call: null };
    }

    // Create call record
    const call = this.callsService.createCall(customer.id, operatorId);

    // Update operator status
    this.authService.updateUserStatus(operatorId, 'on_call');

    // Broadcast updates
    this.socketGateway.broadcastQueueUpdate();
    this.socketGateway.broadcastOperatorStats(operatorId);
    this.socketGateway.broadcastOperatorStatus(operatorId, { status: 'on_call' });

    return { customer, call };
  }
}
