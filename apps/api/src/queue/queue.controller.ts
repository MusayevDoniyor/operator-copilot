import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  UseGuards,
  Inject,
  forwardRef,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import { Public } from "../auth/decorators/public.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AuthService } from "../auth/auth.service";
import { QueueService } from "./queue.service";
import { CallsService } from "../calls/calls.service";
import { SocketGateway } from "../socket/socket.gateway";
import { CrmService } from "../seed/crm.service";

@ApiTags("Queue")
@Controller("queue")
export class QueueController {
  constructor(
    private readonly queueService: QueueService,
    private readonly callsService: CallsService,
    @Inject(forwardRef(() => SocketGateway))
    private readonly socketGateway: SocketGateway,
    private readonly authService: AuthService,
    private readonly crmService: CrmService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Get current queue state" })
  getQueue() {
    return this.queueService.getQueueState();
  }

  @Public()
  @Post("join")
  @ApiOperation({ summary: "Customer joins the queue" })
  joinQueue(@Body() body: { name: string; phone: string; reason: string }) {
    const customer = this.queueService.addCustomer(body);
    // Broadcast updated queue to operators
    this.socketGateway.broadcastQueueUpdate();
    return customer;
  }

  @UseGuards(JwtAuthGuard)
  @Get("next")
  @ApiOperation({ summary: "Get next customer in queue (operator action)" })
  takeNext(@Request() req: any) {
    const operatorId = req.user.id;
    const customer = this.queueService.getNextCustomer();

    if (!customer) {
      return { customer: null, call: null };
    }

    // Look up CRM profile by phone
    const crmProfile = this.crmService.getClientByPhone(customer.phone);

    // Enrich customer with CRM data
    const previousCalls = crmProfile
      ? this.crmService
          .getClientCalls(crmProfile.clientCode)
          .slice(0, 3)
          .map((c) => ({
            date: c.date,
            intent: c.intent,
            result: c.saleResult,
          }))
      : [];

    const enrichedCustomer = {
      ...customer,
      crmProfile,
      previousCalls,
    };

    // Create call record
    const call = this.callsService.createCall(customer.id, operatorId);

    // Notify the specific customer their call has been picked up
    this.socketGateway.notifyCustomerCallStarted(customer.id, call.id, operatorId);

    // Update operator status
    this.authService.updateUserStatus(operatorId, "on_call");

    // Broadcast updates
    this.socketGateway.broadcastQueueUpdate();
    this.socketGateway.broadcastOperatorStats(operatorId);
    this.socketGateway.broadcastOperatorStatus(operatorId, {
      status: "on_call",
    });

    return { customer: enrichedCustomer, call };
  }
}
